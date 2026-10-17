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
  ["addis ababa", "africa"],
  ["addis", "africa"],
  ["cairo", "africa"],
  ["lagos", "africa"],
  ["abuja", "africa"],
  ["nairobi", "africa"],
  ["mombasa", "africa"],
  ["accra", "africa"],
  ["kumasi", "africa"],
  ["johannesburg", "africa"],
  ["cape town", "africa"],
  ["durban", "africa"],
  ["pretoria", "africa"],
  ["casablanca", "africa"],
  ["rabat", "africa"],
  ["tunis", "africa"],
  ["kampala", "africa"],
  ["kigali", "africa"],
  ["dar es salaam", "africa"],
  ["kinshasa", "africa"],
  ["luanda", "africa"],
  ["lusaka", "africa"],
  ["harare", "africa"],
  ["maputo", "africa"],
  ["gaborone", "africa"],
  ["dakar", "africa"],
  ["abidjan", "africa"],
  ["douala", "africa"],
  ["khartoum", "africa"],
  ["asmara", "africa"],
  ["mogadishu", "africa"],
  ["bamako", "africa"],
  ["niamey", "africa"],
  ["lome", "africa"],
  ["monrovia", "africa"],
  ["freetown", "africa"],
  ["conakry", "africa"],
  ["bujumbura", "africa"],
  ["lilongwe", "africa"],
  ["port louis", "africa"],
  ["blantyre", "africa"],
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
  ["barcelona", "europe"],
  ["madrid", "europe"],
  ["milan", "europe"],
  ["rome", "europe"],
  ["bucharest", "europe"],
  ["kaunas", "europe"],
  ["vilnius", "europe"],
  ["riga", "europe"],
  ["tallinn", "europe"],
  ["krakow", "europe"],
  ["sofia", "europe"],
  ["frankfurt", "europe"],
  ["hamburg", "europe"],
  ["stuttgart", "europe"],
  ["edinburgh", "europe"],
  ["manchester", "europe"],
  ["bristol", "europe"],
  ["glasgow", "europe"],
  ["cardiff", "europe"],
  ["belfast", "europe"],
  ["naples", "europe"],
  ["turin", "europe"],
  ["valencia", "europe"],
  ["seville", "europe"],
  ["porto", "europe"],
  ["lyon", "europe"],
  ["toulouse", "europe"],
  ["nantes", "europe"],
  ["rotterdam", "europe"],
  ["utrecht", "europe"],
  ["antwerp", "europe"],
  ["gothenburg", "europe"],
  ["malmo", "europe"],
  ["aarhus", "europe"],

  // north america
  ["north america", "north-america"],
  ["northern america", "north-america"],
  ["americas", "north-america"],
  ["usa", "north-america"],
  ["u.s.", "north-america"],
  ["u.s.a.", "north-america"],
  ["us", "north-america"],
  ["united states", "north-america"],
  ["canada", "north-america"],
  ["can", "north-america"],
  ["toronto", "north-america"],
  ["vancouver", "north-america"],
  ["montreal", "north-america"],
  ["ottawa", "north-america"],
  ["calgary", "north-america"],
  ["edmonton", "north-america"],
  ["waterloo", "north-america"],
  ["mississauga", "north-america"],
  ["ontario", "north-america"],
  ["quebec", "north-america"],
  ["new york", "north-america"],
  ["nyc", "north-america"],
  ["brooklyn", "north-america"],
  ["san francisco", "north-america"],
  ["sf", "north-america"],
  ["bay area", "north-america"],
  ["silicon valley", "north-america"],
  ["san jose", "north-america"],
  ["santa clara", "north-america"],
  ["sunnyvale", "north-america"],
  ["mountain view", "north-america"],
  ["palo alto", "north-america"],
  ["cupertino", "north-america"],
  ["san mateo", "north-america"],
  ["oakland", "north-america"],
  ["berkeley", "north-america"],
  ["sacramento", "north-america"],
  ["san diego", "north-america"],
  ["los angeles", "north-america"],
  ["irvine", "north-america"],
  ["seattle", "north-america"],
  ["bellevue", "north-america"],
  ["redmond", "north-america"],
  ["portland", "north-america"],
  ["austin", "north-america"],
  ["dallas", "north-america"],
  ["houston", "north-america"],
  ["san antonio", "north-america"],
  ["denver", "north-america"],
  ["boulder", "north-america"],
  ["salt lake city", "north-america"],
  ["phoenix", "north-america"],
  ["chicago", "north-america"],
  ["boston", "north-america"],
  ["cambridge ma", "north-america"],
  ["atlanta", "north-america"],
  ["miami", "north-america"],
  ["orlando", "north-america"],
  ["tampa", "north-america"],
  ["nashville", "north-america"],
  ["charlotte", "north-america"],
  ["raleigh", "north-america"],
  ["durham", "north-america"],
  ["richmond", "north-america"],
  ["baltimore", "north-america"],
  ["philadelphia", "north-america"],
  ["pittsburgh", "north-america"],
  ["cleveland", "north-america"],
  ["columbus", "north-america"],
  ["cincinnati", "north-america"],
  ["detroit", "north-america"],
  ["minneapolis", "north-america"],
  ["saint louis", "north-america"],
  ["st louis", "north-america"],
  ["jersey city", "north-america"],
  ["washington dc", "north-america"],
  ["washington, dc", "north-america"],
  ["district of columbia", "north-america"],

  // US states and unambiguous state codes. Codes that are also English words
  // (in, or, me, de, hi) are deliberately absent — they would match prose.
  ["alabama", "north-america"],
  ["alaska", "north-america"],
  ["arizona", "north-america"],
  ["arkansas", "north-america"],
  ["california", "north-america"],
  ["colorado", "north-america"],
  ["connecticut", "north-america"],
  ["delaware", "north-america"],
  ["florida", "north-america"],
  ["hawaii", "north-america"],
  ["idaho", "north-america"],
  ["illinois", "north-america"],
  ["indiana", "north-america"],
  ["iowa", "north-america"],
  ["kansas", "north-america"],
  ["kentucky", "north-america"],
  ["louisiana", "north-america"],
  ["maine", "north-america"],
  ["maryland", "north-america"],
  ["massachusetts", "north-america"],
  ["michigan", "north-america"],
  ["minnesota", "north-america"],
  ["mississippi", "north-america"],
  ["missouri", "north-america"],
  ["montana", "north-america"],
  ["nebraska", "north-america"],
  ["nevada", "north-america"],
  ["new hampshire", "north-america"],
  ["new jersey", "north-america"],
  ["new mexico", "north-america"],
  ["north carolina", "north-america"],
  ["north dakota", "north-america"],
  ["ohio", "north-america"],
  ["oklahoma", "north-america"],
  ["oregon", "north-america"],
  ["pennsylvania", "north-america"],
  ["rhode island", "north-america"],
  ["south carolina", "north-america"],
  ["south dakota", "north-america"],
  ["tennessee", "north-america"],
  ["texas", "north-america"],
  ["utah", "north-america"],
  ["vermont", "north-america"],
  ["virginia", "north-america"],
  ["west virginia", "north-america"],
  ["wisconsin", "north-america"],
  ["wyoming", "north-america"],
  ["ca", "north-america"],
  ["ny", "north-america"],
  ["wa", "north-america"],
  ["dc", "north-america"],
  ["tx", "north-america"],
  ["ma", "north-america"],
  ["il", "north-america"],
  ["nj", "north-america"],
  ["pa", "north-america"],
  ["ga", "north-america"],
  ["nc", "north-america"],
  ["sc", "north-america"],
  ["va", "north-america"],
  ["md", "north-america"],
  ["mn", "north-america"],
  ["mo", "north-america"],
  ["wi", "north-america"],
  ["az", "north-america"],
  ["co", "north-america"],
  ["ut", "north-america"],
  ["nv", "north-america"],
  ["mt", "north-america"],
  ["wy", "north-america"],
  ["nm", "north-america"],
  ["nd", "north-america"],
  ["sd", "north-america"],
  ["ak", "north-america"],
  ["ky", "north-america"],
  ["tn", "north-america"],
  ["ia", "north-america"],
  ["ks", "north-america"],
  ["ne", "north-america"],
  ["id", "north-america"],
  ["ri", "north-america"],
  ["ct", "north-america"],
  ["vt", "north-america"],
  ["nh", "north-america"],
  ["la", "north-america"],

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
  ["são paulo", "latam"],
  ["sao paulo", "latam"],
  ["rio de janeiro", "latam"],
  ["buenos aires", "latam"],
  ["bogotá", "latam"],
  ["bogota", "latam"],
  ["medellin", "latam"],
  ["santiago", "latam"],
  ["lima", "latam"],
  ["monterrey", "latam"],
  ["guadalajara", "latam"],
  ["curitiba", "latam"],
  ["porto alegre", "latam"],
  ["brasilia", "latam"],
  ["montevideo", "latam"],
  ["quito", "latam"],
  ["panama city", "latam"],
  ["san josé", "latam"],
  ["uruguay", "latam"],
  ["ecuador", "latam"],
  ["bolivia", "latam"],

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
  ["united arab emirates", "middle-east"],
  ["abu dhabi", "middle-east"],
  ["riyadh", "middle-east"],
  ["doha", "middle-east"],
  ["amman", "middle-east"],
  ["beirut", "middle-east"],
  ["kuwait", "middle-east"],
  ["bahrain", "middle-east"],
  ["oman", "middle-east"],
  ["saudi arabia", "middle-east"],

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

