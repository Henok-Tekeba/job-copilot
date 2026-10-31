import { Suspense } from "react";
import type { Metadata } from "next";

import JobsPage from "@/components/jobs/jobs-page";
import { loadJobs } from "@/lib/data";
import { byPriority, isReachable } from "@/lib/summary";

/**
 * How many postings to render into the HTML.
 *
 * The list fetches the full snapshot from `/jobs.json` at runtime: serialising
 * all four thousand postings into props made `index.html` 17 MB. But rendering
 * *nothing* server-side left the first paint as a screen of skeletons and three
 * zeros, which is what a phone actually saw.
 *
 * So: pre-render exactly one page of real postings plus the headline numbers,
 * and let the fetch replace them a moment later.
 */
const PRERENDER_COUNT = 24;

export const metadata: Metadata = {
  title: "Internships — Shortlist",
  description:
    "Tech internships and contracts, read for eligibility, fit, and deadlines.",
};

export default function Jobs() {
  const jobs = loadJobs();

  // Pre-render the postings the default view would actually show, in the order
  // it would show them, so the first paint does not reshuffle after loading.
  const firstPage = jobs
    .filter((job) => job.evaluation.opportunity === "internship" || job.evaluation.opportunity === "contract")
    .filter(isReachable)
    .sort(byPriority)
    .slice(0, PRERENDER_COUNT);

  return (
    <Suspense fallback={null}>
      <JobsPage initialJobs={firstPage} />
    </Suspense>
  );
}
