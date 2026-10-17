/**
 * Write the browser-facing job snapshot to `public/`.
 *
 * The jobs page used to receive every posting as component props, which Next
 * serialises straight into the HTML. With 4,000 postings that produced a
 * **17 MB `out/index.html`** — fine on a laptop, unusable on a phone.
 *
 * The list now fetches this file instead. The HTML stays a small shell, and the
 * payload becomes a cacheable asset that the host compresses.
 *
 * Run automatically by `npm run build`.
 */

import * as fs from "fs";
import * as path from "path";
import { jobSchema } from "../lib/types";
import type { Job } from "../lib/types";

const SOURCE = path.join(process.cwd(), "data", "jobs.json");
const DEST_DIR = path.join(process.cwd(), "public");
const DEST = path.join(DEST_DIR, "jobs.json");

function fail(message: string, detail: string[] = []): never {
  console.error(`\nemit-public-data: ${message}`);
  for (const line of detail) console.error(`  ${line}`);
  console.error("");
  process.exit(1);
}

if (!fs.existsSync(SOURCE)) {
  fail("data/jobs.json is missing.", [
    "Run scripts/sync-data.sh to pull it, or npm run collect to build it.",
  ]);
}

let parsed;
try {
  parsed = jobSchema.array().safeParse(JSON.parse(fs.readFileSync(SOURCE, "utf-8")));
} catch (err) {
  fail(`data/jobs.json is not valid JSON: ${String(err)}`);
}

if (!parsed.success) {
  fail(
    `data/jobs.json failed schema validation (${parsed.error.issues.length} issue(s)):`,
    parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
  );
}

const jobs: Job[] = parsed.data;

fs.mkdirSync(DEST_DIR, { recursive: true });
fs.writeFileSync(DEST, JSON.stringify(jobs));

const bytes = fs.statSync(DEST).size;
console.log(
  `emit-public-data: wrote ${jobs.length} jobs to public/jobs.json (${(bytes / 1e6).toFixed(1)} MB raw)`
);
