import * as fs from "fs";
import * as path from "path";
import { jobSchema, seedSchema, type Job, type SeedData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function loadJobs(): Job[] {
  const jobsPath = path.join(DATA_DIR, "jobs.json");

  if (fs.existsSync(jobsPath)) {
    const raw = JSON.parse(fs.readFileSync(jobsPath, "utf-8"));
    const parsed = jobSchema.array().safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }
  }

  const seedPath = path.join(DATA_DIR, "seed.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const parsed = seedSchema.safeParse(seed);
  if (!parsed.success) {
    throw new Error("Seed validation failed");
  }

  const seedData: SeedData = parsed.data;
  return seedData.jobs.map((j) => ({
    id: j.id,
    source: "telegram" as const,
    sourceUrl: j.applyUrl,
    applyUrl: j.applyUrl,
    attribution: "via Telegram",
    title: j.title,
    company: j.company,
    location: j.location,
    tags: [],
    description: j.description,
    postedAt: j.postedAt,
    firstSeen: j.postedAt,
    relevance: "software" as const,
    evaluation: {
      eligible: j.evaluation.eligible === true ? "yes" : j.evaluation.eligible === false ? "no" : "unclear",
      remoteReason: j.remoteReason,
      detectedSkills: j.evaluation.matched.concat(j.evaluation.missing),
      matched: j.evaluation.matched,
      missing: j.evaluation.missing,
      fitScore: j.evaluation.fitScore,
      level: "mid" as const,
    },
  }));
}
