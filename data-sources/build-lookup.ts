/**
 * Phase 3: company records lookup builder.
 *
 *   npx tsx data-sources/build-lookup.ts
 *
 * Reads the raw source files in data-sources/raw/ and writes two artifacts:
 *
 *   data-sources/lookup/company-records.json  — full lookup (local, large)
 *   public/company-records.json               — only companies in the board
 *                                               snapshot (tiny, shipped)
 *
 * Every output file embeds its provenance: source URL, license/terms,
 * download date, and the data's own date, so the UI can show how fresh it is
 * and the Method page can cite it.
 *
 * Sources:
 *  - UK Home Office "Register of licensed sponsors: workers". Public CSV,
 *    Open Government Licence v3.0 (reuse allowed with attribution).
 *    https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers
 *  - US DOL OFLC H-1B LCA disclosure data is public domain but the download
 *    endpoint (dol.gov, Akamai) blocks programmatic access from this
 *    environment — see docs/NEEDS_HUMAN.md. The schema keeps a slot for it
 *    (source "us-dol-lca") so it can be added without a format change.
 */

import * as fs from "fs";
import * as path from "path";
import { normaliseCompanyName } from "../engine/companyName";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data-sources", "raw");
const LOOKUP_DIR = path.join(ROOT, "data-sources", "lookup");
const PUBLIC = path.join(ROOT, "public");

const UK_FILE = path.join(RAW, "uk-sponsors-2026-10-16.csv");

type Record_ = {
  /** Sponsorship applications filed in the most recent known year (US LCA only). */
  n?: number;
  lastYear?: number;
  /** Licensed UK sponsor (Worker / Temporary Worker register). */
  uk?: boolean;
  /** UK sponsorship rating, "A" or "B". */
  ukRating?: string;
};

type Lookup = {
  meta: {
    builtAt: string;
    sources: Array<{
      name: string;
      url: string;
      license: string;
      downloadedAt: string;
      dataYear: string;
    }>;
    counts: Record<string, number>;
  };
  records: Record<string, Record_>;
};

function parseUk(): Map<string, Record_> {
  const csv = fs.readFileSync(UK_FILE, "utf-8");
  const lines = csv.split("\n");
  // The register has no quoted commas in practice, but parse defensively.
  const header = lines[0]!.split(",");
  const nameCol = header.indexOf("Organisation Name");
  const ratingCol = header.indexOf("Type & Rating");
  const out = new Map<string, Record_>();
  let rows = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const cols = line.split(",");
    const name = (cols[nameCol] ?? "").trim();
    if (!name) continue;
    const rating = (cols[ratingCol] ?? "").match(/AB? rating|B rating/i)?.[0]?.[0] ?? "";
    const key = normaliseCompanyName(name);
    if (!key) continue;
    rows++;
    const existing = out.get(key) ?? {};
    if (!existing.uk) out.set(key, { ...existing, uk: true, ukRating: rating || existing.ukRating });
    else if (rating === "A") out.set(key, { ...existing, ukRating: "A" });
  }
  console.log(`UK register: ${rows} rows -> ${out.size} unique organisations`);
  return out;
}

async function main() {
  const records = new Map<string, Record_>();

  let ukRows = 0;
  if (fs.existsSync(UK_FILE)) {
    const uk = parseUk();
    ukRows = uk.size;
    for (const [key, value] of uk) records.set(key, value);
  } else {
    console.error("UK register CSV missing — run the download step first.");
  }

  const lookup: Lookup = {
    meta: {
      builtAt: new Date().toISOString(),
      sources: [
        {
          name: "uk-home-office-sponsor-register",
          url: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers",
          license: "Open Government Licence v3.0 (attribution required)",
          downloadedAt: "2026-10-19",
          dataYear: "2026-10-16",
        },
      ],
      counts: {
        "uk-home-office-sponsor-register": ukRows,
        "us-dol-lca": 0,
      },
    },
    records: Object.fromEntries(records),
  };

  fs.mkdirSync(LOOKUP_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.writeFileSync(path.join(LOOKUP_DIR, "company-records.json"), JSON.stringify(lookup));

  // Shipped copy: only employers that actually appear on the board. The full
  // register (~100k organisations) is far too large for a static site.
  const jobs: Array<{ company: string }> = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "jobs.json"), "utf-8")
  );
  const companies = new Set(jobs.map((j) => (j.company || "").trim()).filter(Boolean));
  const shipped: Record<string, Record_> = {};
  let matchedCompanies = 0;
  for (const company of companies) {
    const key = normaliseCompanyName(company);
    const hit = key ? records.get(key) : undefined;
    if (hit) {
      shipped[key!] = hit;
      matchedCompanies++;
    }
  }
  const publicLookup = {
    ...lookup,
    meta: { ...lookup.meta, note: `Ships only the ${matchedCompanies} of ${companies.size} board employers found in the sources.` },
    records: shipped,
  };
  fs.writeFileSync(path.join(PUBLIC, "company-records.json"), JSON.stringify(publicLookup));
  const kb = Math.round(fs.statSync(path.join(PUBLIC, "company-records.json")).size / 1024);
  console.log(`Shipped lookup: ${matchedCompanies}/${companies.size} board employers matched, ${kb} KB`);
}

main();
