import * as fs from "fs";
import * as path from "path";
import { detectOpportunity } from "../lib/opportunity";
import { assessEligibility, verdictToEligible } from "../lib/eligibility";
import { REGION_LABELS } from "../lib/regions";
import { extractDeadline } from "../lib/deadline";
import { detectSkills, segmentText } from "../lib/requirements";
import { computeFit } from "../lib/fit";
import { findRedFlags } from "../lib/legitimacy";
import {
  CORE_ENGINEERING_SKILLS,
  NON_TECH_TITLE_PATTERN,
} from "../lib/skills";
import type { Job, Level } from "../lib/types";

const CORE_SKILL_SET = new Set(CORE_ENGINEERING_SKILLS);

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");
const FACTS_FILE = path.join(process.cwd(), "data", "facts.json");

/**
 * How much of a posting body to persist.
 *
 * Descriptions were 75% of the stored payload (7.1 MB of a 9.4 MB file) and
 * jobs.json is committed on every collector run, so the full text is read for
 * evaluation and then dropped to an excerpt. The UI links out to the real
 * posting, which is the authoritative copy anyway.
 */
const STORED_EXCERPT_LIMIT = 1_200;

function toExcerpt(text: string): string {
  if (text.length <= STORED_EXCERPT_LIMIT) return text;
  return `${text.slice(0, STORED_EXCERPT_LIMIT).trimEnd()}${EXCERPT_MARKER}`;
}

const EXCERPT_MARKER = "…";

function isStoredExcerpt(description: string | undefined): boolean {
  return (description ?? "").trimEnd().endsWith(EXCERPT_MARKER);
}

/** A job as stored: collected fields, plus evaluation once it has been scored. */
type StoredJob = Omit<Job, "evaluation" | "relevance"> & {
  jobType?: string;
  employmentType?: string;
  evaluation?: Job["evaluation"];
  relevance?: Job["relevance"];
};

type Facts = {
  skills: Array<{ name: string; evidence: string[] }>;
};

/**
 * Strip HTML but keep paragraph breaks.
 *
 * Collapsing every newline made `description.split("\n")[0]` return the whole
 * body, so `detectOpportunity` was scanning the entire posting for words like
 * "contract" instead of its header line. That also made the result depend on how
 * much text survived truncation, which silently changed verdicts between runs.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** First meaningful line, capped so it is stable under description truncation. */
function headerLine(description: string): string {
  const line = description.split("\n").find((l) => l.trim().length > 0) ?? "";
  return line.slice(0, 300);
}

function detectLevel(title: string): Level {
  const lower = title.toLowerCase();
  if (lower.includes("intern") || lower.includes("trainee")) return "intern";
  if (
    lower.includes("junior") ||
    lower.includes("entry level") ||
    lower.includes("entry-level") ||
    lower.includes("graduate") ||
    lower.includes("associate")
  )
    return "junior";
  if (
    lower.includes("senior") ||
    lower.includes("staff") ||
    lower.includes("lead") ||
    lower.includes("principal") ||
    lower.includes("manager") ||
    lower.includes("director") ||
    lower.includes("head of") ||
    lower.includes("architect")
  )
    return "senior";
  return "mid";
}

const SOFTWARE_TITLE_KEYWORDS = [
  "engineer",
  "developer",
  "software",
  "devops",
  "sre",
  "backend",
  "frontend",
  "full stack",
  "fullstack",
  "data scientist",
  "machine learning",
  "ml",
  "ai",
  "qa",
  "programmer",
  "architect",
  "data engineer",
  "mobile",
  "ios",
  "android",
  "security engineer",
];

function detectRelevance(
  title: string,
  detectedSkills: string[]
): "software" | "other" {
  // Non-technical role names win: "Junior Business Developer" contains
  // "developer", so the keyword search must not run first.
  if (NON_TECH_TITLE_PATTERN.test(title)) return "other";

  const lower = title.toLowerCase();
  if (SOFTWARE_TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "software";
  }

  // Fall back to skills only for postings whose title we could not parse
  // (usually Hacker News), and require genuinely engineering skills.
  const coreCount = detectedSkills.filter((s) => CORE_SKILL_SET.has(s)).length;
  return coreCount >= 3 ? "software" : "other";
}

function loadFacts(): Facts {
  return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
}

function evaluateJob(job: StoredJob, knownSkills: Set<string>): Job["evaluation"] {
  // The structured region field wins over the human-readable location string,
  // but both are passed as-is so the evidence names the field the value really
  // came from instead of always blaming `candidate_required_location`.
  const eligibility = assessEligibility({
    requiredLocation: job.requiredLocation,
    location: job.location,
    description: job.description,
    sponsorshipHint: job.sponsorshipHint,
  });

  // Requirements come from the structured field when present, but the posting
  // body is what tells us which skills are required versus nice to have.
  const { requiredText, niceText, sectionsDetected } = segmentText(
    job.description
  );

  const requiredSkills = detectSkills(requiredText);
  const niceToHaveSkills = detectSkills(niceText).filter(
    (s) => !requiredSkills.includes(s)
  );

  const detectedSkills = detectSkills(
    `${job.title} ${(job.tags ?? []).join(" ")} ${job.description}`
  );

  const level = detectLevel(job.title);
  const header = headerLine(job.description);
  const opportunity = detectOpportunity(
    job.title,
    header,
    job.tags ?? [],
    job.jobType
  );

  const fit = computeFit({
    requiredSkills,
    niceSkills: niceToHaveSkills,
    detectedSkills,
    knownSkills,
    level,
    verdict: eligibility.verdict,
    sectionsDetected,
  });

  const matched = detectedSkills.filter((s) => knownSkills.has(s));
  const missing = detectedSkills.filter((s) => !knownSkills.has(s));

  const deadline = extractDeadline(job.description);
  const redFlags = findRedFlags(`${job.title} ${job.description}`);

  return {
    eligible: verdictToEligible(eligibility.verdict),
    remoteReason: eligibility.summary,
    matched,
    missing,
    fitScore: fit.score,
    level,
    opportunity,
    eligibility,
    fit,
    deadlineEvidence: deadline.evidence,
    redFlags,
  };
}

