import * as fs from "fs";
import * as path from "path";

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");

type Job = {
  id: string;
  source: string;
  sourceUrl: string;
  applyUrl?: string;
  attribution: string;
  title: string;
  company: string;
  location: string;
  website?: string;
  tags: string[];
  jobType?: string;
  description: string;
  postedAt: string;
  firstSeen: string;
  relevance?: "software" | "other";
  evaluation?: {
    eligible: "yes" | "no" | "unclear";
    remoteReason: string;
    detectedSkills: string[];
    matched: string[];
    missing: string[];
    fitScore: number | null;
    level: string;
    signals: {
      intern: boolean;
      junior: boolean;
    };
  };
};

function isCleanlyParsed(job: Job): boolean {
  return job.company !== "Unknown" && 
    job.title !== "Hiring (see posting)" && 
    !job.title.startsWith("http");
}

function main() {
  const jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  const hnJobs = jobs.filter((j) => j.source === "hackernews");
  const hnSoftwareJobs = hnJobs.filter((j) => j.relevance === "software");
  const softwareJobs = jobs.filter((j) => j.relevance === "software");

  const cleanlyParsed = hnJobs.filter(isCleanlyParsed).length;

  console.log("=== REPORT ===\n");

  console.log("1. Posts fetched, and the number cleanly parsed (new definition)");
  console.log(`   HackerNews posts fetched: ${hnJobs.length}`);
  console.log(`   Cleanly parsed: ${cleanlyParsed}\n`);

  console.log("2. EXACTLY 10 random posts: raw first line, then company | title | location | website");
  const shuffled = [...hnJobs].sort(() => Math.random() - 0.5).slice(0, 10);
  for (const job of shuffled) {
    const firstLine = job.description.split("\n")[0] || "";
    console.log(`   Raw: ${firstLine}`);
    console.log(`   Parsed: ${job.company} | ${job.title} | ${job.location} | ${job.website || ""}`);
    console.log("");
  }

  console.log("3. For hackernews software jobs: counts by eligible yes / unclear / no");
  const hnByEligible = { yes: 0, unclear: 0, no: 0 };
  for (const job of hnSoftwareJobs) {
    hnByEligible[job.evaluation!.eligible]++;
  }
  console.log(`   yes: ${hnByEligible.yes}`);
  console.log(`   unclear: ${hnByEligible.unclear}`);
  console.log(`   no: ${hnByEligible.no}\n`);

  console.log("4. Every hackernews software job with eligible 'yes' or 'unclear' AND (signals.intern or signals.junior): title, company, location, applyUrl");
  const hnInternJunior = hnSoftwareJobs.filter((j) => 
    (j.evaluation!.eligible === "yes" || j.evaluation!.eligible === "unclear") &&
    (j.evaluation!.signals.intern || j.evaluation!.signals.junior)
  );
  if (hnInternJunior.length === 0) {
    console.log("   (none)");
  } else {
    for (const job of hnInternJunior) {
      console.log(`   ${job.title} | ${job.company} | ${job.location} | ${job.applyUrl || ""}`);
    }
  }
  console.log("");

  console.log("5. Every hackernews software job with eligible 'yes', any level: title, company, location, applyUrl");
  const hnEligibleYes = hnSoftwareJobs.filter((j) => j.evaluation!.eligible === "yes");
  if (hnEligibleYes.length === 0) {
    console.log("   (none)");
  } else {
    for (const job of hnEligibleYes) {
      console.log(`   ${job.title} | ${job.company} | ${job.location} | ${job.applyUrl || ""}`);
    }
  }
  console.log("");

  console.log("6. Top 10 missing skills across hackernews software jobs open to me (yes or unclear)");
  const missingCounts = new Map<string, number>();
  for (const job of hnSoftwareJobs) {
    if (job.evaluation!.eligible === "yes" || job.evaluation!.eligible === "unclear") {
      for (const skill of job.evaluation!.missing) {
        missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
      }
    }
  }
  const sortedMissing = [...missingCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [skill, count] of sortedMissing.slice(0, 10)) {
    console.log(`   ${skill}: ${count}`);
  }
  console.log("");

  console.log("7. Totals across all sources: jobs, software jobs, eligible yes");
  const bySource = new Map<string, { total: number; software: number; eligibleYes: number }>();
  for (const job of jobs) {
    const src = job.source;
    const entry = bySource.get(src) || { total: 0, software: 0, eligibleYes: 0 };
    entry.total++;
    if (job.relevance === "software") entry.software++;
    if (job.evaluation?.eligible === "yes") entry.eligibleYes++;
    bySource.set(src, entry);
  }
  let grandTotal = 0, grandSoftware = 0, grandEligibleYes = 0;
  for (const [src, counts] of bySource) {
    console.log(`   ${src}: ${counts.total} jobs, ${counts.software} software, ${counts.eligibleYes} eligible yes`);
    grandTotal += counts.total;
    grandSoftware += counts.software;
    grandEligibleYes += counts.eligibleYes;
  }
  console.log(`   TOTAL: ${grandTotal} jobs, ${grandSoftware} software, ${grandEligibleYes} eligible yes`);
}

main();