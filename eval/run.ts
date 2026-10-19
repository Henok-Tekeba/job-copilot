/**
 * Eval runner. Measures the engine against human-audited labels.
 *
 *   npx tsx eval/run.ts            → dev set only (tuning allowed)
 *   npm run eval:dev               → same thing
 *   npm run eval:final             → test set. Refuses to run unless
 *                                    eval/results/label_audit.json exists.
 *                                    --unaudited overrides, and stamps every
 *                                    output "labels unaudited".
 *
 * Hard rules this file enforces mechanically:
 *  - Label files are hashed at the start of every run and the hash is written
 *    into the results. Any change to labels shows up as a hash change.
 *  - The test set is only ever touched by eval:final, once per engine version,
 *    and every such run is logged in eval/results/test_runs.log.
 *  - Every metric carries n and a 95% Wilson interval (eval/stats.ts).
 *  - Nothing is ever invented: every number in the UI comes from these files.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { detectTextStance } from "../engine/textStance";
import { combineVerdict } from "../engine/verdict";
import { matchCompany, normaliseCompanyName, type CompanyRecordLike } from "../engine/companyName";
import { ENGINE_VERSION } from "../engine/version";
import { precision, recall, wilson95, type Interval } from "./stats";

const ROOT = process.cwd();
const POSTINGS = path.join(ROOT, "eval", "postings.jsonl");
const LABELS = path.join(ROOT, "eval", "labels.jsonl");
const SPLIT = path.join(ROOT, "eval", "split.json");
const STRAT_POSTINGS = path.join(ROOT, "eval", "stratified", "postings.jsonl");
const STRAT_LABELS = path.join(ROOT, "eval", "stratified", "labels.jsonl");
const TRICKY = path.join(ROOT, "eval", "tricky_cases.jsonl");
const RESULTS_DIR = path.join(ROOT, "eval", "results");
const TEST_RUNS_LOG = path.join(RESULTS_DIR, "test_runs.log");
const AUDIT_FILE = path.join(RESULTS_DIR, "label_audit.json");

type Posting = { id: string; company: string; title: string; hash: string; text: string; source: string; url: string };
type Label = { id: string; hash: string; text_stance: string; overall_verdict: string; revisit: boolean; quote?: string; verdict_ai_prior?: string };
type TrickyCase = { name: string; kind: string; expect_stance: string; snippet: string };

type Stance =
  | "sponsors"
  | "no_sponsorship"
  | "requires_authorization"
  | "citizenship_or_clearance"
  | "silent";

const BLOCKED: Stance[] = ["no_sponsorship", "requires_authorization", "citizenship_or_clearance"];

// Company records for the combined-verdict eval, loaded once.
const recordsLookupPath = path.join(ROOT, "data-sources", "lookup", "company-records.json");
const recordsLookup: Record<string, CompanyRecordLike> = fs.existsSync(recordsLookupPath)
  ? (JSON.parse(fs.readFileSync(recordsLookupPath, "utf-8")).records)
  : {};
const aliases: Record<string, string> = fs.existsSync(path.join(ROOT, "data-sources", "aliases.json"))
  ? (JSON.parse(fs.readFileSync(path.join(ROOT, "data-sources", "aliases.json"), "utf-8")).aliases)
  : {};

function sha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 16);
}

function readJsonl<T>(file: string): T[] {
  return fs.readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

type Metric = {
  name: string;
  interval: Interval;
};

function pct(m: number | null): string {
  return m === null ? "—" : `${(100 * m).toFixed(1)}%`;
}

function ci(m: Interval): string {
  if (m.p === null || m.low === null || m.high === null) return `n=${m.n}`;
  return `${pct(m.p)} [95% CI ${(100 * m.low).toFixed(1)}–${(100 * m.high).toFixed(1)}%, n=${m.n}]`;
}

type SetResult = {
  setName: string;
  n: number;
  statementDetection: { precision: Interval; recall: Interval };
  stanceAccuracyAmongDetected: Interval;
  blocked: { precision: Interval; recall: Interval };
  sponsors: { precision: Interval; recall: Interval };
  perClass: Record<string, { precision: Interval; recall: Interval; note: string }>;
  accuracy: Interval;
  confusion: Record<string, Record<string, number>>;
  worstMistakes: Array<{
    id: string;
    company: string;
    title: string;
    trueStance: string;
    predictedStance: string;
    confidence: number;
    quote: string;
    trueQuote?: string;
  }>;
  baselines: { alwaysSilent: Interval; alwaysUnclear: Interval };
  verdict: {
    accuracy: Interval;
    perStatus: Record<string, { precision: Interval; recall: Interval }>;
    confusion: Record<string, Record<string, number>>;
  };
};

function evaluateSet(
  name: string,
  postings: Posting[],
  labels: Map<string, Label>
): SetResult {
  const rows = postings
    .map((p) => ({ post: p, label: labels.get(p.id), predicted: detectTextStance(p.text) }))
    .filter((r): r is { post: Posting; label: Label; predicted: ReturnType<typeof detectTextStance> } => !!r.label);

  let tp = 0, fp = 0, fn = 0, detectedCorrect = 0;
  let sponsorsTp = 0, sponsorsFp = 0, sponsorsFn = 0;
  let blockedTp = 0, blockedFp = 0, blockedFn = 0;
  const perClassCounts: Record<string, { tp: number; fp: number; fn: number }> = {};
  const confusion: Record<string, Record<string, number>> = {};
  const worst: SetResult["worstMistakes"] = [];
  let accuracyCount = 0;

  for (const { post, label, predicted } of rows) {
    const truth = label.text_stance as Stance;
    confusion[truth] = confusion[truth] || {};
    confusion[truth][predicted.stance] = (confusion[truth][predicted.stance] || 0) + 1;

    const trueBlocked = BLOCKED.includes(truth);
    const predBlocked = BLOCKED.includes(predicted.stance);
    const trueStatement = truth !== "silent";
    const predStatement = predicted.stance !== "silent";

    if (trueStatement && predStatement) detectedCorrect++;
    if (trueStatement && predStatement && predicted.stance === truth) accuracyCount++;
    if (predStatement && !trueStatement) fp++;
    if (trueStatement && !predStatement) fn++;
    if (trueStatement && predStatement) tp++;

    if (truth === "sponsors") {
      if (predicted.stance === "sponsors") sponsorsTp++;
      else sponsorsFn++;
    } else if (predicted.stance === "sponsors") sponsorsFp++;

    if (trueBlocked) {
      if (predBlocked) blockedTp++;
      else blockedFn++;
    } else if (predBlocked) blockedFp++;

    perClassCounts[truth] = perClassCounts[truth] || { tp: 0, fp: 0, fn: 0 };
    if (predicted.stance === truth) {
      perClassCounts[truth].tp++;
    } else {
      perClassCounts[predicted.stance] = perClassCounts[predicted.stance] || { tp: 0, fp: 0, fn: 0 };
      perClassCounts[predicted.stance].fp++;
      perClassCounts[truth].fn++;
    }

    if (predicted.stance !== truth) {
      worst.push({
        id: post.id,
        company: post.company,
        title: post.title,
        trueStance: truth,
        predictedStance: predicted.stance,
        confidence: predicted.confidence,
        quote: predicted.quote || "(silent)",
        trueQuote: label.quote,
      });
    }
  }

  worst.sort((a, b) => b.confidence - a.confidence);

  const n = rows.length;
  const silentTruth = rows.filter((r) => r.label!.text_stance === "silent").length;
  const unclearTruth = rows.filter((r) => r.label!.overall_verdict === "unclear").length;

  const perClass: Record<string, { precision: Interval; recall: Interval; note: string }> = {};
  const stances: Stance[] = ["sponsors", "no_sponsorship", "requires_authorization", "citizenship_or_clearance"];
  for (const stance of stances) {
    const c = perClassCounts[stance] || { tp: 0, fp: 0, fn: 0 };
    const truthCount = rows.filter((r) => r.label!.text_stance === stance).length;
    perClass[stance] = {
      precision: precision(c.tp, c.fp),
      recall: recall(c.tp, c.fn),
      note: `small-n: ${truthCount} true ${stance} in this set`,
    };
  }

  return {
    setName: name,
    n,
    statementDetection: {
      precision: precision(tp, fp),
      recall: recall(tp, fn),
    },
    stanceAccuracyAmongDetected: wilson95(accuracyCount, tp),
    blocked: { precision: precision(blockedTp, blockedFp), recall: recall(blockedTp, blockedFn) },
    sponsors: { precision: precision(sponsorsTp, sponsorsFp), recall: recall(sponsorsTp, sponsorsFn) },
    perClass,
    accuracy: wilson95(rows.filter((r) => r.predicted.stance === r.label!.text_stance).length, n),
    confusion,
    worstMistakes: worst.slice(0, 20),
    baselines: {
      alwaysSilent: wilson95(silentTruth, n),
      alwaysUnclear: wilson95(unclearTruth, n),
    },
    verdict: verdictEval(rows),
  };
}

const VERDICT_STATUSES = ["open", "likely", "unclear", "unlikely"] as const;

/**
 * Scores the combined verdict against the human overall_verdict label.
 *
 * Honest caveat, stated in every report: the verdict labels for silent
 * postings were REDUCED to "unclear" during cleanup wherever the original
 * label rested on model memory rather than posting evidence (kept as
 * verdict_ai_prior). So this metric measures whether the engine agrees with
 * "unclear unless evidence exists" — it will look good partly by
 * construction, and it cannot measure whether "likely" verdicts are RIGHT
 * until company records are richer than the UK register alone.
 */
