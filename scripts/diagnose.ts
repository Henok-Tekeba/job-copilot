import * as fs from "fs";
import * as path from "path";
import { SKILLS } from "../lib/skills";

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  tags: string[];
  description: string;
  evaluation?: {
    eligible: string;
    remoteReason: string;
    detectedSkills: string[];
    matched: string[];
    missing: string[];
    fitScore: number | null;
    level: string;
  };
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [skill, aliases] of Object.entries(SKILLS)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        found.push(skill);
        break;
      }
    }
  }
  return [...new Set(found)];
}

const jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));

console.log("=== 8 jobs with null fitScore ===\n");
const nullJobs = jobs.filter((j) => j.evaluation?.fitScore === null).slice(0, 8);
for (const job of nullJobs) {
  const plainDesc = stripHtml(job.description);
  const textToScan = `${job.title} ${job.tags.join(" ")} ${plainDesc}`;
  const detected = detectSkills(textToScan);
  console.log(`Title: ${job.title}`);
  console.log(`Tags: ${JSON.stringify(job.tags)}`);
  console.log(`Description (first 300 chars): ${plainDesc.slice(0, 300)}`);
  console.log(`Detected skills: ${JSON.stringify(detected)}`);
  console.log(`---`);
}

console.log("\n=== Top 15 missing skills (all jobs) ===\n");
const missingCounts = new Map<string, number>();
for (const job of jobs) {
  for (const skill of job.evaluation?.missing ?? []) {
    missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
  }
}
const sortedMissing = [...missingCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [skill, count] of sortedMissing.slice(0, 15)) {
  console.log(`  ${skill}: ${count}`);
}

console.log("\n=== 7 eligible=yes jobs ===\n");
const yesJobs = jobs.filter((j) => j.evaluation?.eligible === "yes");
for (const job of yesJobs) {
  console.log(`  ${job.title} | ${job.company} | ${job.location}`);
}

console.log("\n=== Top 15 location strings ===\n");
const locCounts = new Map<string, number>();
for (const job of jobs) {
  const loc = job.location || "(empty)";
  locCounts.set(loc, (locCounts.get(loc) ?? 0) + 1);
}
const sortedLocs = [...locCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [loc, count] of sortedLocs.slice(0, 15)) {
  console.log(`  ${loc}: ${count}`);
}

console.log("\n=== Counts by level ===\n");
const byLevel = { intern: 0, junior: 0, mid: 0, senior: 0 };
for (const job of jobs) {
  const level = job.evaluation?.level ?? "mid";
  byLevel[level as keyof typeof byLevel]++;
}
console.log(`  intern: ${byLevel.intern}`);
console.log(`  junior: ${byLevel.junior}`);
console.log(`  mid: ${byLevel.mid}`);
console.log(`  senior: ${byLevel.senior}`);

console.log("\n=== Top 5 remoteReason for 'no' ===\n");
const noReasons = new Map<string, number>();
for (const job of jobs) {
  if (job.evaluation?.eligible === "no") {
    const reason = job.evaluation.remoteReason;
    noReasons.set(reason, (noReasons.get(reason) ?? 0) + 1);
  }
}
const sortedNoReasons = [...noReasons.entries()].sort((a, b) => b[1] - a[1]);
for (const [reason, count] of sortedNoReasons.slice(0, 5)) {
  console.log(`  ${reason}: ${count}`);
}

console.log("\n=== 10 random jobs ===\n");
const shuffled = [...jobs].sort(() => Math.random() - 0.5).slice(0, 10);
for (const job of shuffled) {
  console.log(`  ${job.title} | ${job.location} | ${job.evaluation?.eligible} | ${job.evaluation?.remoteReason}`);
}
