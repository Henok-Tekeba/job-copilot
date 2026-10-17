/**
 * Eligibility assessment.
 *
 * The question is not "can I work from Ethiopia". It is "will this employer take
 * an international applicant". Those are different, and conflating them hid the
 * roles that matter: an on-site internship in London is not closed, it is a
 * relocation, and people from here get those offers.
 *
 * Signal priority: structured region field > free-text location > body prose.
 * Every verdict carries the evidence it came from.
 */

import {
  REGION_LABELS,
  bandOverlapsAfrica,
  detectTimezoneBand,
  detectWorkplace,
  isUnstatedLocation,
  parseRegions,
  parsedAllowsCandidate,
  type Region,
  type TimezoneBand,
  type Workplace,
} from "./regions";
import {
  assessSponsorship,
  type SponsorshipAssessment,
} from "./sponsorship";

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
    return places.map((place) => PLACE_LABELS[place] ?? titleize(place)).join(", ");
  }
  return "an unnamed region";
}

export type EligibilityVerdict =
  /** Can work from where they are: worldwide remote, Africa, or their own country. */
  | "open"
  /** Requires relocating abroad, and the employer has not ruled out sponsoring. */
  | "relocation"
  /** Remote but tied to another country, or sponsorship explicitly refused. */
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
  /** True when the candidate can act on this without needing a visa first. */
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
  workplace: Workplace;
  sponsorship: SponsorshipAssessment;
  /** Set when a hard authorisation requirement was found. */
  blockedBy: string | null;
  /** One-sentence, human-readable explanation. Shown in the UI. */
  summary: string;
};

export type EligibilityInput = {
  /** Structured region field from the feed, when the feed has one. */
  requiredLocation?: string | null;
  /** Human-readable location string. */
  location?: string | null;
  /** Posting body, ideally HTML-stripped. */
  description?: string | null;
  /** Feed-provided sponsorship value, when the feed publishes a real one. */
  sponsorshipHint?: string | null;
};

/**
 * Assess whether an international candidate can take this role.
 *
 * Verdicts:
 *  - `open`          workable from where they are (worldwide remote, Africa, home)
 *  - `relocation`    on-site/hybrid abroad, sponsorship not ruled out → apply
 *  - `region-locked` remote but tied to another country, or sponsorship refused
 *  - `conflict`      the feed and the posting body disagree
 *  - `unknown`       no usable signal
 */
