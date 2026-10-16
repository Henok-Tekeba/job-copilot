/**
 * Region vocabulary and parsing.
 *
 * The whole point of this module: remote job feeds state eligibility in a
 * structured, comma-separated region string (e.g. Remotive's
 * `candidate_required_location` = "Northern America, LATAM, Europe, APAC").
 * Africa is almost always absent. We parse that string into a real region set
 * so eligibility becomes a lookup instead of a guess.
 */

export const REGIONS = [
  "worldwide",
  "africa",
  "europe",
  "north-america",
  "latam",
  "apac",
  "middle-east",
  "cis",
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  worldwide: "Worldwide",
  africa: "Africa",
  europe: "Europe",
  "north-america": "North America",
  latam: "Latin America",
  apac: "Asia-Pacific",
  "middle-east": "Middle East",
  cis: "CIS",
};

/**
 * Phrase -> region. Matched per comma-separated segment, longest phrase first,
 * so short tokens like "us" never match inside "australia".
 */
const PHRASE_TO_REGION: Array<[string, Region]> = [
  // worldwide / unrestricted
  ["worldwide", "worldwide"],
  ["work from anywhere", "worldwide"],
  ["anywhere", "worldwide"],
  ["any time zone", "worldwide"],
  ["any timezone", "worldwide"],
  ["all timezones", "worldwide"],
  ["all time zones", "worldwide"],
  ["global", "worldwide"],
  ["no location restriction", "worldwide"],
  ["location independent", "worldwide"],

  // africa
  ["africa", "africa"],
  ["sub-saharan", "africa"],
  ["emea", "africa"],
  ["ethiopia", "africa"],
  ["kenya", "africa"],
  ["nairobi", "africa"],
  ["nigeria", "africa"],
  ["lagos", "africa"],
  ["ghana", "africa"],
  ["accra", "africa"],
  ["south africa", "africa"],
  ["cape town", "africa"],
  ["johannesburg", "africa"],
  ["egypt", "africa"],
  ["cairo", "africa"],
  ["morocco", "africa"],
  ["tunisia", "africa"],
  ["algeria", "africa"],
  ["rwanda", "africa"],
  ["kigali", "africa"],
  ["uganda", "africa"],
  ["tanzania", "africa"],
  ["zambia", "africa"],
  ["zimbabwe", "africa"],
  ["senegal", "africa"],
  ["cameroon", "africa"],
  ["mozambique", "africa"],
  ["angola", "africa"],
  ["botswana", "africa"],
  ["namibia", "africa"],
  ["malawi", "africa"],
  ["somalia", "africa"],
  ["sudan", "africa"],
  ["libya", "africa"],
  ["mali", "africa"],
  ["benin", "africa"],
  ["togo", "africa"],
  ["sierra leone", "africa"],
  ["liberia", "africa"],
  ["gambia", "africa"],
  ["guinea", "africa"],
  ["congo", "africa"],
  ["madagascar", "africa"],
  ["mauritius", "africa"],
  ["eritrea", "africa"],
  ["djibouti", "africa"],
  ["burundi", "africa"],
  ["mauritania", "africa"],
  ["cape verde", "africa"],
  ["eswatini", "africa"],
  ["lesotho", "africa"],

  // europe
  ["europe", "europe"],
  ["european union", "europe"],
  ["eu", "europe"],
  ["uk", "europe"],
  ["united kingdom", "europe"],
  ["england", "europe"],
  ["london", "europe"],
  ["ireland", "europe"],
  ["dublin", "europe"],
  ["germany", "europe"],
  ["berlin", "europe"],
  ["munich", "europe"],
  ["france", "europe"],
  ["paris", "europe"],
  ["netherlands", "europe"],
  ["amsterdam", "europe"],
  ["spain", "europe"],
  ["portugal", "europe"],
  ["lisbon", "europe"],
  ["italy", "europe"],
  ["poland", "europe"],
  ["warsaw", "europe"],
  ["romania", "europe"],
  ["czech", "europe"],
  ["prague", "europe"],
  ["hungary", "europe"],
  ["ukraine", "europe"],
  ["croatia", "europe"],
  ["serbia", "europe"],
  ["bulgaria", "europe"],
  ["greece", "europe"],
  ["sweden", "europe"],
  ["stockholm", "europe"],
  ["norway", "europe"],
  ["denmark", "europe"],
  ["copenhagen", "europe"],
  ["finland", "europe"],
  ["helsinki", "europe"],
  ["switzerland", "europe"],
  ["zurich", "europe"],
  ["austria", "europe"],
  ["vienna", "europe"],
  ["belgium", "europe"],
  ["brussels", "europe"],
  ["iceland", "europe"],
  ["lithuania", "europe"],
  ["latvia", "europe"],
  ["estonia", "europe"],
  ["slovakia", "europe"],
  ["slovenia", "europe"],
  ["luxembourg", "europe"],
  ["malta", "europe"],
  ["cyprus", "europe"],

  // north america
  ["north america", "north-america"],
  ["northern america", "north-america"],
  ["usa", "north-america"],
  ["u.s.", "north-america"],
  ["us", "north-america"],
  ["united states", "north-america"],
  ["canada", "north-america"],
  ["toronto", "north-america"],
  ["vancouver", "north-america"],
  ["new york", "north-america"],
  ["san francisco", "north-america"],
  ["seattle", "north-america"],
  ["austin", "north-america"],
  ["boston", "north-america"],
  ["chicago", "north-america"],

  // latam
  ["latam", "latam"],
  ["latin america", "latam"],
  ["south america", "latam"],
  ["central america", "latam"],
  ["brazil", "latam"],
  ["mexico", "latam"],
  ["argentina", "latam"],
  ["colombia", "latam"],
  ["chile", "latam"],
  ["peru", "latam"],
  ["costa rica", "latam"],

  // apac
  ["apac", "apac"],
  ["asia pacific", "apac"],
  ["asia", "apac"],
  ["india", "apac"],
  ["bangalore", "apac"],
  ["japan", "apac"],
  ["tokyo", "apac"],
  ["singapore", "apac"],
  ["australia", "apac"],
  ["sydney", "apac"],
  ["melbourne", "apac"],
  ["new zealand", "apac"],
  ["auckland", "apac"],
  ["china", "apac"],
  ["hong kong", "apac"],
  ["taiwan", "apac"],
  ["korea", "apac"],
  ["philippines", "apac"],
  ["indonesia", "apac"],
  ["vietnam", "apac"],
  ["thailand", "apac"],
  ["malaysia", "apac"],
  ["pakistan", "apac"],
  ["bangladesh", "apac"],
  ["sri lanka", "apac"],

  // middle east
  ["middle east", "middle-east"],
  ["israel", "middle-east"],
  ["tel aviv", "middle-east"],
  ["uae", "middle-east"],
  ["dubai", "middle-east"],
  ["saudi", "middle-east"],
  ["qatar", "middle-east"],
  ["turkey", "middle-east"],
  ["istanbul", "middle-east"],
  ["jordan", "middle-east"],
  ["lebanon", "middle-east"],

  // cis
  ["cis", "cis"],
  ["russia", "cis"],
  ["armenia", "cis"],
  ["georgia", "cis"],
  ["kazakhstan", "cis"],
  ["azerbaijan", "cis"],
  ["belarus", "cis"],
  ["uzbekistan", "cis"],
];

