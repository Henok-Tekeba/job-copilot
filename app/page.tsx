import { LandingPage } from "@/components/landing/landing-page";
import { loadJobs } from "@/lib/data";
import type { Job } from "@/lib/types";

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

  const recent = jobs
    .filter(
      (job: Job) =>
        (job.evaluation.opportunity === "internship" ||
          job.evaluation.opportunity === "contract") &&
        job.evaluation.eligibility &&
        job.postedAt,
    )
    .sort(
      (a, b) =>
        Date.parse(b.postedAt ?? "0") - Date.parse(a.postedAt ?? "0"),
    )
    .slice(0, 4);

  return <LandingPage recent={recent} counts={counts} stats={stats} />;
}

