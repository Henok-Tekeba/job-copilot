import * as fs from "fs";
import * as path from "path";
import {
  jobSchema,
  programSchema,
  seedSchema,
  type Job,
  type SeedData,
} from "./types";
import { detectOpportunity } from "./opportunity";

const DATA_DIR = path.join(process.cwd(), "data");

function loadPrograms(): Job[] {
  const programsPath = path.join(DATA_DIR, "programs.json");
  if (!fs.existsSync(programsPath)) return [];

  const raw = JSON.parse(fs.readFileSync(programsPath, "utf-8"));
  const parsed = programSchema.array().safeParse(raw);
  if (!parsed.success) return [];

  return parsed.data.map((program) => ({
    id: program.id,
    source: "manual" as const,
    sourceUrl: program.url,
    applyUrl: program.url,
    attribution: "added by me",
    title: program.name,
    company: program.name,
    location: "",
    tags: [],
    description: program.description,
    postedAt: "",
    firstSeen: "",
    relevance: "software" as const,
    evaluation: {
      eligible: program.eligible,
      remoteReason: program.notes,
      detectedSkills: [],
      matched: [],
      missing: [],
      fitScore: null,
      level: "intern" as const,
      opportunity: "program" as const,
    },
  }));
}

export function loadLastUpdated(): string {
  const statePath = path.join(DATA_DIR, "state.json");
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, "utf-8")) as {
      lastFetched?: Record<string, string>;
    };
    const times = Object.values(state.lastFetched ?? {});
    if (times.length > 0) {
      return times.sort()[times.length - 1]!;
    }
  }

  const jobsPath = path.join(DATA_DIR, "jobs.json");
  if (fs.existsSync(jobsPath)) {
    return fs.statSync(jobsPath).mtime.toISOString();
  }

  return new Date().toISOString();
}

export function loadJobs(): Job[] {
  const jobsPath = path.join(DATA_DIR, "jobs.json");
  const programs = loadPrograms();

  if (fs.existsSync(jobsPath)) {
    const raw = JSON.parse(fs.readFileSync(jobsPath, "utf-8"));
    const parsed = jobSchema.array().safeParse(raw);
    if (parsed.success) {
      return [...parsed.data, ...programs];
    }
  }

  const seedPath = path.join(DATA_DIR, "seed.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const parsed = seedSchema.safeParse(seed);
  if (!parsed.success) {
    throw new Error("Seed validation failed");
  }

  const seedData: SeedData = parsed.data;
  return [
    ...seedData.jobs.map((j) => {
      const header = j.description.split("\n")[0] ?? "";
      const opportunity = detectOpportunity(j.title, header, [], j.type);
      return {
        id: j.id,
        source: "remoteok" as const,
        sourceUrl: j.applyUrl,
        applyUrl: j.applyUrl,
        attribution: "via Telegram",
        website: undefined,
        title: j.title,
        company: j.company,
        location: j.location,
        tags: [],
        description: j.description,
        postedAt: j.postedAt,
        firstSeen: j.postedAt,
        relevance: "software" as const,
        evaluation: {
          eligible:
            j.evaluation.eligible === true
              ? ("yes" as const)
              : j.evaluation.eligible === false
                ? ("no" as const)
                : ("unclear" as const),
          remoteReason: j.remoteReason,
          detectedSkills: j.evaluation.matched.concat(j.evaluation.missing),
          matched: j.evaluation.matched,
          missing: j.evaluation.missing,
          fitScore: j.evaluation.fitScore,
          level: "mid" as const,
          opportunity,
        },
      };
    }),
    ...programs,
  ];
}