/**
 * Workplace qualifiers that travel inside location strings, e.g.
 * "Sunnyvale, CA (hybrid)". They say nothing about geography, so treating them
 * as unrecognised regions would push a clear posting into "unknown".
 */
const WORKPLACE_QUALIFIER =
  /^(hybrid|on-?site|on site|in-?office|in office|in-?person|in person|remote( only)?|remote-?friendly|friendly|travel-?required|travel required|flexible|full-?time|part-?time|contract|multiple locations|various)$/i;

/** Strip decoration so "-(hybrid" and "remote (global" are readable. */
function cleanSegment(segment: string): string {
  return segment
    .replace(/^remote\s*(only)?\s*[:(]?\s*/i, "")
    .replace(/^[-–—:(\s]+/, "")
    .replace(/[-–—\s()]+$/, "")
    .trim();
}

const REGION_LEVEL_PHRASES = new Set([
  "worldwide",
  "work from anywhere",
  "anywhere",
  "any time zone",
  "any timezone",
  "all timezones",
  "all time zones",
  "global",
  "no location restriction",
  "location independent",
  "africa",
  "sub-saharan",
  "emea",
  "europe",
  "european union",
  "eu",
  "north america",
  "northern america",
  "latam",
  "latin america",
  "south america",
  "central america",
  "apac",
  "asia pacific",
  "asia",
  "middle east",
  "cis",
]);

/** Places the candidate themselves can work from. */
export const DEFAULT_CANDIDATE_PLACES = ["ethiopia", "addis ababa", "addis"];

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
  /** Regions named at region granularity, e.g. "Africa", "EMEA", "Worldwide". */
  regionLevel: Region[];
  /** Segments naming a whole region, for display. */
  regionPhrases: string[];
  /** Segments naming one specific country or city, e.g. "Kenya", "Nairobi". */
  places: string[];
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
    regionLevel: [],
    regionPhrases: [],
    places: [],
    unknown: [],
    bare: false,
  };

  const text = (raw ?? "").trim();
  if (!text) return result;

  const segments = splitRegionSegments(text);
  if (segments.length === 0) return result;

  const seen = new Set<Region>();
  const seenRegionLevel = new Set<Region>();

  const record = (phrase: string, region: Region, regionLevel: boolean) => {
    result.matched.push({ phrase, region });
    if (!seen.has(region)) {
      seen.add(region);
      result.regions.push(region);
    }
    if (regionLevel) {
      result.regionPhrases.push(phrase);
      if (!seenRegionLevel.has(region)) {
        seenRegionLevel.add(region);
        result.regionLevel.push(region);
      }
    } else {
      result.places.push(phrase);
    }
  };

  for (const segment of segments) {
    // Strip qualifiers like "remote (global)" or "remote only".
    const cleaned = cleanSegment(segment);

    const bare = cleaned === "" || /^remote( only)?$/.test(cleaned);

    if (bare) {
      result.bare = true;
      continue;
    }

    // "hybrid", "in-office" and friends travel inside location strings but say
    // nothing about geography, so they must not become unknown regions.
    if (WORKPLACE_QUALIFIER.test(cleaned)) continue;

    // Longest phrase first, so "south africa" beats "africa".
    const hit = SORTED_PHRASES.find(([phrase]) =>
      new RegExp(
        `(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`,
        "i"
      ).test(cleaned)
    );

    if (hit) {
      // Label with the matched phrase, not the raw segment: "Hybrid - London"
      // must read as London, not as "Hybrid - London".
      record(hit[0], hit[1], REGION_LEVEL_PHRASES.has(hit[0]));
      continue;
    }

    const region = matchSegment(cleaned);
    if (region) {
      record(cleaned, region, false);
    } else {
      result.unknown.push(cleaned);
    }
  }

  return result;
}

