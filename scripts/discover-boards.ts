/**
 * ATS board discovery.
 *
 * We cannot guess which job board a company uses, or what token it sits behind.
 * So this probes a candidate list against the three ATS platforms that expose
 * public, unauthenticated job feeds and keeps only the boards that actually
 * return jobs.
 *
 * Run with `npm run discover`. Re-run it whenever the candidate list changes or
 * a company migrates ATS. The output (data/companies.json) is a curated,
 * verified list: collection depends on it, so every entry has been checked
 * against the live API at least once.
 */

import * as fs from "fs";
import * as path from "path";
import type { Ats } from "./types";

const CANDIDATES_FILE = path.join(process.cwd(), "data", "company-candidates.json");
const OUT_FILE = path.join(process.cwd(), "data", "companies.json");

const ATS_ORDER: Ats[] = ["greenhouse", "ashby", "lever"];

const ENDPOINTS: Record<Ats, (slug: string) => string> = {
  greenhouse: (s) => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs`,
  lever: (s) => `https://api.lever.co/v0/postings/${s}?mode=json`,
  ashby: (s) => `https://api.ashbyhq.com/posting-api/job-board/${s}`,
};

type Candidates = {
  names: string[];
  slugOverrides?: Record<string, string>;
};

export type Board = {
  name: string;
  ats: Ats;
  token: string;
  jobs: number;
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function variants(name: string, overrides: Record<string, string>): string[] {
  const override = overrides[name];
  const base = slugify(name);
  const dashed = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const list = [override, base, dashed].filter(
    (v): v is string => Boolean(v) && v.length > 1
  );
  return [...new Set(list)];
}

async function countJobs(ats: Ats, token: string): Promise<number | null> {
  try {
    const res = await fetch(ENDPOINTS[ats](token), {
      headers: { "User-Agent": "job-copilot-discovery/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();

    if (ats === "lever") {
      return Array.isArray(data) ? data.length : null;
    }
    const jobs = (data as { jobs?: unknown })?.jobs;
    return Array.isArray(jobs) ? jobs.length : null;
  } catch {
    return null;
  }
}

async function probeCompany(
  name: string,
  overrides: Record<string, string>
): Promise<Board | { name: string; empty: boolean }> {
  for (const token of variants(name, overrides)) {
    for (const ats of ATS_ORDER) {
      const count = await countJobs(ats, token);
      if (count !== null && count > 0) {
        return { name, ats, token, jobs: count };
      }
    }
  }
  return { name, empty: true };
}

/** Run tasks with a bounded number in flight, to stay polite to the APIs. */
async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

async function main() {
  const candidates: Candidates = JSON.parse(
    fs.readFileSync(CANDIDATES_FILE, "utf-8")
  );
  const overrides = candidates.slugOverrides ?? {};

  console.log(
    `Probing ${candidates.names.length} candidates against ${ATS_ORDER.length} ATS platforms...\n`
  );

  let done = 0;
  const results = await pool(candidates.names, 6, async (name) => {
    const result = await probeCompany(name, overrides);
    done++;
    process.stdout.write(`\r  ${done}/${candidates.names.length} checked`);
    return result;
  });
  process.stdout.write("\n\n");

  const boards = results.filter((r): r is Board => "ats" in r);
  const empty = results.filter((r) => "empty" in r).map((r) => r.name);

  boards.sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name));

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      boards.map((b) => ({ name: b.name, ats: b.ats, token: b.token })),
      null,
      2
    ) + "\n"
  );

  const byAts = new Map<Ats, number>();
  for (const board of boards) {
    byAts.set(board.ats, (byAts.get(board.ats) ?? 0) + 1);
  }

  console.log(`Found ${boards.length} boards with live jobs.`);
  for (const ats of ATS_ORDER) {
    console.log(`  ${ats}: ${byAts.get(ats) ?? 0}`);
  }
  console.log(`\nWrote ${path.relative(process.cwd(), OUT_FILE)}`);

  if (empty.length > 0) {
    console.log(
      `\nNo board found for ${empty.length}: ${empty.slice(0, 20).join(", ")}${
        empty.length > 20 ? " ..." : ""
      }`
    );
  }

  console.log("\nTop boards by open roles:");
  for (const board of boards.slice(0, 15)) {
    console.log(`  ${String(board.jobs).padStart(4)}  ${board.name} (${board.ats})`);
  }
}

main();
