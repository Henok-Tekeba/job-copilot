/**
 * Eligibility assessment.
 *
 * Replaces the old "scan the location string for country names" heuristic.
 * The principle here is: structured fields beat prose, and every verdict must
 * carry the evidence it came from. A verdict with no evidence is "unknown",
 * never a guess.
 */

import {
  REGION_LABELS,
  bandOverlapsAfrica,
  detectTimezoneBand,
  parseRegions,
  parsedAllowsCandidate,
  type Region,
  type TimezoneBand,
} from "./regions";

/** Nicer display for the place phrases that show up most often. */
const PLACE_LABELS: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  uk: "United Kingdom",
};

function titleize(value: string): string {
  return value
    .split(/\s+/)
    .map((word) =>
      word.length <= 2 ? word.toUpperCase() : word[0]!.toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function describeRestriction(
  regionPhrases: string[],
  places: string[],
  regions: Region[]
): string {
  if (regionPhrases.length > 0) {
    return regions.map((r) => REGION_LABELS[r]).join(", ");
  }
  if (places.length > 0) {
    return places
      .map((place) => PLACE_LABELS[place] ?? titleize(place))
      .join(", ");
  }
  return "an unnamed region";
}

export type EligibilityVerdict =
  /** Structured signal explicitly includes Africa or is worldwide. */
  | "open"
  /** A region list is stated and Africa is not in it. */
  | "region-locked"
  /** The feed says one thing and the posting body says another. */
  | "conflict"
  /** No usable signal either way. */
  | "unknown";

export type EligibilityEvidence = {
  /** Which field the signal came from, e.g. `candidate_required_location`. */
  field: string;
  value: string;
};

export type Eligibility = {
  verdict: EligibilityVerdict;
  africaOpen: boolean;
  regions: Region[];
  regionLabels: string[];
  evidence: EligibilityEvidence[];
  /** Region segments we could not map; non-empty means ambiguous. */
  unknownSegments: string[];
  timezone: {
    band: TimezoneBand;
    required: string | null;
    overlapsAfrica: boolean | null;
  };
  /** Set when a hard work-authorisation requirement was found. */
  blockedBy: string | null;
  /** One-sentence, human-readable explanation. Shown in the UI. */
  summary: string;
};

/**
 * Hard requirements that lock a role out regardless of where it says it is
 * remote. These are explicit statements, not inferences.
 */
const HARD_BLOCKERS: Array<[RegExp, string]> = [
  [/\bus citizen(ship)?\b/i, "US citizenship required"],
  [/\bu\.?s\.? citizen(ship)?\b/i, "US citizenship required"],
  [/\bsecurity clearance\b/i, "Security clearance required"],
  [
    /\bmust be (legally )?authorized to work in the (us|u\.s\.|united states)\b/i,
    "US work authorization required",
  ],
  [
    /\b(us|u\.s\.|united states) work authorization\b/i,
    "US work authorization required",
  ],
  [
    /\bmust (be based|reside|live|located) in the (us|u\.s\.|united states)\b/i,
    "Must reside in the United States",
  ],
  [
    /\bonly (considering|accepting) (candidates|applicants) (based )?in the (us|u\.s\.|united states)\b/i,
    "US-based applicants only",
  ],
  [/\bus[- ]based (candidates|applicants|only)\b/i, "US-based applicants only"],
];

function findBlocker(text: string): string | null {
  for (const [pattern, label] of HARD_BLOCKERS) {
    if (pattern.test(text)) return label;
  }
  return null;
}

export type EligibilityInput = {
  /** Structured region field from the feed, when the feed has one. */
  requiredLocation?: string | null;
  /** Human-readable location string. */
  location?: string | null;
  /** Posting body, ideally HTML-stripped. */
  description?: string | null;
};

/**
 * Assess whether someone based in Africa can take this role.
 *
 * Signal priority: structured region field > free-text location > body prose.
 */
export function assessEligibility(input: EligibilityInput): Eligibility {
  const structured = (input.requiredLocation ?? "").trim();
  const locationText = (input.location ?? "").trim();
  const body = (input.description ?? "").trim();

  const evidence: EligibilityEvidence[] = [];
  const blocker = findBlocker(`${body} ${locationText}`);

  // Prefer the structured field; fall back to the free-text location.
  const primary = structured || locationText;
  const primaryField = structured
    ? "candidate_required_location"
    : "location";

  const parsed = parseRegions(primary);
  if (primary) {
    evidence.push({ field: primaryField, value: primary });
  }

  const timezoneBand = detectTimezoneBand(`${primary} ${body}`);
  const timezone = {
    band: timezoneBand,
    required:
      timezoneBand === null
        ? null
        : primary.match(/[^,;|]*\b(pst|pdt|est|edt|cst|cdt|mst|cet|cest|gmt|utc|bst|jst|kst|ist|aest|emea)\b[^,;|]*/i)?.[0]?.trim() ??
          (timezoneBand === "americas" ? "Americas timezones" : null),
    overlapsAfrica: bandOverlapsAfrica(timezoneBand),
  };

  const base = (
    verdict: EligibilityVerdict,
    africaOpen: boolean,
    summary: string
  ): Eligibility => ({
    verdict,
    africaOpen,
    regions: parsed.regions,
    regionLabels: parsed.regions.map((r) => REGION_LABELS[r]),
    evidence,
    unknownSegments: parsed.unknown,
    timezone,
    blockedBy: blocker,
    summary,
  });

  // The feed lists real regions and we understood them.
  if (parsed.regions.length > 0) {
    const reachable = parsedAllowsCandidate(parsed);
    const label = describeRestriction(
      parsed.regionPhrases,
      parsed.places,
      parsed.regions
    );

    if (blocker && reachable) {
      return base(
        "conflict",
        false,
        `Feed lists "${label}", but the posting states: ${blocker}.`
      );
    }
    if (reachable) {
      return base("open", true, `Open to ${label}.`);
    }
    // A restriction to specific places reads differently from one to a whole
    // region, so say which it was.
    const reason =
      parsed.regionPhrases.length > 0
        ? `Restricted to ${label} — Africa is not listed.`
        : `Restricted to ${label} — not open from Ethiopia.`;
    return base("region-locked", false, reason);
  }

  // A structured string we could not fully map.
  if (parsed.unknown.length > 0) {
    if (blocker) {
      return base("region-locked", false, blocker);
    }
    return base(
      "unknown",
      false,
      `Unrecognised region: "${parsed.unknown.join(", ")}".`
    );
  }

  // Only "Remote" with no region at all.
  if (parsed.bare || (!primary && /remote/i.test(body))) {
    if (blocker) {
      return base("region-locked", false, blocker);
    }
    return base(
      "unknown",
      false,
      primary
        ? `"${primary}" names no region.`
        : "Remote with no region stated."
    );
  }

  if (blocker) {
    return base("region-locked", false, blocker);
  }

  return base("unknown", false, "No location information.");
}

/**
 * Map the rich verdict onto the coarse tri-state the UI already speaks.
 */
export function verdictToEligible(
  verdict: EligibilityVerdict
): "yes" | "no" | "unclear" {
  switch (verdict) {
    case "open":
      return "yes";
    case "region-locked":
      return "no";
    case "conflict":
    case "unknown":
      return "unclear";
  }
}