/**
 * Can this person actually work from where they are?
 *
 * Region-level openness qualifies: "Worldwide", "Global", "Africa" and "EMEA"
 * all include Ethiopia. A restriction to a specific place only qualifies if it
 * names one of the candidate's own places — a job open to Kenya is not open to
 * them, however close it looks on a map.
 */
export function parsedAllowsCandidate(
  parsed: ParsedRegions,
  candidatePlaces: string[] = DEFAULT_CANDIDATE_PLACES
): boolean {
  if (parsed.regionLevel.includes("worldwide")) return true;
  if (parsed.regionLevel.includes("africa")) return true;
  return parsed.places.some((place) =>
    candidatePlaces.some(
      (allowed) => place.includes(allowed) || allowed.includes(place)
    )
  );
}

/**
 * Does a region set include somewhere the candidate can work from?
 * Kept for the coarse region-only path.
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

export type Workplace = "remote" | "hybrid" | "onsite" | "unknown";

/**
 * Whether a role is remote, hybrid or on-site.
 *
 * This decides whether a foreign restriction is escapable. A remote role
 * restricted to the US genuinely cannot be taken from abroad — nobody sponsors
 * a visa for a job that must be performed remotely from another country. An
 * on-site role in London can be, because relocation is a thing that happens.
 */
export function detectWorkplace(text: string | null | undefined): Workplace {
  const value = (text ?? "").toLowerCase();
  if (!value.trim()) return "unknown";

  if (/\bhybrid\b/.test(value)) return "hybrid";
  if (/\b(on-?site|onsite|in-?office|in-?person|on site)\b/.test(value)) return "onsite";
  if (/\bremote\b/.test(value)) return "remote";
  return "unknown";
}
