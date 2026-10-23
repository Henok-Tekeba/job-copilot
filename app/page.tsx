import { LandingPage } from "@/components/landing/landing-page";
import { loadJobs } from "@/lib/data";
import type { Job } from "@/lib/types";

/**
 * The landing is drawn from the same snapshot as the board: the headline
 * posting total, per-verdict counts for the category rail, and the most
 * recent postings for the horizontal rail. Nothing is serialized beyond what
 * the four latest cards render.
 */
export default function Home() {
  const jobs = loadJobs();

  const counts = { open: 0, relocation: 0, regionLocked: 0, unclear: 0 };
  for (const job of jobs) {
    const verdict = job.evaluation.eligibility?.verdict;
    if (verdict === "open") counts.open++;
    else if (verdict === "relocation") counts.relocation++;
    else if (verdict === "region-locked") counts.regionLocked++;
    else if (verdict === "conflict" || verdict === "unknown") counts.unclear++;
  }

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

  return <LandingPage recent={recent} counts={counts} />;
}
