/**
 * Phase 1, step 4: lock the dev/test split.
 *
 * Splits eval/postings.jsonl into 200 dev / 100 test with a fixed seed. The
 * split is written once to eval/split.json and never regenerated with a
 * different seed: the test set is only ever used for final reporting, and
 * changing its membership after looking at results would make every number
 * meaningless.
 *
 * Run: npx tsx eval/split.ts   (refuses to overwrite an existing split)
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const POSTINGS = path.join(ROOT, "eval", "postings.jsonl");
const OUT = path.join(ROOT, "eval", "split.json");

const SEED = 20261018;
const TEST_SIZE = 100;

/** Same deterministic PRNG as sample.ts, so the seed fully determines the split. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (fs.existsSync(OUT)) {
  console.error(
    "eval/split.json already exists. The split is locked; regenerate it only" +
      " with a deliberate, separate commit that says why."
  );
  process.exit(1);
}

const ids = fs
  .readFileSync(POSTINGS, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line).id as string);

const rand = mulberry32(SEED);
for (let i = ids.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
}

const test = ids.slice(0, TEST_SIZE).sort();
const dev = ids.slice(TEST_SIZE).sort();

fs.writeFileSync(
  OUT,
  JSON.stringify(
    { seed: SEED, testSize: TEST_SIZE, generatedAt: new Date().toISOString(), dev, test },
    null,
    2
  )
);

console.log(`Split locked: ${dev.length} dev, ${test.length} test (seed ${SEED})`);
