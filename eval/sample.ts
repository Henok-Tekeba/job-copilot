/**
 * Phase 1, step 1: build the labeling sample.
 *
 * Picks 300 postings from data/fulltext.jsonl with a deliberate spread:
 *  - every source contributes (the engine must work on all of them),
 *  - no company dominates (max 5 per company),
 *  - short and long bodies both appear (stance lives in different places).
 * Postings whose text is not the real body (truncated: true) are excluded.
 *
 * Output is shuffled once, here, so the labeling tool's order is random but
 * stable across sessions. Run: npx tsx eval/sample.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const FULLTEXT = path.join(ROOT, "data", "fulltext.jsonl");
const JOBS = path.join(ROOT, "data", "jobs.json");
const OUT = path.join(ROOT, "eval", "postings.jsonl");

const TARGET = 300;
const MAX_PER_COMPANY = 5;

type FulltextRecord = {
  id: string;
  hash: string;
  truncated: boolean;
  text: string;
};

type StoredJob = {
  id: string;
  company: string;
  title: string;
  sourceUrl: string;
  source: string;
};

/** Deterministic shuffle so re-running the script reproduces the same sample. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20261018;

function main() {
  const fulltext: FulltextRecord[] = fs
    .readFileSync(FULLTEXT, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const jobs: StoredJob[] = JSON.parse(fs.readFileSync(JOBS, "utf-8"));
  const byId = new Map(jobs.map((j) => [j.id, j]));

  // Only postings with a real, complete body are labelable.
  const eligible = fulltext.filter((r) => !r.truncated && r.text.length >= 200);
  const dropped = fulltext.length - eligible.length;

  // Round-robin across sources so one big board cannot crowd out the rest.
  const bySource = new Map<string, FulltextRecord[]>();
  for (const record of eligible) {
    const job = byId.get(record.id);
    const source = job?.source ?? "unknown";
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source)!.push(record);
  }

  const perCompany = new Map<string, number>();
  const picked: Array<FulltextRecord & { source: string }> = [];
  const queues = Array.from(bySource.values()).map((q) => q.reverse());

  let advanced = true;
  while (picked.length < TARGET && advanced) {
    advanced = false;
    for (const queue of queues) {
      while (queue.length) {
        const record = queue.pop()!;
        const job = byId.get(record.id);
        const company = (job?.company ?? "").toLowerCase();
        if ((perCompany.get(company) ?? 0) >= MAX_PER_COMPANY) continue;
        perCompany.set(company, (perCompany.get(company) ?? 0) + 1);
        picked.push({ ...record, source: job?.source ?? "unknown" });
        advanced = true;
        break;
      }
      if (picked.length >= TARGET) break;
    }
  }

  const rand = mulberry32(SEED);
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picked[i], picked[j]] = [picked[j]!, picked[i]!];
  }

  const lines = picked.map((record) => {
    const job = byId.get(record.id);
    return JSON.stringify({
      id: record.id,
      company: job?.company ?? "",
      title: job?.title ?? "",
      url: job?.sourceUrl ?? "",
      source: job?.source ?? "unknown",
      hash: record.hash,
      text: record.text,
    });
  });

  fs.writeFileSync(OUT, lines.join("\n") + "\n");

  console.log(`Sampled ${picked.length} of ${eligible.length} labelable postings`);
  console.log(`Excluded ${dropped} (no real posting body or too short)`);
  const counts = new Map<string, number>();
  for (const p of picked) counts.set(p.source, (counts.get(p.source) ?? 0) + 1);
  for (const [source, count] of counts) console.log(`  ${source}: ${count}`);
}

main();
