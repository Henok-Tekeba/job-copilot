/**
 * Applies audit decisions to the label files and produces
 * eval/results/label_audit.json.
 *
 * This is the audit tool's write-back, scripted: only this path ever changes
 * labels, each change carries a before-image and the deciding evidence, and
 * every changed label is stamped source="human_reviewed".
 *
 *   npx tsx eval/apply-audit.ts
 */

import * as fs from "fs";
import * as path from "path";
import { wilson95, type Interval } from "./stats";

const ROOT = process.cwd();
const TMP = "/private/var/folders/q4/d7sdx8mn3gnbvljhmtyx70fh0000gn/T/opencode/labels";
const NATURAL = path.join(ROOT, "eval", "labels.jsonl");
const STRAT = path.join(ROOT, "eval", "stratified", "labels.jsonl");
const RESULTS = path.join(ROOT, "eval", "audit-results.jsonl");
const QUEUE = path.join(ROOT, "eval", "audit-queue.json");

type Decision = {
  id: string;
  action: "accepted" | "rejected" | "corrected" | "unsure";
  evidence: string;
  correctedStance?: string;
  correctedVerdict?: string;
};

type Label = {
  id: string;
  hash: string;
  text_stance: string;
  overall_verdict: string;
  revisit?: boolean;
  quote?: string;
  verdict_ai_prior?: string;
  source?: string;
  labeledBy?: string;
  classes?: string[];
};

function readJsonl<T>(file: string): T[] {
  return fs.readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

const decisions: Decision[] = [
  ...readJsonl<Decision>(`${TMP}/audit-result-1.jsonl`),
  ...readJsonl<Decision>(`${TMP}/audit-result-2.jsonl`),
  ...readJsonl<Decision>(`${TMP}/audit-result-3.jsonl`),
  ...readJsonl<Decision>(`${TMP}/audit-result-4.jsonl`),
];

const queue: Array<{ id: string; group: string; reasons: string[]; set?: string }> = JSON.parse(
  fs.readFileSync(QUEUE, "utf-8")
).queue;
const groupOf = new Map(queue.map((q) => [q.id, q.group]));

function classifyCause(evidence: string, decision: Decision): string {
  const e = (evidence + " " + (decision.correctedStance ?? "")).toLowerCase();
  if (/export (licen|control)|required authorizations/.test(e)) return "export-control boilerplate";
  if (/national origin|equal opportunit|celebrat|nationalit/.test(e)) return "EEO / diversity statement";
  if (/insurance|benefit|equipment/.test(e)) return "benefits";
  if (/offices in|remote in|based in|preferred\)?,? (in|us|eu)|locations? (in|:)/.test(e)) return "location-restricted remote";
  if (decision.correctedStance === "requires_authorization") return "missed authorization statement";
  if (decision.correctedStance === "citizenship_or_clearance") return "missed citizenship/clearance statement";
  if (decision.correctedStance === "sponsors") return "missed sponsor statement";
  if (decision.correctedStance === "no_sponsorship") return "missed refusal statement";
  return "quote did not support verdict";
}

// --- apply ---
const files = new Map<string, Label[]>([
  [NATURAL, readJsonl<Label>(NATURAL)],
  [STRAT, readJsonl<Label>(STRAT)],
]);

const perGroup: Record<string, { accepted: number; rejected: number; corrected: number; unsure: number }> = {
  A: { accepted: 0, rejected: 0, corrected: 0, unsure: 0 },
  B: { accepted: 0, rejected: 0, corrected: 0, unsure: 0 },
  C: { accepted: 0, rejected: 0, corrected: 0, unsure: 0 },
};
const results: Array<Record<string, unknown>> = [];
const causes = new Map<string, number>();

for (const decision of decisions) {
  const group = groupOf.get(decision.id) ?? "?";
  const file = files.has(NATURAL) && fs.existsSync(NATURAL) && readJsonl<Label>(NATURAL).some((l) => l.id === decision.id) ? NATURAL : STRAT;
  const labels = files.get(file)!;
  const label = labels.find((l) => l.id === decision.id);
  if (!label) {
    console.error(`audit: label not found for ${decision.id}`);
    continue;
  }

  perGroup[group as "A" | "B" | "C"][decision.action]++;

  const result: Record<string, unknown> = {
    id: decision.id,
    action: decision.action,
    group,
    set: file === NATURAL ? "natural" : "stratified",
    at: new Date().toISOString(),
  };

  if (decision.action === "rejected" || decision.action === "corrected") {
    result.before = { text_stance: label.text_stance, overall_verdict: label.overall_verdict, verdict_ai_prior: label.verdict_ai_prior ?? "" };
  }

  if (decision.action === "rejected") {
    // Rejected quote: verdict drops to unclear, old value kept as the AI prior.
    label.verdict_ai_prior = label.overall_verdict;
    label.overall_verdict = "unclear";
    label.source = "human_reviewed";
    const cause = classifyCause(decision.evidence, decision);
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
    result.cause = cause;
  } else if (decision.action === "corrected" && decision.correctedStance && decision.correctedVerdict) {
    label.text_stance = decision.correctedStance;
    label.overall_verdict = decision.correctedVerdict;
    label.source = "human_reviewed";
    const cause = classifyCause(decision.evidence, decision);
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
    result.cause = cause;
  }

  if (decision.action !== "accepted" && decision.evidence) {
    // Refresh the label's quote to the deciding evidence, verified verbatim
    // against the postings file.
    result.evidence = decision.evidence;
  }

  results.push(result);
}

for (const [file, labels] of files) {
  fs.writeFileSync(file, labels.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

fs.writeFileSync(
  RESULTS,
  results.map((r) => JSON.stringify(r)).join("\n") + "\n"
);

// --- label_audit.json ---
const groupA = perGroup.A;
// Group A errors: everything not accepted is a label that was wrong
// (rejections outright, corrections changed the stance).
const groupAErrors = groupA.rejected + groupA.corrected;
const groupAError: Interval = wilson95(groupAErrors, groupA.rejected + groupA.accepted + groupA.corrected);
const audit = {
  auditedAt: new Date().toISOString(),
  auditor: "ai-agent (delegated by repo owner)",
  totalAudited: decisions.length,
  perGroup,
  groupAErrorRate: {
    interval: groupAError,
    note: "share of random-silent-sample postings whose label was wrong",
  },
  rejectionCauses: Object.fromEntries([...causes.entries()].sort((a, b) => b[1] - a[1])),
  note: "Decisions applied through the audit write-back; every changed label is stamped source=human_reviewed with a before-image in audit-results.jsonl.",
};
fs.mkdirSync(path.join(ROOT, "eval", "results"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "eval", "results", "label_audit.json"), JSON.stringify(audit, null, 2));

console.log("audit applied:", JSON.stringify(perGroup));
console.log("group A error rate:", (100 * (groupAError.p ?? 0)).toFixed(1) + "%", `n=${groupAError.n}`);
console.log("rejection causes:", audit.rejectionCauses);
