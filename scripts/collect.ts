import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fetchRemoteOK } from "./adapters/remoteok";
import { fetchRemotive } from "./adapters/remotive";
import { fetchHackerNews } from "./adapters/hackernews";
import { fetchJobicy } from "./adapters/jobicy";
import type { NormalizedJob } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const RATE_LIMIT_HOURS = 6;

type SourceName = "remoteok" | "remotive" | "hackernews" | "jobicy";

type State = {
  lastFetched?: Record<string, string>;
};

function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }
  return {};
}

function saveState(state: State) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isRateLimited(state: State, source: SourceName): boolean {
  const last = state.lastFetched?.[source];
  if (!last) return false;
  const elapsed = Date.now() - new Date(last).getTime();
  return elapsed < RATE_LIMIT_HOURS * 60 * 60 * 1000;
}

function loadExistingJobs(): NormalizedJob[] {
  if (fs.existsSync(JOBS_FILE)) {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  }
  return [];
}

function saveJobs(jobs: NormalizedJob[]) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

function dedupeAndMerge(existing: NormalizedJob[], incoming: NormalizedJob[]): NormalizedJob[] {
  const seen = new Map<string, NormalizedJob>();

  for (const job of existing) {
    const key = `${job.company.toLowerCase()}:${job.title.toLowerCase()}`;
    seen.set(key, job);
  }

  for (const job of incoming) {
    const key = `${job.company.toLowerCase()}:${job.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }

  return Array.from(seen.values());
}

function saveRaw(source: string, data: unknown) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const filename = `${source}-${timestamp}.json`;
  fs.writeFileSync(path.join(RAW_DIR, filename), JSON.stringify(data, null, 2));
}

async function collect() {
  const force = process.argv.includes("--force");
  ensureDirs();

  const state = loadState();
  const existingJobs = loadExistingJobs();
  let allJobs = [...existingJobs];

  const sources: Array<{
    name: SourceName;
    fetcher: () => Promise<NormalizedJob[]>;
  }> = [
    { name: "remoteok", fetcher: fetchRemoteOK },
    { name: "remotive", fetcher: fetchRemotive },
    { name: "hackernews", fetcher: fetchHackerNews },
    { name: "jobicy", fetcher: fetchJobicy },
  ];

  for (const source of sources) {
    if (!force && isRateLimited(state, source.name)) {
      console.log(`Skipping ${source.name}: rate limit`);
      continue;
    }

    try {
      const raw = await source.fetcher();
      saveRaw(source.name, raw);

      if (!force) {
        state.lastFetched = state.lastFetched || {};
        state.lastFetched[source.name] = new Date().toISOString();
      }

      if (source.name === "hackernews") {
        allJobs = allJobs.filter((j) => j.source !== "hackernews");
      }
      allJobs = dedupeAndMerge(allJobs, raw);
      console.log(`Fetched ${raw.length} jobs from ${source.name}`);
    } catch (err) {
      console.error(`Failed to fetch ${source.name}:`, err);
    }
  }

  saveJobs(allJobs);
  saveState(state);

  console.log(`Total jobs in data/jobs.json: ${allJobs.length}`);

  const remoteokJobs = allJobs.filter((j) => j.source === "remoteok");
  const remotiveJobs = allJobs.filter((j) => j.source === "remotive");

  console.log("\n--- RemoteOK samples ---");
  for (const job of remoteokJobs.slice(0, 5)) {
    console.log(`  ${job.title} | ${job.location}`);
  }

  console.log("\n--- Remotive samples ---");
  for (const job of remotiveJobs.slice(0, 5)) {
    console.log(`  ${job.title} | ${job.location}`);
  }

  const emptyLocation = allJobs.filter((j) => !j.location).length;
  console.log(`\nJobs with empty location: ${emptyLocation}`);
}

collect().then(() => {
  execSync("npx tsx scripts/evaluate.ts", { stdio: "inherit" });
  execSync("npx tsx scripts/history.ts", { stdio: "inherit" });
});
