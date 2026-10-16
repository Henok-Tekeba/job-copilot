/**
 * Red-flag detection.
 *
 * Job boards aimed at early-career candidates in emerging markets are full of
 * commission-only gigs and outright fee scams. Surfacing these before someone
 * spends an evening applying is cheap and high-value.
 */

const RED_FLAGS: Array<[RegExp, string]> = [
  [/\bcommission[- ]only\b/i, "Commission-only pay"],
  [/\bunpaid\b|\bno (monetary )?compensation\b|\bwithout pay\b/i, "Unpaid"],
  [/\bequity[- ]only\b|\bpaid in equity\b/i, "Equity only"],
  [/\b(registration|application|processing|training|onboarding) fee\b/i, "Asks for a payment"],
  [/\bmust (pay|purchase|buy)\b.{0,40}\b(to (start|begin|apply)|for (training|equipment|onboarding))\b/i, "Asks for a payment"],
  [/\bpay for (your|the) (training|equipment|onboarding)\b/i, "Asks for a payment"],
  [/\b(mlm|multi[- ]level marketing)\b/i, "MLM"],
  [/\bcommission[- ]based\b.{0,30}\b(no base|only)\b/i, "Commission-only pay"],
];

export function findRedFlags(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const [pattern, label] of RED_FLAGS) {
    if (pattern.test(text)) found.add(label);
  }
  return [...found];
}
