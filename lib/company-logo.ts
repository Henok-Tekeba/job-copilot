import type { Job } from "@/lib/types";

/**
 * Names/slugs whose real domain is not what a naive `.com` guess produces.
 * Keys are lowercased company names (spaces collapsed).
 */
const OVERRIDES: Record<string, string> = {
  outreach: "outreach.io",
  "anduril industries": "anduril.com",
  anduril: "anduril.com",
  waymo: "waymo.com",
  "google deepmind": "deepmind.google",
  x: "x.com",
  bungie: "bungie.net",
  duolingo: "duolingo.com",
  cloudflare: "cloudflare.com",
  meron: "meron.edu.et",
  mailchimp: "mailchimp.com",
  squarespace: "squarespace.com",
  notion: "notion.com",
  zapier: "zapier.com",
  slack: "slack.com",
  figma: "figma.com",
  canva: "canva.com",
  pinterest: "pinterest.com",
  dropbox: "dropbox.com",
  atlassian: "atlassian.com",
  bloomberg: "bloomberg.com",
  "janestreet": "janestreet.com",
  "two sigma": "twosigma.com",
  citadel: "citadel.com",
  palantir: "palantir.com",
  nvidia: "nvidia.com",
  qualcomm: "qualcomm.com",
  datadog: "datadoghq.com",
  mongodb: "mongodb.com",
  twilio: "twilio.com",
  coinbase: "coinbase.com",
  robinhood: "robinhood.com",
  revolut: "revolut.com",
  klarna: "klarna.com",
  wise: "wise.com",
  monzo: "monzo.com",
  framer: "framer.com",
  vercel: "vercel.com",
  linear: "linear.app",
  github: "github.com",
  gitlab: "gitlab.com",
  spotify: "spotify.com",
  reddit: "reddit.com",
  openai: "openai.com",
  anthropic: "anthropic.com",
  airtable: "airtable.com",
  asana: "asana.com",
  grammarly: "grammarly.com",
  doordash: "doordash.com",
  lyft: "lyft.com",
  instacart: "instacart.com",
  databricks: "databricks.com",
  scaleai: "scale.com",
  "scale ai": "scale.com",
  "m-kopa": "mkopa.com",
  "n-ix": "n-ix.com",
};

/**
 * Feed words that never belong in a domain — the posting's company field is
 * sometimes "Unknown", "Confidential", etc.
 */
const DENYLIST = new Set([
  "unknown",
  "unknowncompany",
  "confidential",
  "stealth",
  "company",
  "remote",
  "nocompany",
  "job",
  "hiring",
]);

/**
 * The company's own domain, best effort:
 * 1. an explicit override for the company name,
 * 2. the `website` field when the posting carries one,
 * 3. the ATS token parsed out of the source URL — the token is the company's
 *    slug on Greenhouse/Lever/Ashby/Workday, and `slug.com` is usually the
 *    company's own site,
 * 4. the company name itself — aggregate feeds list real brand names, and
 *    `brandname.com` (spaces collapsed) is right for most of them.
 * Returns null when nothing trustworthy exists, so the UI can fall back to
 * an initial instead of a wrong icon.
 */
export function companyDomain(job: Job): string | null {
  const nameKey = (job.company || "").trim().toLowerCase().replace(/\s+/g, "");

  if (OVERRIDES[nameKey]) {
    return OVERRIDES[nameKey];
  }

  if (job.website) {
    try {
      return new URL(job.website).hostname;
    } catch {
      // Malformed website string; fall through to the ATS slug.
    }
  }

  const slug = atsCompanySlug(job);
  if (slug && !slug.includes("-") && slug.length >= 3 && !/^(careers|engineering|jobs|product|software|frontend|backend|mobile|platform|company|listing)$/.test(slug)) {
    return `${slug}.com`;
  }

  if (nameKey && nameKey.length >= 3 && !DENYLIST.has(nameKey) && !/[^\w+]/.test(nameKey)) {
    return `${nameKey}.com`;
  }

  return null;
}

/** A real, displayable icon URL for the company — or null. */
export function companyLogoUrl(job: Job): string | null {
  // DuckDuckGo icons 404 on unknown domains, which lets the UI detect a miss
  // and fall back. Google's favicon endpoint returns a generic globe instead.
  const domain = companyDomain(job);
  return domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;
}

function atsCompanySlug(job: Job): string | null {
  const url = job.sourceUrl ?? job.applyUrl;
  if (!url) return null;

  try {
    const { hostname, pathname } = new URL(url);

    // Boards that host the company as a first path segment.
    const atsHosts = ["ashbyhq.com", "greenhouse.io", "lever.co", "simplify.jobs", "boards.greenhouse.io"];
    const atsMatch = atsHosts.find((host) => hostname.endsWith(host));
    if (atsMatch) {
      return pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? null;
    }

    // Workday hosts the company as a subdomain: <company>.wd5.myworkdayjobs.com.
    const workday = hostname.match(/^([a-z0-9]+)\.wd\d+\.myworkdayjobs\.com$/);
    if (workday) {
      return workday[1];
    }
  } catch {
    // Unparseable source URL; treat as unknown.
  }

  return null;
}