const SORTED_PHRASES = [...PHRASE_TO_REGION].sort(
  (a, b) => b[0].length - a[0].length
);

/** Split a structured region string into its segments. */
export function splitRegionSegments(raw: string): string[] {
  return raw
    .split(/[,/;·|]+|\band\b/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Match a single segment against the vocabulary.
 * Uses word boundaries so "us" cannot match inside "australia".
 */
function matchSegment(segment: string): Region | null {
  for (const [phrase, region] of SORTED_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    if (pattern.test(segment)) {
      return region;
    }
  }
  return null;
}

export type ParsedRegions = {
  /** Segments we recognised, mapped to canonical regions. */
  regions: Region[];
  /** Region phrase -> the raw segment it came from, for evidence. */
  matched: Array<{ phrase: string; region: Region }>;
  /** Segments we could not map. Non-empty means the post is ambiguous. */
  unknown: string[];
  /** True when the whole string is just a "remote" qualifier. */
  bare: boolean;
};

/**
 * Parse a structured or free-text region string into region tokens.
 */
export function parseRegions(raw: string | null | undefined): ParsedRegions {
  const result: ParsedRegions = {
    regions: [],
    matched: [],
    unknown: [],
    bare: false,
  };

  const text = (raw ?? "").trim();
  if (!text) return result;

  const segments = splitRegionSegments(text);
  if (segments.length === 0) return result;

  const seen = new Set<Region>();

  for (const segment of segments) {
    // Strip qualifiers like "remote (global)" or "remote only".
    const cleaned = segment
      .replace(/^remote\s*(only)?\s*[:(]?\s*/i, "")
      .replace(/\)\s*$/, "")
      .trim();

    const bare = cleaned === "" || /^remote( only)?$/.test(cleaned);

    if (bare) {
      result.bare = true;
      continue;
    }

    const region = matchSegment(cleaned);
    if (region) {
      result.matched.push({ phrase: cleaned, region });
      if (!seen.has(region)) {
        seen.add(region);
        result.regions.push(region);
      }
    } else {
      result.unknown.push(cleaned);
    }
  }

  return result;
}

/**
 * Does a region set include somewhere the candidate can work from Ethiopia?
 * Only "worldwide" and "africa" qualify.
 */
export function regionsAllowAfrica(regions: Region[]): boolean {
  return regions.includes("worldwide") || regions.includes("africa");
}

/** Timezone bands, used to judge whether a role is workable from East Africa. */
export type TimezoneBand = "americas" | "europe-africa" | "apac" | null;

const TIMEZONE_PATTERNS: Array<[RegExp, TimezoneBand]> = [
  [/emea/i, "europe-africa"],
  [
    /\b(pst|pdt|est|edt|cst|cdt|mst|mdt|pacific time|eastern time|central time|mountain time|usa timezones?|us timezones?|americas)\b/i,
    "americas",
  ],
  [/\b(cet|cest|gmt|utc|bst|west|eet|europe)\b/i, "europe-africa"],
  [/\b(jst|kst|ist|aest|aedt|apac)\b/i, "apac"],
];

export function detectTimezoneBand(text: string): TimezoneBand {
  for (const [pattern, band] of TIMEZONE_PATTERNS) {
    if (pattern.test(text)) return band;
  }
  return null;
}

/**
 * East Africa Time is UTC+3. A European/GMT band gives a full working overlap;
 * the Americas and APAC bands leave only a few shared hours.
 */
export function bandOverlapsAfrica(band: TimezoneBand): boolean | null {
  if (band === null) return null;
  return band === "europe-africa";
}