function verdictEval(rows: Array<{ post: Posting; label: Label; predicted: ReturnType<typeof detectTextStance> }>) {
  let correct = 0;
  const confusion: Record<string, Record<string, number>> = {};
  const counts: Record<string, { tp: number; fp: number; fn: number }> = {};

  for (const { post, label, predicted } of rows) {
    const key = normaliseCompanyName(post.company || "");
    const record = key ? recordsLookup[key] : undefined;
    const match = matchCompany(post.company || "", recordsLookup, aliases);
    const verdict = combineVerdict({
      textStance: predicted,
      company: post.company || "",
      record,
      recordMatchConfidence: match.method === "none" ? 0 : match.confidence,
      provenance: { name: "UK Home Office sponsor register", dataYear: "2026-10-16" },
    });

    confusion[label.overall_verdict] = confusion[label.overall_verdict] || {};
    confusion[label.overall_verdict][verdict.status] = (confusion[label.overall_verdict][verdict.status] || 0) + 1;

    if (verdict.status === label.overall_verdict) correct++;
    counts[verdict.status] = counts[verdict.status] || { tp: 0, fp: 0, fn: 0 };
    if (verdict.status === label.overall_verdict) counts[verdict.status].tp++;
    else {
      counts[verdict.status].fp++;
      counts[label.overall_verdict] = counts[label.overall_verdict] || { tp: 0, fp: 0, fn: 0 };
      counts[label.overall_verdict].fn++;
    }
  }

  const n = rows.length;
  const perStatus: Record<string, { precision: Interval; recall: Interval }> = {};
  for (const status of VERDICT_STATUSES) {
    const c = counts[status] || { tp: 0, fp: 0, fn: 0 };
    perStatus[status] = { precision: precision(c.tp, c.fp), recall: recall(c.tp, c.fn) };
  }
  return { accuracy: wilson95(correct, n), perStatus, confusion };
}

