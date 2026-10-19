/**
 * CI guard: fails when the dev eval in eval/results/latest.json drops below
 * eval/baseline.json on any gated metric. Verdict accuracy is deliberately
 * NOT gated while labels are unaudited (see eval/experiments.md, Phase 4).
 *
 *   npx tsx eval/check-baseline.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "baseline.json"), "utf-8"));
const latest = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "results", "latest.json"), "utf-8"));

type Mini = { p: number | null; n: number };

function fail(message: string): never {
  console.error(`\ncheck-baseline: FAIL\n  ${message}\n`);
  process.exit(1);
}

if (latest.engineVersion !== baseline.engineVersion && !process.argv.includes("--allow-version-change")) {
  console.warn(
    `check-baseline: warning — baseline was recorded on engine ${baseline.engineVersion}, ` +
      `results are from ${latest.engineVersion}. Re-record the baseline with an intentional commit.`
  );
}

const dev = latest.dev;
if (!dev) fail("eval/results/latest.json has no dev section. Run npm run eval:dev.");

const gates: Array<[string, number | null, number | null]> = [
  ["statement precision", dev.statementDetection.precision.p, baseline.naturalDev.statementPrecision],
  ["statement recall", dev.statementDetection.recall.p, baseline.naturalDev.statementRecall],
  ["blocked precision", dev.blocked.precision.p, baseline.naturalDev.blockedPrecision],
  ["blocked recall", dev.blocked.recall.p, baseline.naturalDev.blockedRecall],
  ["stance accuracy among detected", dev.stanceAccuracyAmongDetected.p, baseline.naturalDev.stanceAccuracyAmongDetected],
  ["overall stance accuracy", dev.accuracy.p, baseline.naturalDev.overallAccuracy],
  ["stratified blocked precision", latest.stratifiedDev?.blocked.precision.p ?? null, baseline.stratifiedDev.blockedPrecision],
  ["stratified blocked recall", latest.stratifiedDev?.blocked.recall.p ?? null, baseline.stratifiedDev.blockedRecall],
];

let failed = 0;
for (const [name, actual, floor] of gates) {
  if (floor === null || actual === null) continue;
  const pass = actual >= floor - 1e-9;
  console.log(`${pass ? "ok  " : "FAIL"} ${name}: ${(100 * actual).toFixed(1)}% (baseline ${(100 * floor).toFixed(1)}%)`);
  if (!pass) failed++;
}

if ((latest.trickyCases?.passed ?? 0) < baseline.trickyCasesPassed) {
  console.error(`FAIL tricky cases: ${latest.trickyCases.passed}/${latest.trickyCases.total} (baseline ${baseline.trickyCasesPassed})`);
  failed++;
} else {
  console.log(`ok   tricky cases: ${latest.trickyCases.passed}/${latest.trickyCases.total}`);
}

if (failed > 0) {
  fail(`${failed} gated metric(s) dropped below eval/baseline.json. Fix the regression, or update the baseline in an intentional commit that says why.`);
}
console.log("\ncheck-baseline: PASS");
