/**
 * ATS adapters: Greenhouse, Lever and Ashby.
 *
 * These are the companies' own job boards, not aggregators, so the data is
 * first-hand: no reselling, no stale copies, and the structured fields
 * (Ashby's employmentType, Lever's workplaceType and country) are intact.
 *
 * All three are public and unauthenticated, which is why discovery could verify
 * them and why collection is not scraping.
 */

import type { Company } from "../companies";
import type { NormalizedJob } from "../types";

const USER_AGENT = "job-copilot-collector/1.0";
const DESCRIPTION_LIMIT = 8_000;

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    // Ampersand last, so we do not double-decode an escaped entity.
    .replace(/&amp;/g, "&");
}

function clamp(text: string | undefined | null): string {
  if (!text) return "";
  return text.length > DESCRIPTION_LIMIT
    ? `${text.slice(0, DESCRIPTION_LIMIT)}\n[truncated]`
    : text;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Bounded concurrency, so we do not hammer a hundred job boards at once. */
async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;

  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results.push(await worker(items[index]!));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  return results;
}

// --- Greenhouse -----------------------------------------------------------

type GreenhouseJob = {
  id: number;
  title: string;
  updated_at: string;
  first_published?: string;
  absolute_url: string;
  company_name?: string;
  location?: { name?: string };
  offices?: Array<{ name?: string }>;
  departments?: Array<{ name?: string }>;
  metadata?: Array<{ name?: string; value?: unknown }> | null;
  content?: string;
  application_deadline?: string | null;
};

export async function fetchGreenhouse(
  companies: Company[]
): Promise<NormalizedJob[]> {
  const now = new Date().toISOString();

  const batches = await pool(companies, 5, async (company) => {
    const data = await getJson<{ jobs?: GreenhouseJob[] }>(
      `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs?content=true`
    );
    if (!data?.jobs) return [];

    return data.jobs.map((job): NormalizedJob => ({
      id: `greenhouse:${company.token}:${job.id}`,
      source: "greenhouse" as const,
      sourceUrl: job.absolute_url,
      applyUrl: job.absolute_url,
      attribution: `via ${company.name} careers`,
      title: job.title,
      company: job.company_name || company.name,
      // Greenhouse has no structured region field; its location string is the
      // signal we get, and the parser reads region names out of it.
      location: job.location?.name ?? "",
      tags: [
        ...(job.departments ?? []).map((d) => d.name ?? ""),
        ...(job.offices ?? []).map((o) => o.name ?? ""),
      ].filter(Boolean),
      description: clamp(job.content ? decodeEntities(job.content) : ""),
      postedAt: job.first_published || job.updated_at,
      firstSeen: now,
      employmentType: undefined,
    }));
  });

  return batches.flat();
}

// --- Ashby ----------------------------------------------------------------

type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  secondaryLocations?: Array<{ location?: string }>;
  department?: string;
  team?: string;
  isRemote?: boolean;
  workplaceType?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  publishedAt?: string;
  employmentType?: string;
  isListed?: boolean;
  jobUrl?: string;
  applyUrl?: string;
};

export async function fetchAshby(companies: Company[]): Promise<NormalizedJob[]> {
  const now = new Date().toISOString();

  const batches = await pool(companies, 5, async (company) => {
    const data = await getJson<{ jobs?: AshbyJob[] }>(
      `https://api.ashbyhq.com/posting-api/job-board/${company.token}`
    );
    if (!data?.jobs) return [];

    return data.jobs
      .filter((job) => job.isListed !== false)
      .map((job): NormalizedJob => {
        const locations = [
          job.location,
          ...(job.secondaryLocations ?? []).map((l) => l.location),
        ].filter((l): l is string => Boolean(l));

        return {
          id: `ashby:${company.token}:${job.id}`,
          source: "ashby" as const,
          sourceUrl: job.jobUrl ?? job.applyUrl ?? "",
          applyUrl: job.applyUrl ?? job.jobUrl,
          attribution: `via ${company.name} careers`,
          title: job.title,
          company: company.name,
          location: locations.join(", "),
          tags: [job.department, job.team, job.workplaceType].filter(
            (t): t is string => Boolean(t)
          ),
          // The structured employment type is the most reliable opportunity
          // signal available anywhere in this pipeline.
          jobType: job.employmentType,
          employmentType: job.employmentType,
          description: clamp(job.descriptionPlain || job.descriptionHtml || ""),
          postedAt: job.publishedAt ?? now,
          firstSeen: now,
        };
      });
  });

  return batches.flat();
}

// --- Lever ----------------------------------------------------------------

type LeverPosting = {
  id: string;
  text: string;
  createdAt?: number;
  hostedUrl?: string;
  applyUrl?: string;
  workplaceType?: string;
  country?: string;
  descriptionPlain?: string;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  salaryRange?: { min?: number; max?: number; currency?: string } | null;
};

function formatLeverSalary(posting: LeverPosting): string | undefined {
  const range = posting.salaryRange;
  if (!range?.min && !range?.max) return undefined;
  const currency = range.currency ?? "USD";
  const fmt = (n: number) => `${Math.round(n / 1000)}k`;
  if (range.min && range.max) return `${fmt(range.min)}-${fmt(range.max)} ${currency}`;
  return `${fmt(range.min ?? range.max!)} ${currency}`;
}

export async function fetchLever(companies: Company[]): Promise<NormalizedJob[]> {
  const now = new Date().toISOString();

  const batches = await pool(companies, 5, async (company) => {
    const postings = await getJson<LeverPosting[]>(
      `https://api.lever.co/v0/postings/${company.token}?mode=json`
    );
    if (!Array.isArray(postings)) return [];

    return postings.map((posting): NormalizedJob => {
      const locations = [
        ...(posting.categories?.allLocations ?? []),
        posting.categories?.location,
      ].filter((l): l is string => Boolean(l));

      return {
        id: `lever:${company.token}:${posting.id}`,
        source: "lever" as const,
        sourceUrl: posting.hostedUrl ?? "",
        applyUrl: posting.applyUrl ?? posting.hostedUrl,
        attribution: `via ${company.name} careers`,
        title: posting.text,
        company: company.name,
        location: [...new Set(locations)].join(", "),
        tags: [posting.categories?.department, posting.categories?.team].filter(
          (t): t is string => Boolean(t)
        ),
        jobType: posting.categories?.commitment,
        employmentType: posting.workplaceType,
        salary: formatLeverSalary(posting),
        description: clamp(posting.descriptionPlain ?? ""),
        postedAt: posting.createdAt
          ? new Date(posting.createdAt).toISOString()
          : now,
        firstSeen: now,
      };
    });
  });

  return batches.flat();
}
