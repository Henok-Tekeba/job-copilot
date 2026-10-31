import { LandingPage } from "@/components/landing/landing-page";
import { loadJobs } from "@/lib/data";
import { byPriority, isReachable } from "@/lib/summary";

export type WallSample = {
  company: string;
  title: string;
  before: string;
  phrase: string;
  after: string;
};

export type LandingStats = {
  total: number;
  open: number;
  relocation: number;
  regionLocked: number;
  unclear: number;
  sponsorshipOffered: number;
  sponsorshipDenied: number;
  sponsorshipSilent: number;
};

/** A posting lean enough to render on the landing without shipping a body. */
export type LandingRole = {
  id: string;
  title: string;
  company: string;
  location: string;
  verdict: string;
  priority: number | null;
};

/**
 * Every number on the landing page is computed from the live snapshot at
 * build time — the method page's rule: hardcoded accuracy is forbidden. The
 * stats tell the discrimination story the engine reads out of posting text:
 * region locks, sponsorship silence, and the few that are actually open.
 */
export default function Home() {
  const jobs = loadJobs();

  const counts = { open: 0, relocation: 0, regionLocked: 0, unclear: 0 };
  let sponsorshipOffered = 0;
  let sponsorshipDenied = 0;
  let sponsorshipSilent = 0;

  for (const job of jobs) {
    const verdict = job.evaluation.eligibility?.verdict;
    if (verdict === "open") counts.open++;
    else if (verdict === "relocation") counts.relocation++;
    else if (verdict === "region-locked") counts.regionLocked++;
    else if (verdict === "conflict" || verdict === "unknown") counts.unclear++;

    const sponsorship = job.evaluation.eligibility?.sponsorship?.verdict;
    if (sponsorship === "offered") sponsorshipOffered++;
    else if (sponsorship === "not-offered") sponsorshipDenied++;
    else sponsorshipSilent++;
  }

  const stats: LandingStats = {
    total: jobs.length,
    ...counts,
    sponsorshipOffered,
    sponsorshipDenied,
    sponsorshipSilent,
  };

  // A small, diverse preview: one openly reachable role, then the best
  // relocation roles, one per company. Bodies stay on the board.
  const pool = jobs
    .filter((job) => {
      const verdict = job.evaluation.eligibility?.verdict;
      return (
        (job.evaluation.opportunity === "internship" ||
          job.evaluation.opportunity === "contract") &&
        job.relevance === "software" &&
        (verdict === "open" || verdict === "relocation") &&
        isReachable(job)
      );
    })
    .sort(byPriority);

  const seenCompanies = new Set<string>();
  const featured: LandingRole[] = [];

  const addRole = (job: (typeof pool)[number]) => {
    const company = job.company.trim();
    if (!company || seenCompanies.has(company.toLowerCase())) return;
    seenCompanies.add(company.toLowerCase());
    featured.push({
      id: job.id,
      title: job.title,
      company,
      location: job.location || "Location not stated",
      verdict: job.evaluation.eligibility?.verdict ?? "unknown",
      priority:
        job.evaluation.fit?.priority ??
        (job.evaluation.fitScore !== null
          ? Math.round(job.evaluation.fitScore)
          : null),
    });
  };

  // One "open to you" role keeps the preview from reading as all relocation.
  const openRole = pool.find(
    (job) => job.evaluation.eligibility?.verdict === "open",
  );
  if (openRole) addRole(openRole);

  for (const job of pool) {
    if (featured.length === 4) break;
    addRole(job);
  }

  return <LandingPage stats={stats} featured={featured} />;
}

