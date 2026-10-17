import type { NormalizedJob } from "../types";

/**
 * Simplify's internship tracker.
 *
 * A GitHub-hosted JSON catalogue, updated daily, of software/data/quant
 * internships. It is the broadest source of "what internships exist right now"
 * available without an API key, and its `terms` field gives the season.
 *
 * What it does NOT have: posting bodies, deadlines, or usable sponsorship data
 * (4,795 of 4,816 active listings are literally "Other"). So this source
 * contributes breadth and season timing, and the description is built only from
 * the listing's own fields rather than invented.
 */

const LISTINGS_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json";
const ATTRIBUTION = "via Simplify";

/** Non-technical categories are dropped at the door. */
const TECH_CATEGORIES = new Set([
  "Software",
  "Software Engineering",
  "AI/ML/Data",
  "Quant",
  "Hardware",
]);

type Listing = {
  id: string;
  company_name: string;
  title: string;
  category?: string;
  url: string;
  locations?: string[];
  terms?: string[];
  degrees?: string[];
  sponsorship?: string;
  active?: boolean;
  is_visible?: boolean;
  date_posted?: number;
};

type SimplifyResponse = Listing[];

function toIso(unixSeconds: number | undefined): string {
  if (!unixSeconds) return new Date().toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

export async function fetchSimplify(): Promise<NormalizedJob[]> {
  const res = await fetch(LISTINGS_URL, {
    headers: { "User-Agent": "job-copilot-collector/1.0" },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Simplify fetch failed: ${res.status} ${res.statusText}`);
  }

  const listings = (await res.json()) as SimplifyResponse;
  if (!Array.isArray(listings)) {
    throw new Error("Simplify: unexpected response shape");
  }

  const now = new Date().toISOString();

  return listings
    .filter((l) => l.active && l.is_visible)
    .filter((l) => !l.category || TECH_CATEGORIES.has(l.category))
    .map((listing): NormalizedJob => {
      const locations = listing.locations ?? [];
      const terms = listing.terms ?? [];
      const degrees = listing.degrees ?? [];

      // Built only from fields the listing actually provides. Nothing invented,
      // and no fake skills for the detector to latch onto.
      const description = [
        `${listing.category ?? "Software"} internship.`,
        terms.length ? `Term: ${terms.join(", ")}.` : "",
        degrees.length ? `Degree: ${degrees.join(", ")}.` : "",
        locations.length ? `Location: ${locations.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: `simplify:${listing.id}`,
        source: "simplify" as const,
        sourceUrl: listing.url,
        applyUrl: listing.url,
        attribution: ATTRIBUTION,
        title: listing.title,
        company: listing.company_name,
        location: locations.join(", "),
        requiredLocation: locations.join(", "),
        tags: [listing.category, ...terms, ...degrees].filter(
          (t): t is string => Boolean(t)
        ),
        jobType: "Internship",
        employmentType: "Intern",
        // Only real signals, and "Other" carries none.
        sponsorshipHint:
          listing.sponsorship && listing.sponsorship !== "Other"
            ? listing.sponsorship
            : undefined,
        description,
        postedAt: toIso(listing.date_posted),
        firstSeen: now,
      };
    });
}