export function assessEligibility(input: EligibilityInput): Eligibility {
  // Placeholder locations ("na", "N/A") say nothing. Left in, they became the
  // verdict and the summary for jobs that simply did not state a location.
  const structured = isUnstatedLocation(input.requiredLocation)
    ? ""
    : (input.requiredLocation ?? "").trim();
  const locationText = isUnstatedLocation(input.location)
    ? ""
    : (input.location ?? "").trim();
  const body = (input.description ?? "").trim();
  const haystack = `${body} ${locationText} ${structured}`;

  const evidence: EligibilityEvidence[] = [];
  const primary = structured || locationText;
  const primaryField = structured ? "candidate_required_location" : "location";

  const parsed = parseRegions(primary);
  if (primary) {
    evidence.push({ field: primaryField, value: primary });
  }

  const workplaceDetected = detectWorkplace(`${primary} ${body}`);

  /**
   * A list of broad regions ("Northern America, LATAM, Europe, APAC") is a
   * statement about where you may work remotely, not an office address. Treat
   * it as remote so such roles are recognised as closed rather than as
   * relocations nobody would ever be moved for.
   */
  const regionListOnly =
    parsed.regionPhrases.length > 0 && parsed.places.length === 0;
  const workplace: Workplace =
    workplaceDetected !== "unknown"
      ? workplaceDetected
      : regionListOnly
        ? "remote"
        : "unknown";

  const sponsorship = assessSponsorship(haystack, input.sponsorshipHint);

  const timezoneBand = detectTimezoneBand(`${primary} ${body}`);
  const timezone = {
    band: timezoneBand,
    required:
      timezoneBand === null
        ? null
        : (primary.match(
            /[^,;|]*\b(pst|pdt|est|edt|cst|cdt|mst|cet|cest|gmt|utc|bst|jst|kst|ist|aest|emea)\b[^,;|]*/i
          )?.[0]?.trim() ??
          (timezoneBand === "americas" ? "Americas timezones" : null)),
    overlapsAfrica: bandOverlapsAfrica(timezoneBand),
  };

  const base = (
    verdict: EligibilityVerdict,
    reachable: boolean,
    summary: string,
    blockedBy: string | null = null
  ): Eligibility => ({
    verdict,
    africaOpen: reachable,
    regions: parsed.regions,
    regionLabels: parsed.regions.map((r) => REGION_LABELS[r]),
    evidence,
    unknownSegments: parsed.unknown,
    timezone,
    workplace,
    sponsorship,
    blockedBy,
    summary,
  });

  // No region we could understand.
  if (parsed.regions.length === 0) {
    // An authorisation demand is decisive even when the location is not stated:
    // "must be authorized to work in the US" rules the role out on its own.
    if (sponsorship.verdict === "not-offered") {
      return base(
        "region-locked",
        false,
        sponsorship.signals[0] ?? "Sponsorship not offered.",
        sponsorship.signals[0] ?? null
      );
    }
    if (parsed.unknown.length > 0) {
      return base(
        "unknown",
        false,
        `Couldn't place "${primary}" — check the posting.`
      );
    }
    if (parsed.bare || (!primary && /remote/i.test(body))) {
      return base(
        "unknown",
        false,
        primary ? `"${primary}" names no region.` : "Remote with no region stated."
      );
    }
    return base("unknown", false, "No location information.");
  }

  const label = describeRestriction(parsed.regionPhrases, parsed.places, parsed.regions);
  const workableFromHome = parsedAllowsCandidate(parsed);

  // Worldwide remote, an Africa-wide region, or the candidate's own country.
  if (workableFromHome) {
    if (sponsorship.verdict === "not-offered") {
      return base(
        "conflict",
        false,
        `Open to ${label}, but the posting states: ${sponsorship.signals[0]}.`,
        sponsorship.signals[0] ?? null
      );
    }
    return base("open", true, `Open to ${label}.`);
  }

  // Restricted to somewhere else.
  if (sponsorship.verdict === "not-offered") {
    return base(
      "region-locked",
      false,
      `Restricted to ${label} — ${sponsorship.signals[0] ?? "no sponsorship"}.`,
      sponsorship.signals[0] ?? null
    );
  }

  // A remote role tied to another country cannot be sponsored into: nobody
  // sponsors a visa for work that must be performed remotely from elsewhere.
  if (workplace === "remote") {
    return base(
      "region-locked",
      false,
      `Remote but restricted to ${label} — you must already be based there.`
    );
  }

  // On-site or hybrid abroad. Relocation is a real path, and most internships
  // simply do not mention sponsorship either way.
  const where =
    workplace === "onsite"
      ? `On-site in ${label}`
      : workplace === "hybrid"
        ? `Hybrid in ${label}`
        : `Based in ${label}`;

  if (sponsorship.verdict === "offered") {
    return base("relocation", true, `${where}. Sponsorship offered.`);
  }

  return base(
    "relocation",
    true,
    `${where}. Sponsorship not stated — check the posting.`
  );
}

/**
 * Map the rich verdict onto the coarse tri-state the UI already speaks.
 * `relocation` counts as reachable, because that is the whole point.
 */
export function verdictToEligible(
  verdict: EligibilityVerdict
): "yes" | "no" | "unclear" {
  switch (verdict) {
    case "open":
    case "relocation":
      return "yes";
    case "region-locked":
      return "no";
    case "conflict":
    case "unknown":
      return "unclear";
  }
}
