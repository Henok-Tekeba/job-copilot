/**
 * Phase 5: compute engine verdicts for every posting, for the static site.
 *
 *   npx tsx scripts/emit-verdicts.ts      (runs as part of npm run build)
 *
 * Reads data/fulltext.jsonl (the complete posting bodies collected in Phase 1)
 * and data-sources/lookup/company-records.json, runs the same engine the
 * landing paste tool runs in the browser, and writes public/verdicts.json.
 * The board fetches it next to jobs.json and joins by id — no server, the
 * scoring happened once at build time.
 */

import * as fs from "fs";
import * as path from "path";
import { detectTextStance } from "../engine/textStance";
import { combineVerdict } from "../engine/verdict";
import { matchCompany, normaliseCompanyName } from "../engine/companyName";
import { ENGINE_VERSION } from "../engine/version";

const ROOT = process.cwd();
const FULLTEXT = path.join(ROOT, "data", "fulltext.jsonl");
const LOOKUP = path.join(ROOT, "data-sources", "lookup", "company-records.json");
const ALIASES = path.join(ROOT, "data-sources", "aliases.json");
const OUT = path.join(ROOT, "public", "verdicts.json");

type FulltextRecord = { id: string; hash: string; truncated: boolean; text: string };

function main() {
  if (!fs.existsSync(FULLTEXT)) {
    console.error("emit-verdicts: data/fulltext.jsonl missing — run the collect first.");
    process.exit(1);
  }
  const lookup = fs.existsSync(LOOKUP)
    ? JSON.parse(fs.readFileSync(LOOKUP, "utf-8"))
    : { meta: { sources: [] }, records: {} };
  const aliases = fs.existsSync(ALIASES)
    ? JSON.parse(fs.readFileSync(ALIASES, "utf-8")).aliases
    : {};
  const records = lookup.records as Record<string, { uk?: boolean; ukRating?: string; n?: number; lastYear?: number }>;
  const ukSource = lookup.meta.sources.find((s: { name: string }) => s.name === "uk-home-office-sponsor-register");

  const rows: FulltextRecord[] = fs
    .readFileSync(FULLTEXT, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const companyById = new Map<string, string>();
  const jobs: Array<{ id: string; company: string }> = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "jobs.json"), "utf-8")
  );
  for (const j of jobs) companyById.set(j.id, j.company || "");

  const verdicts: Record<
    string,
    { status: string; confidence: number; reasons: Array<Record<string, unknown>> }
  > = {};
  const counts = { open: 0, likely: 0, unclear: 0, unlikely: 0 };

  for (const row of rows) {
    const stance = detectTextStance(row.text);
    const company = companyById.get(row.id) ?? "";
    const match = matchCompany(company, records, aliases);
    const record = match.matched && match.key ? records[match.key] : undefined;
    const verdict = combineVerdict({
      textStance: stance,
      company,
      record,
      recordMatchConfidence: match.matched ? match.confidence : 0,
      provenance: ukSource
        ? { name: "UK Home Office sponsor register", dataYear: ukSource.dataYear }
        : undefined,
    });
    counts[verdict.status]++;
    verdicts[row.id] = {
      status: verdict.status,
      confidence: verdict.confidence,
      reasons: verdict.reasons,
    };
  }

  const out = {
    meta: {
      engineVersion: ENGINE_VERSION,
      builtAt: new Date().toISOString(),
      recordSource: ukSource
        ? {
            name: "UK Home Office sponsor register",
            url: ukSource.url,
            license: ukSource.license,
            dataYear: ukSource.dataYear,
          }
        : null,
      counts,
    },
    verdicts,
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
  console.log(
    `emit-verdicts: ${rows.length} verdicts (${counts.open} open, ${counts.likely} likely, ${counts.unclear} unclear, ${counts.unlikely} unlikely) — ${mb} MB`
  );
}

main();
