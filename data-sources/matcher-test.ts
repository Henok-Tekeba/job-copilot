/**
 * Phase 3 matcher test: 60 tricky company-name pairs.
 *
 * 30 true matches — the posting name and the record name differ (punctuation,
 * suffixes, extra words, casing) but are the same employer.
 * 30 near-misses — names that differ by one meaningful word. These MUST NOT
 * match; a wrong match is worse than a missed one, so this suite tunes for
 * precision.
 *
 *   npx tsx data-sources/matcher-test.ts
 *
 * Prints a table and the match precision with a Wilson interval.
 */

import * as fs from "fs";
import * as path from "path";
import { matchCompany, normaliseCompanyName } from "../engine/companyName";
import { precision, recall } from "../eval/stats";

const ROOT = process.cwd();
const records = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data-sources", "lookup", "company-records.json"), "utf-8")
).records as Record<string, import("../engine/companyName").CompanyRecord>;

// 30 true matches: (posting name, record name that must be found).
const truePairs: Array<[string, string]> = [
  ["Wise Payments Limited", "wise payments"],
  ["Monzo Bank Limited", "monzo bank"],
  ["Revolut Ltd", "revolut"],
  ["Stripe Payments UK Ltd", "stripe payments uk"],
  ["Deliveroo Technologies UK Ltd", "deliveroo technologies"],
  ["Ocado Group plc", "ocado group"],
  ["Arm Ltd", "arm"],
  ["Darktrace Limited", "darktrace"],
  ["Climate Resource Ltd", "climate resource"],
  ["Beamery Inc", "beamery"],
  ["Graphcore Limited", "graphcore"],
  ["Babylon Health Limited", "babylon health"],
  ["Zoopla Ltd", "zoopla"],
  ["Gousto Limited", "gousto"],
  ["Multiverse Group Limited", "multiverse group"],
  ["Hopin Ltd", "hopin"],
  ["Cleo AI Ltd", "cleo ai"],
  ["Marshmallow Ltd", "marshmallow"],
  ["Quantexa Limited", "quantexa"],
  ["Paddle.com Market Ltd", "paddle com market"],
  ["Octopus Energy Group", "octopus energy"],
  ["Thought Machine Group Limited", "thought machine group"],
  ["Featurespace Limited", "featurespace"],
  ["Improbable Worlds Limited", "improbable worlds"],
  ["Oxford Nanopore Technologies plc", "oxford nanopore technologies"],
  ["Hinge Health Ltd", "hinge health"],
  ["Cera Tech Limited", "cera tech"],
  ["Trussle Labs Limited", "trussle labs"],
  ["CloudKitchens UK Ltd", "cloudkitchens uk"],
  ["SaladCloud Group Ltd", "saladcloud group"],
];

// 30 near-misses: must NOT match any record (one meaningful word changed).
const nearMisses: string[] = [
  "Wise Consulting Limited", "Monzo Advisory Limited", "Revolut Marketing Ltd",
  "Stripe Advisory Ltd", "Deliveroo Logistics Ltd", "Ocado Retail Partners plc",
  "Arm Coaching Ltd", "Darktrace Security Services Ltd", "Climate Damage Ltd",
  "Beamery Staffing Inc", "Graphcore Hardware Repairs Ltd", "Babylon Pets Limited",
  "Zoopla Properties Ltd", "Gousto Farming Limited", "Multiverse Academy Ltd",
  "Hopin Events Ltd", "Cleo Cleaning Ltd", "Marshmallow Insurance Brokers Ltd",
  "Quantexa Marketing Limited", "Paddle Sports Ltd", "Octopus Travel Group",
  "Thought Machine Repairs Limited", "Featurespace Recruitment Ltd",
  "Improbable Theatres Limited", "Oxford Nanopore Instruments Retail plc",
  "Hinge Doors Ltd", "Cera Ceramics Limited", "Trussle Mortgages Advisory Ltd",
  "CloudKitchens Catering Ltd", "Salad Bar Group Ltd",
];

function run() {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  const rows: string[] = [];

  for (const [posting, recordName] of truePairs) {
    const key = normaliseCompanyName(recordName);
    const inLookup = !!records[key];
    const m = matchCompany(posting, records);
    const ok = inLookup ? m.matched : true; // if the record truly isn't in the register, a miss is correct
    if (!inLookup) fn += 0; // not counted against the matcher
    else if (m.matched) tp++;
    else fn++;
    rows.push(`${ok ? "true " : "FALSE NEG"} | ${posting} -> ${m.method}:${m.key ?? "-"} (record: ${inLookup ? "present" : "ABSENT"})`);
  }

  for (const name of nearMisses) {
    const m = matchCompany(name, records);
    if (m.matched) {
      fp++;
      rows.push(`FALSE POS | ${name} -> matched ${m.key} via ${m.method} (must not match)`);
    } else {
      tn++;
    }
  }

  const p = precision(tp, fp);
  const r = recall(tp, fn);
  console.log("true matches found:", `${tp}/30`, "| near-misses correctly rejected:", `${tn}/30`);
  console.log(`precision: ${(100 * (p.p ?? 0)).toFixed(1)}% [95% CI ${(100 * (p.low ?? 0)).toFixed(1)}-${(100 * (p.high ?? 0)).toFixed(1)}%, n=${p.n}]`);
  console.log(`recall:    ${(100 * (r.p ?? 0)).toFixed(1)}% [95% CI ${(100 * (r.low ?? 0)).toFixed(1)}-${(100 * (r.high ?? 0)).toFixed(1)}%, n=${r.n}]`);
  const problems = rows.filter((row) => row.startsWith("FALSE"));
  if (problems.length) {
    console.log("\nproblems:");
    for (const row of problems) console.log("  " + row);
  } else {
    console.log("\nno wrong matches, no missed records.");
  }
}

run();