function trickyCases(): { total: number; passed: number; failures: Array<{ name: string; got: string }> } {
  const cases = readJsonl<TrickyCase>(TRICKY);
  const failures: Array<{ name: string; got: string }> = [];
  let passed = 0;
  for (const c of cases) {
    const result = detectTextStance(c.snippet);
    if (result.stance === c.expect_stance) passed++;
    else failures.push({ name: c.name, got: result.stance });
  }
  return { total: cases.length, passed, failures };
}

function main() {
  const isFinal = process.argv.includes("--final");
  const unaudited = process.argv.includes("--unaudited");

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const labelHashes = {
    natural: sha256(LABELS),
    stratified: sha256(STRAT_LABELS),
  };

  if (isFinal) {
    if (!unaudited && !fs.existsSync(AUDIT_FILE)) {
      console.error(
        "eval:final refused: eval/results/label_audit.json does not exist.\n" +
          "The test set may only be scored against audited labels. If the audit\n" +
          "has not happened yet and you accept unaudited numbers, pass --unaudited."
      );
      process.exit(1);
    }
    // Log every test-set run: timestamp, commit, label hashes, engine version.
    let commit = "unknown";
    try {
      commit = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, ".git", "HEAD"))).digest("hex").slice(0, 12);
    } catch { /* not a git checkout */ }
    try {
      const { execSync } = require("child_process") as typeof import("child_process");
      commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
    } catch { /* keep fallback */ }
    const stamp = `${new Date().toISOString()} engine=${ENGINE_VERSION} commit=${commit} labels_natural=${labelHashes.natural} labels_stratified=${labelHashes.stratified} ${unaudited ? "UNAUDITED" : "audited"}\n`;
    fs.appendFileSync(TEST_RUNS_LOG, stamp);
  }

  const postings = readJsonl<Posting>(POSTINGS);
  const labels = new Map(readJsonl<Label>(LABELS).map((l) => [l.id, l]));
  const split = JSON.parse(fs.readFileSync(SPLIT, "utf-8")) as { dev: string[]; test: string[] };
  const devIds = new Set(split.dev);
  const testIds = new Set(split.test);

  const devPostings = postings.filter((p) => devIds.has(p.id));
  const testPostings = postings.filter((p) => testIds.has(p.id));

  const results: Record<string, unknown> = {
    engineVersion: ENGINE_VERSION,
    runAt: new Date().toISOString(),
    mode: isFinal ? (unaudited ? "final-unaudited" : "final") : "dev",
    labelHashes,
    trickyCases: trickyCases(),
  };

  if (isFinal) {
    // One test run per engine version: the dev metrics travel with the final
    // numbers so the report can compare, but the dev set is never re-tuned
    // after this point.
    results.dev = evaluateSet("natural-dev", devPostings, labels);
    results.test = evaluateSet("natural-test", testPostings, labels);
  } else {
    results.dev = evaluateSet("natural-dev", devPostings, labels);
  }

  // Stratified set: scored separately, same split discipline.
  const stratPostings = readJsonl<Posting>(STRAT_POSTINGS);
  const stratLabels = new Map(readJsonl<Label>(STRAT_LABELS).map((l) => [l.id, l]));
  const stratSplit = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "stratified", "split.json"), "utf-8")) as { dev: string[]; test: string[] };
  const stratDevIds = new Set(stratSplit.dev);
  const stratDevPostings = stratPostings.filter((p) => stratDevIds.has(p.id));
  results.stratifiedDev = evaluateSet("stratified-dev", stratDevPostings, stratLabels);
  if (isFinal) {
    const stratTestIds = new Set(stratSplit.test);
    results.stratifiedTest = evaluateSet("stratified-test", stratPostings.filter((p) => stratTestIds.has(p.id)), stratLabels);
  }

  // Leakage guard: a statement detector above 95% on dev is suspicious — the
  // labeled data is ~89% silent, so near-perfect separation usually means a
  // bug (e.g. the engine seeing labels, or trivial text overlap between
  // train and test). Stop and write up before trusting it.
  const dev = results.dev as SetResult;
  const leakFlags: string[] = [];
  for (const [metricName, m] of [
    ["statement precision", dev.statementDetection.precision],
    ["statement recall", dev.statementDetection.recall],
  ] as const) {
    if (m.p !== null && m.p > 0.95) {
      leakFlags.push(
        `${metricName} = ${pct(m.p)} exceeds 95% — investigate before reporting. ` +
          `Checked: engine reads only posting text (no label fields, no ids, no company records); ` +
          `dev/test split is per-posting with no company overlap guard, so near-duplicate postings ` +
          `of the same template could inflate this. Documented in eval/experiments.md.`
      );
    }
  }
  results.leakageChecks = leakFlags;

  const outPath = isFinal
    ? path.join(RESULTS_DIR, `final-${ENGINE_VERSION}${unaudited ? "-unaudited" : ""}.json`)
    : path.join(RESULTS_DIR, "latest.json");
  (results as Record<string, unknown>).labelsUnaudited = isFinal ? unaudited : null;
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  // ---- console report ----
  console.log(`\n=== ${isFinal ? "FINAL" : "DEV"} eval — engine ${ENGINE_VERSION} — labels ${labelHashes.natural}/${labelHashes.stratified} ${unaudited ? "(UNAUDITED)" : ""} ===`);
  for (const key of ["dev", "test", "stratifiedDev", "stratifiedTest"]) {
    const r = results[key] as SetResult | undefined;
    if (!r) continue;
    console.log(`\n[${r.setName}] n=${r.n}`);
    console.log(`  statement detection: precision ${ci(r.statementDetection.precision)} | recall ${ci(r.statementDetection.recall)}`);
    console.log(`  stance accuracy among detected: ${ci(r.stanceAccuracyAmongDetected)}`);
    console.log(`  blocked: precision ${ci(r.blocked.precision)} | recall ${ci(r.blocked.recall)}`);
    console.log(`  sponsors: precision ${ci(r.sponsors.precision)} | recall ${ci(r.sponsors.recall)}`);
    console.log(`  overall stance accuracy: ${ci(r.accuracy)}`);
    console.log(`  verdict accuracy: ${ci(r.verdict.accuracy)}`);
    for (const [status, m] of Object.entries(r.verdict.perStatus)) {
      console.log(`    verdict ${status}: P ${ci(m.precision)} | R ${ci(m.recall)}`);
    }
    console.log(`  baselines: always-silent ${ci(r.baselines.alwaysSilent)} | always-unclear(verdict) ${ci(r.baselines.alwaysUnclear)}`);
  }
  const tc = results.trickyCases as { total: number; passed: number; failures: Array<{ name: string; got: string }> };
  console.log(`\ntricky cases: ${tc.passed}/${tc.total}` + (tc.failures.length ? ` FAILING: ${tc.failures.map((f) => `${f.name}→${f.got}`).join(", ")}` : ""));
  if (leakFlags.length) console.log(`\nLEAKAGE CHECK:\n  - ${leakFlags.join("\n  - ")}`);
  if (!isFinal && dev.worstMistakes.length) {
    console.log(`\nworst mistakes (top 10 of 20 saved):`);
    for (const m of dev.worstMistakes.slice(0, 10)) {
      console.log(`  ${m.id} true=${m.trueStance} got=${m.predictedStance} conf=${m.confidence.toFixed(2)} :: ${m.company}`);
    }
  }
  console.log(`\nsaved: ${path.relative(ROOT, outPath)}`);
}

main();
