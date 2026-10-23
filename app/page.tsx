import { LandingPage } from "@/components/landing/landing-page";
import { loadJobs } from "@/lib/data";
import { stripHtml } from "@/lib/jobs";
import { isUnstatedLocation } from "@/lib/regions";
import type { Job } from "@/lib/types";

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

  // The wall shows one real posting, caught in the act: a region-locked
  // internship whose own text contains the restriction. The excerpt window
  // is cut so the evidence phrase is inside the visible text.
  let wallSample: WallSample | null = null;
  for (const job of jobs) {
    const eligibility = job.evaluation.eligibility;
    if (
      eligibility?.verdict !== "region-locked" ||
      eligibility.evidence.length === 0
    ) {
      continue;
    }
    const evidence = eligibility.evidence.find(
      (item) => item.value && !isUnstatedLocation(item.value),
    );
    const description = stripHtml(job.description || "");
    if (!evidence || description.length < 160) continue;

    const phrase = evidence.value;
    const at = description.toLowerCase().indexOf(phrase.toLowerCase());
    if (at < 0) continue;

    const from = Math.max(0, at - 90);
    const until = Math.min(description.length, at + phrase.length + 110);
    const window = description.slice(from, until);
    const hit = window.toLowerCase().indexOf(phrase.toLowerCase());
    wallSample = {
      company: job.company,
      title: job.title,
      before: window.slice(0, hit).replace(/^\S+\s/, ""),
      phrase: window.slice(hit, hit + phrase.length),
      after: window.slice(hit + phrase.length),
    };
    break;
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

  return <LandingPage recent={recent} counts={counts} stats={stats} wallSample={wallSample} />;
}

