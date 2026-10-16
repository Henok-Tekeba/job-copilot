import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fetchRemoteOK } from "./adapters/remoteok";
import { fetchRemotive } from "./adapters/remotive";
import { fetchHackerNews } from "./adapters/hackernews";
import { fetchJobicy } from "./adapters/jobicy";
import { fetchAshby, fetchGreenhouse, fetchLever } from "./adapters/ats";
import { companiesFor } from "./companies";
import { passesCollectionFilter, pruneJobs } from "./filters";
import type { NormalizedJob } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const RATE_LIMIT_HOURS = 6;

type SourceName =
  | "remoteok"
  | "remotive"
  | "hackernews"
  | "jobicy"
  | "greenhouse"
  | "ashby"
  | "lever";

type Source = {
  name: SourceName;
  fetcher: () => Promise<NormalizedJob[]>;
  /** Apply the coarse title/seniority filter. Used for the high-volume ATS boards. */
  filter?: boolean;
  /** Skip writing a raw snapshot; ATS aggregates are too large to be useful. */
  saveRaw?: boolean;
  /** Replace all stored jobs from this source instead of merging. */
  replace?: boolean;
};

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

function jobKey(job: NormalizedJob): string {
  return `${job.company.toLowerCase()}:${job.title.toLowerCase()}`;
}

/**
 * Merge freshly fetched jobs over the stored ones.
 *
 * A job that is already stored is *refreshed* rather than skipped: postings get
 * edited, deadlines get added, and the stored description is only an excerpt, so
 * evaluation must run against the full body from this fetch. `firstSeen` is the
 * one field we keep from the previous entry.
 */
function dedupeAndMerge(
  existing: NormalizedJob[],
  incoming: NormalizedJob[]
): NormalizedJob[] {
  const seen = new Map<string, NormalizedJob>();

  for (const job of existing) {
    seen.set(jobKey(job), job);
  }

  for (const job of incoming) {
    const key = jobKey(job);
    const previous = seen.get(key);
    seen.set(
      key,
      previous ? { ...job, firstSeen: previous.firstSeen } : job
    );
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

  const sources: Source[] = [
    { name: "remoteok", fetcher: fetchRemoteOK },
    { name: "remotive", fetcher: fetchRemotive },
    { name: "hackernews", fetcher: fetchHackerNews, replace: true },
    { name: "jobicy", fetcher: fetchJobicy },
    {
      name: "greenhouse",
      fetcher: () => fetchGreenhouse(companiesFor("greenhouse")),
      filter: true,
      saveRaw: false,
    },
    {
      name: "ashby",
      fetcher: () => fetchAshby(companiesFor("ashby")),
      filter: true,
      saveRaw: false,
    },
    {
      name: "lever",
      fetcher: () => fetchLever(companiesFor("lever")),
      filter: true,
      saveRaw: false,
    },
  ];

  for (const source of sources) {
    if (!force && isRateLimited(state, source.name)) {
      console.log(`Skipping ${source.name}: rate limit`);
      continue;
    }

    try {
      const fetched = await source.fetcher();
      const raw = source.filter ? fetched.filter(passesCollectionFilter) : fetched;

      if (source.saveRaw !== false) saveRaw(source.name, raw);

      if (!force) {
        state.lastFetched = state.lastFetched || {};
        state.lastFetched[source.name] = new Date().toISOString();
      }

      // Hacker News threads are replaced wholesale each month, so stale
      // comments must not accumulate across runs.
      if (source.replace) {
        allJobs = allJobs.filter((j) => j.source !== source.name);
      }

      allJobs = dedupeAndMerge(allJobs, raw);

      if (source.filter && raw.length !== fetched.length) {
        console.log(
          `Fetched ${raw.length} target roles from ${source.name} (dropped ${fetched.length - raw.length} out of scope)`
        );
      } else {
        console.log(`Fetched ${raw.length} jobs from ${source.name}`);
      }
    } catch (err) {
      console.error(`Failed to fetch ${source.name}:`, err);
    }
  }

  const { kept, droppedStale, droppedOverCap } = pruneJobs(allJobs);
  allJobs = kept;

  saveJobs(allJobs);
  saveState(state);

  const bySource = new Map<string, number>();
  for (const job of allJobs) {
    bySource.set(job.source, (bySource.get(job.source) ?? 0) + 1);
  }

  console.log(`\nTotal jobs in data/jobs.json: ${allJobs.length}`);
  console.log("\nJobs by source:");
  for (const [source, count] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${source}`);
  }

  if (droppedStale > 0) {
    console.log(`\nPruned ${droppedStale} postings older than the retention window`);
  }
  if (droppedOverCap > 0) {
    console.log(`Dropped ${droppedOverCap} postings over the size cap`);
  }

  const emptyLocation = allJobs.filter((j) => !j.location).length;
  console.log(`Jobs with empty location: ${emptyLocation}`);
}

collect().then(() => {
  execSync("npx tsx scripts/evaluate.ts", { stdio: "inherit" });
  execSync("npx tsx scripts/history.ts", { stdio: "inherit" });
});
