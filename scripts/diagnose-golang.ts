import * as fs from "fs";
import * as path from "path";
import { SKILLS } from "../lib/skills";

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");

type Job = {
  id: string;
  title: string;
  tags: string[];
  description: string;
  evaluation?: {
    detectedSkills: string[];
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

const jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));

console.log("=== 5 jobs where Golang was detected ===\n");
const golangJobs = jobs.filter((j) => j.evaluation?.detectedSkills.includes("Golang")).slice(0, 5);

for (const job of golangJobs) {
  const plainDesc = stripHtml(job.description);
  const textToScan = `${job.title} ${job.tags.join(" ")} ${plainDesc}`;
  const lower = textToScan.toLowerCase();

  const idx = lower.indexOf("golang");
  if (idx === -1) {
    console.log(`Title: ${job.title}`);
    console.log(`Tags: ${JSON.stringify(job.tags)}`);
    console.log(`No "golang" found in text!`);
    console.log(`---`);
    continue;
  }

  const start = Math.max(0, idx - 40);
  const end = Math.min(textToScan.length, idx + 40);
  const snippet = textToScan.slice(start, end);

  console.log(`Title: ${job.title}`);
  console.log(`Tags: ${JSON.stringify(job.tags)}`);
  console.log(`Match context: ...${snippet}...`);
  console.log(`---`);
}
