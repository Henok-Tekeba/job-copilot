import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const HISTORY_DIR = path.join(DATA_DIR, "history");

interface Job {
  id: string;
  source: string;
  firstSeen: string;
  relevance: "software" | "other";
  evaluation: {
    opportunity: "internship" | "contract" | "junior" | "program" | "fulltime";
    eligible: "yes" | "no" | "unclear";
    missing: string[];
  };
}

function ensureDirs() {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

function loadJobs(): Job[] {
  if (fs.existsSync(JOBS_FILE)) {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  }
  return [];
}

function main() {
  ensureDirs();
  const jobs = loadJobs();

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const historyFile = path.join(HISTORY_DIR, `${today}.json`);

  const softwareJobs = jobs.filter((j) => j.relevance === "software");
  const totalJobs = jobs.length;
  const totalSoftware = softwareJobs.length;

  const byOpportunity: Record<string, { total: number; open: number }> = {
    internship: { total: 0, open: 0 },
    contract: { total: 0, open: 0 },
    junior: { total: 0, open: 0 },
    program: { total: 0, open: 0 },
    fulltime: { total: 0, open: 0 },
  };

  for (const job of jobs) {
    const opp = job.evaluation.opportunity;
    byOpportunity[opp].total++;
    if (job.evaluation.eligible === "yes" || job.evaluation.eligible === "unclear") {
      byOpportunity[opp].open++;
    }
  }

  const bySource: Record<string, { total: number; open: number }> = {};
  for (const job of jobs) {
    if (!bySource[job.source]) {
      bySource[job.source] = { total: 0, open: 0 };
    }
    bySource[job.source].total++;
    if (job.evaluation.eligible === "yes" || job.evaluation.eligible === "unclear") {
      bySource[job.source].open++;
    }
  }

  const gapJobs = softwareJobs.filter(
    (j) =>
      ["internship", "contract", "junior"].includes(j.evaluation.opportunity) &&
      (j.evaluation.eligible === "yes" || j.evaluation.eligible === "unclear")
  );

  const missingCounts = new Map<string, number>();
  for (const job of gapJobs) {
    for (const skill of job.evaluation.missing) {
      missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
    }
  }
  const topMissingSkills = Array.from(missingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([skill, count]) => ({ skill, count }));

  const newJobsToday = jobs.filter((j) => j.firstSeen.startsWith(today)).length;

  const snapshot = {
    date: today,
    totals: { jobs: totalJobs, software: totalSoftware },
    byOpportunity,
    bySource,
    topMissingSkills,
    newJobsToday,
  };

  fs.writeFileSync(historyFile, JSON.stringify(snapshot, null, 2));
  console.log(`History saved to ${historyFile}`);
}

main();