function main() {
  const force = process.argv.includes("--force");
  const jobs: StoredJob[] = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  const facts = loadFacts();
  const knownSkills = new Set(facts.skills.map((s) => s.name));
  const today = new Date();

  let deadlineCount = 0;
  let skippedExcerpts = 0;

  for (const job of jobs) {
    if (job.source === "manual") continue;

    // Re-scoring a stored excerpt would grade the posting on a fraction of its
    // text and silently drift every score. Only the collector holds full bodies,
    // so a deliberate re-score of stored data needs --force.
    if (!force && isStoredExcerpt(job.description)) {
      skippedExcerpts++;
      continue;
    }

    // Evaluate against the full body, then keep only an excerpt on disk.
    const plainDesc = stripHtml(job.description ?? "");
    job.description = plainDesc;
    job.evaluation = evaluateJob(job, knownSkills);
    job.relevance = detectRelevance(job.title, [
      ...job.evaluation.matched,
      ...job.evaluation.missing,
    ]);

    const deadline = extractDeadline(plainDesc, today);
    job.deadline = deadline.deadline;
    if (deadline.deadline && !deadline.expired) deadlineCount++;

    job.description = toExcerpt(plainDesc);
  }

  if (skippedExcerpts > 0) {
    console.log(
      `Skipped ${skippedExcerpts} job(s) already stored as excerpts. ` +
        `Run "npm run collect" to re-score them against full text, or pass --force.`
    );
  }

  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));

  const software = jobs.filter((j) => j.relevance === "software");
  const evaluated = software.filter((j) => j.evaluation);

  const byVerdict: Record<string, number> = {};
  for (const job of evaluated) {
    const v = job.evaluation!.eligibility?.verdict ?? "unknown";
    byVerdict[v] = (byVerdict[v] ?? 0) + 1;
  }

  const open = evaluated.filter(
    (j) => j.evaluation!.eligibility?.verdict === "open"
  );
  const actionable = open.filter((j) =>
    ["internship", "contract", "junior", "program"].includes(
      j.evaluation!.opportunity
    )
  );

  console.log(`=== Evaluated ${evaluated.length} software roles ===\n`);

  console.log("1. Eligibility verdict:");
  for (const [verdict, count] of Object.entries(byVerdict).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`   ${verdict}: ${count}`);
  }

  console.log("\n2. What is actually open to me:");
  console.log(`   open (any level): ${open.length}`);
  console.log(`   open AND internship/contract/junior/program: ${actionable.length}`);

  console.log("\n3. Top regions that exclude me:");
  const exclusions = new Map<string, number>();
  for (const job of evaluated) {
    const regions = (job.evaluation!.eligibility?.regions ?? []).map(
      (r) => REGION_LABELS[r]
    );
    if (job.evaluation!.eligibility?.verdict === "region-locked" && regions.length) {
      for (const r of regions) exclusions.set(r, (exclusions.get(r) ?? 0) + 1);
    }
  }
  for (const [region, count] of [...exclusions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)) {
    console.log(`   ${region}: ${count}`);
  }

  // The number that matters: what to learn to unlock roles I can actually take.
  const reachable = evaluated.filter((j) => {
    const v = j.evaluation!.eligibility?.verdict;
    return v === "open" || v === "unknown";
  });
  const missingAmongReachable = new Map<string, number>();
  for (const job of reachable) {
    for (const skill of job.evaluation!.fit?.requiredMissing ?? []) {
      missingAmongReachable.set(
        skill,
        (missingAmongReachable.get(skill) ?? 0) + 1
      );
    }
  }
  console.log(
    `\n4. Missing REQUIRED skills across the ${reachable.length} roles open or unclear to me:`
  );
  for (const [skill, count] of [...missingAmongReachable.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)) {
    console.log(`   ${skill}: ${count} roles`);
  }

  const flagged = actionable.filter(
    (j) => (j.evaluation!.redFlags?.length ?? 0) > 0
  );
  const clean = actionable.filter(
    (j) => (j.evaluation!.redFlags?.length ?? 0) === 0
  );

  console.log("\n5. Actionable roles, highest priority first:");
  for (const job of clean
    .sort((a, b) => (b.evaluation!.fit?.priority ?? 0) - (a.evaluation!.fit?.priority ?? 0))
    .slice(0, 20)) {
    const f = job.evaluation!.fit;
    const d = job.deadline ? ` | deadline ${job.deadline}` : "";
    console.log(
      `   [${String(f?.priority).padStart(3)}] ${job.title} | ${job.company} | ${job.evaluation!.opportunity} | ${job.evaluation!.level}${d}`
    );
  }

  if (flagged.length > 0) {
    console.log(`\n5b. ${flagged.length} actionable roles set aside for red flags:`);
    for (const job of flagged.slice(0, 8)) {
      console.log(
        `   ${job.title} | ${job.company} | ${job.evaluation!.redFlags!.join(", ")}`
      );
    }
  }

  console.log(`\n6. Upcoming deadlines found: ${deadlineCount}`);
  for (const job of jobs
    .filter((j) => j.deadline && j.deadline >= today.toISOString().slice(0, 10))
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 10)) {
    console.log(`   ${job.deadline}  ${job.title} | ${job.company}`);
  }
}

main();
