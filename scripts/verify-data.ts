/**
 * Fail the build when the job data is missing, malformed, or unevaluated.
 *
 * `lib/data.ts` deliberately falls back to `data/seed.json` when `jobs.json`
 * fails validation. That is right for a fresh local clone and actively
 * dangerous in CI: a broken or absent snapshot would quietly deploy a site full
 * of seed data that looks perfectly healthy. This turns that silence into a
 * failed build.
 *
 * Run with `npm run verify-data`.
 */

import * as fs from "fs";
import * as path from "path";
import { jobSchema } from "../lib/types";

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");

/** Below this, something is wrong upstream rather than "a quiet day". */
const MIN_JOBS = 100;

function fail(message: string, detail: string[] = []): never {
  console.error(`\nverify-data: ${message}`);
  for (const line of detail) console.error(`  ${line}`);
  console.error("");
  process.exit(1);
}

if (!fs.existsSync(JOBS_FILE)) {
  fail("data/jobs.json is missing.", [
    "Run scripts/sync-data.sh to pull it from the data branch,",
    "or npm run collect to build it from scratch.",
  ]);
}

let raw: unknown;
try {
  raw = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
} catch (err) {
  fail(`data/jobs.json is not valid JSON: ${String(err)}`);
}

if (!Array.isArray(raw)) {
  fail(`data/jobs.json must be an array, got ${typeof raw}.`);
}

const parsed = jobSchema.array().safeParse(raw);
if (!parsed.success) {
  fail(
    `data/jobs.json failed schema validation (${parsed.error.issues.length} issue(s)):`,
    parsed.error.issues
      .slice(0, 10)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
  );
}

const jobs = parsed.data;

if (jobs.length < MIN_JOBS) {
  fail(
    `data/jobs.json holds only ${jobs.length} jobs, expected at least ${MIN_JOBS}.`,
    ["The collector may have failed, or the snapshot is stale."]
  );
}

// Evaluated data is what the UI actually reads. A snapshot with jobs but no
// evaluations would render empty scores everywhere and still build fine.
const withEligibility = jobs.filter((job) => job.evaluation.eligibility).length;
if (withEligibility < jobs.length * 0.9) {
  fail(
    `only ${withEligibility} of ${jobs.length} jobs carry eligibility data.`,
    ["Run npm run evaluate to score the snapshot."]
  );
}

const open = jobs.filter(
  (job) => job.evaluation.eligibility?.verdict === "open"
).length;
const withDeadline = jobs.filter((job) => job.deadline).length;

console.log(
  `verify-data: ${jobs.length} jobs (${withEligibility} evaluated, ${open} open, ${withDeadline} with a deadline) — OK`
);
