import * as fs from "fs";
import * as path from "path";
import { SKILLS } from "../lib/skills";
import { detectOpportunity, type Opportunity } from "../lib/opportunity";

const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");
const FACTS_FILE = path.join(process.cwd(), "data", "facts.json");

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
  evaluation?: Evaluation;
};

type Evaluation = {
  eligible: "yes" | "no" | "unclear";
  remoteReason: string;
  detectedSkills: string[];
  matched: string[];
  missing: string[];
  fitScore: number | null;
  level: string;
  opportunity: Opportunity;
  signals: {
    intern: boolean;
    junior: boolean;
  };
};

type Facts = {
  skills: Array<{ name: string; evidence: string[] }>;
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
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      if (regex.test(lower)) {
        found.push(skill);
        break;
      }
    }
  }

  return [...new Set(found)];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectLevel(title: string): string {
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

const US_ONLY_SIGNALS = [
  "must be authorized to work in the us",
  "us citizen",
  "u.s. citizens only",
  "security clearance",
  "us work authorization",
  "must reside in the united states",
  "us only",
  "no visa sponsorship",
];

const US_LOCATIONS = [
  "united states",
  "usa",
  "us",
  "united kingdom",
  "uk",
  "europe",
  "eu",
  "canada",
  "australia",
  "new zealand",
  "japan",
  "singapore",
];

const HN_NO_LOCATIONS = [
  "in-person",
  "in person",
  "onsite",
  "on-site",
  "on site",
  "hybrid",
];

const HN_REGION_REMOTE = [
  "remote (us)",
  "remote (usa)",
  "remote (uk)",
  "remote (eu)",
  "remote (europe)",
  "remote (canada)",
  "remote (australia)",
  "remote (germany)",
  "remote (france)",
  "remote (netherlands)",
  "remote (india)",
  "remote (japan)",
  "remote (brazil)",
  "remote (mexico)",
  "remote (singapore)",
  "remote (israel)",
  "remote (poland)",
  "remote (sweden)",
  "remote (norway)",
  "remote (denmark)",
  "remote (finland)",
  "remote (portugal)",
  "remote (spain)",
  "remote (italy)",
  "remote (austria)",
  "remote (switzerland)",
  "remote (belgium)",
  "remote (romania)",
  "remote (czech)",
  "remote (hungary)",
  "remote (ukraine)",
  "remote (lithuania)",
  "remote (latvia)",
  "remote (estonia)",
  "remote (kenya)",
  "remote (ghana)",
  "remote (nigeria)",
  "remote (south africa)",
  "remote (uae)",
  "remote (dubai)",
  "remote (turkey)",
  "remote (croatia)",
  "remote (serbia)",
  "remote (new zealand)",
  "remote (ireland)",
  "remote (north america)",
];

const HN_GLOBAL_WITH_COUNTRIES = /^global\s*\(/i;

function detectRemoteEligibility(
  location: string,
  description: string,
  source: string
): { eligible: "yes" | "no" | "unclear"; reason: string } {
  const lowerLoc = location.toLowerCase().trim();
  const lowerDesc = description.toLowerCase();

  const worldwide =
    lowerLoc.includes("worldwide") ||
    lowerLoc.includes("anywhere") ||
    (source === "hackernews" && (
      lowerLoc.includes("remote (global)") ||
      lowerLoc.includes("remote, global") ||
      lowerLoc.includes("remote (any timezone)") ||
      lowerLoc.includes("any timezone")
    ));

  for (const signal of US_ONLY_SIGNALS) {
    if (lowerDesc.includes(signal)) {
      const hasUSLocation = US_LOCATIONS.some((l) => lowerLoc.includes(l));
      if (hasUSLocation || lowerLoc === "") {
        return { eligible: "no", reason: signal };
      }
    }
  }

  if (source === "hackernews") {
    if (HN_NO_LOCATIONS.some((l) => lowerLoc.includes(l)) && !worldwide) {
      return { eligible: "no", reason: `Location: ${location}` };
    }

    const regionOnly = HN_REGION_REMOTE.find((r) => lowerLoc.includes(r));
    if (regionOnly) {
      return { eligible: "no", reason: regionOnly };
    }

    if (HN_GLOBAL_WITH_COUNTRIES.test(lowerLoc)) {
      return { eligible: "unclear", reason: location };
    }

    if (lowerLoc === "remote" || lowerLoc === "remote only") {
      return { eligible: "unclear", reason: "Remote with no region specified" };
    }
  }

  if (worldwide) {
    return { eligible: "yes", reason: "Worldwide" };
  }

  const nonUSOnly = US_LOCATIONS.some(
    (l) => lowerLoc.includes(l) && !lowerLoc.includes("ethiopia")
  );
  if (nonUSOnly) {
    return { eligible: "no", reason: `Location: ${location}` };
  }

  return { eligible: "unclear", reason: "" };
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

function detectRelevance(title: string, detectedSkills: string[]): "software" | "other" {
  const lower = title.toLowerCase();
  const hasSoftwareKeyword = SOFTWARE_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasSoftwareKeyword || detectedSkills.length >= 3) {
    return "software";
  }
  return "other";
}

function loadFacts(): Facts {
  return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
}

function getKnownSkillNames(facts: Facts): Set<string> {
  return new Set(facts.skills.map((s) => s.name));
}

function evaluateJob(job: Job, knownSkills: Set<string>): Evaluation {
  const textToScan = `${job.title} ${job.tags.join(" ")} ${job.description}`;
  const detectedSkills = detectSkills(textToScan);

  const matched = detectedSkills.filter((s) => knownSkills.has(s));
  const missing = detectedSkills.filter((s) => !knownSkills.has(s));

  let fitScore: number | null = null;
  if (detectedSkills.length >= 2) {
    fitScore = Math.round((100 * matched.length) / detectedSkills.length);
  }

  const level = detectLevel(job.title);
  const header = job.description.split("\n")[0] ?? "";
  const opportunity =
    job.source === "manual"
      ? "program"
      : detectOpportunity(job.title, header, job.tags, job.jobType);

  const { eligible, reason } = detectRemoteEligibility(
    job.location,
    job.description,
    job.source
  );

  const headerText = job.title.toLowerCase();
  const fullText = `${job.title} ${job.description}`.toLowerCase();
  const negationWords = ["no", "not", "never", "without", "don't", "isn't"];
  const sentences = job.description.split(/[.!?]+/).map((s) => s.trim().toLowerCase());
  const internSentence = sentences.some(
    (s) =>
      (s.includes("intern") || s.includes("internship")) &&
      !negationWords.some((n) => s.includes(n))
  );
  const juniorSentence = sentences.some(
    (s) =>
      (s.includes("junior") ||
        s.includes("entry level") ||
        s.includes("entry-level") ||
        s.includes("new grad") ||
        s.includes("graduate")) &&
      !negationWords.some((n) => s.includes(n))
  );
  const signals = {
    intern:
      headerText.includes("intern") || headerText.includes("internship") || internSentence,
    junior:
      headerText.includes("junior") ||
      headerText.includes("entry level") ||
      headerText.includes("entry-level") ||
      headerText.includes("new grad") ||
      headerText.includes("graduate") ||
      juniorSentence,
  };

  return {
    eligible,
    remoteReason: reason,
    detectedSkills,
    matched,
    missing,
    fitScore,
    level,
    opportunity,
    signals,
  };
}

function main() {
  const jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  const facts: Facts = loadFacts();
  const knownSkills = getKnownSkillNames(facts);

  for (const job of jobs) {
    if (job.source === "manual") continue;
    const plainDesc = stripHtml(job.description);
    const evaluation = evaluateJob(
      { ...job, description: plainDesc },
      knownSkills
    );
    job.evaluation = evaluation;
    job.relevance = detectRelevance(job.title, evaluation.detectedSkills);
  }

  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));

  const softwareJobs = jobs.filter((j) => j.relevance === "software");
  const hnSoftwareJobs = softwareJobs.filter((j) => j.source === "hackernews");

  const byEligible = { yes: 0, unclear: 0, no: 0 };
  for (const job of softwareJobs) {
    byEligible[job.evaluation!.eligible]++;
  }

  console.log("=== Software Jobs Report ===\n");
  console.log("1. Counts by eligible:");
  console.log(`   yes: ${byEligible.yes}`);
  console.log(`   unclear: ${byEligible.unclear}`);
  console.log(`   no: ${byEligible.no}`);

  const byLevel = { intern: 0, junior: 0, mid: 0, senior: 0 };
  for (const job of softwareJobs) {
    byLevel[job.evaluation!.level as keyof typeof byLevel]++;
  }
  console.log("\n2. Counts by level:");
  console.log(`   intern: ${byLevel.intern}`);
  console.log(`   junior: ${byLevel.junior}`);
  console.log(`   mid: ${byLevel.mid}`);
  console.log(`   senior: ${byLevel.senior}`);

  const byOpportunity: Record<Opportunity, number> = {
    internship: 0,
    contract: 0,
    junior: 0,
    program: 0,
    fulltime: 0,
  };
  const openByOpportunity: Record<Opportunity, number> = {
    internship: 0,
    contract: 0,
    junior: 0,
    program: 0,
    fulltime: 0,
  };
  for (const job of jobs) {
    const opp = job.evaluation?.opportunity;
    if (!opp) continue;
    byOpportunity[opp]++;
    if (job.evaluation!.eligible === "yes" || job.evaluation!.eligible === "unclear") {
      openByOpportunity[opp]++;
    }
  }
  console.log("\n2b. Counts by opportunity (all jobs):");
  for (const key of Object.keys(byOpportunity) as Opportunity[]) {
    console.log(`   ${key}: ${byOpportunity[key]} (open yes/unclear: ${openByOpportunity[key]})`);
  }

  const missingCounts = new Map<string, number>();
  for (const job of softwareJobs) {
    if (job.evaluation!.level !== "senior") {
      for (const skill of job.evaluation!.missing) {
        missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
      }
    }
  }
  const sortedMissing = [...missingCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  console.log("\n3. Top 15 missing skills (excluding senior):");
  for (const [skill, count] of sortedMissing.slice(0, 15)) {
    console.log(`   ${skill}: ${count}`);
  }

  console.log("\n4. Software jobs eligible=yes or unclear AND level intern/junior:");
  for (const job of softwareJobs) {
    if (
      (job.evaluation!.eligible === "yes" || job.evaluation!.eligible === "unclear") &&
      (job.evaluation!.level === "intern" || job.evaluation!.level === "junior")
    ) {
      console.log(`   ${job.title} | ${job.company} | ${job.location} | ${job.evaluation!.level}`);
    }
  }

  console.log("\n5. All software jobs eligible=yes (any level):");
  for (const job of softwareJobs) {
    if (job.evaluation!.eligible === "yes") {
      console.log(`   ${job.title} | ${job.company} | ${job.location}`);
    }
  }

  const noReasons = new Map<string, number>();
  for (const job of softwareJobs) {
    if (job.evaluation!.eligible === "no") {
      const reason = job.evaluation!.remoteReason;
      noReasons.set(reason, (noReasons.get(reason) ?? 0) + 1);
    }
  }
  const sortedNoReasons = [...noReasons.entries()].sort((a, b) => b[1] - a[1]);
  console.log("\n6. Top 5 reasons for 'no':");
  for (const [reason, count] of sortedNoReasons.slice(0, 5)) {
    console.log(`   ${reason}: ${count}`);
  }
}

main();