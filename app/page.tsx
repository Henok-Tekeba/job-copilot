import { LandingPage } from "@/components/landing/landing-page";
import type { LandingSample } from "@/components/landing/verdict-inspector";
import { loadJobs } from "@/lib/data";
import { SOURCE_OPTIONS } from "@/lib/jobs";
import { isUnstatedLocation } from "@/lib/regions";
import { summarizeJobs, ENTRY_OPPORTUNITIES } from "@/lib/summary";
import type { EligibilityVerdict, Job } from "@/lib/types";

/**
 * The inspector shows three real postings, one per verdict the board returns.
 * The preferred companies are a nicety, not a requirement: the snapshot turns
 * over every few hours, so every slot falls back to the first clean posting
 * carrying that verdict.
 */
const SAMPLE_PICKS: Array<{ verdict: EligibilityVerdict; preferred: string[] }> = [
  { verdict: "open", preferred: ["Canonical"] },
  { verdict: "relocation", preferred: ["Cloudflare"] },
  { verdict: "region-locked", preferred: ["Airwallex"] },
];

function pickSample(
  jobs: Job[],
  verdict: EligibilityVerdict,
  preferred: string[]
): Job | undefined {
  const candidates = jobs
    .filter((job) => {
      const eligibility = job.evaluation.eligibility;
      return (
        eligibility?.verdict === verdict &&
        eligibility.evidence.length > 0 &&
        !isUnstatedLocation(job.location)
      );
    })
    .sort(
      (a, b) =>
        a.company.localeCompare(b.company) || a.title.localeCompare(b.title)
    );

  const atPreferred = candidates.filter((job) => preferred.includes(job.company));
  const pool = atPreferred.length > 0 ? atPreferred : candidates;

  // Prefer an internship or junior role: the board exists for entry-level.
  return (
    pool.find((job) => ENTRY_OPPORTUNITIES.has(job.evaluation.opportunity)) ??
    pool[0]
  );
}

function toSample(job: Job): LandingSample {
  const eligibility = job.evaluation.eligibility;
  if (!eligibility) throw new Error(`No eligibility on ${job.id}`);

  return {
    id: job.id,
    company: job.company,
    title: job.title,
    location: job.location,
    verdict: eligibility.verdict,
    workplace: eligibility.workplace,
    summary: eligibility.summary,
    evidence: eligibility.evidence.slice(0, 3),
    missing: job.evaluation.fit?.requiredMissing.slice(0, 5) ?? [],
    deadline: job.deadline ?? null,
  };
}

export default function Home() {
  const jobs = loadJobs();

  const samples = SAMPLE_PICKS.flatMap(({ verdict, preferred }) => {
    const job = pickSample(jobs, verdict, preferred);
    return job ? [toSample(job)] : [];
  });

  return (
    <LandingPage
      samples={samples}
      summary={summarizeJobs(jobs)}
      feeds={SOURCE_OPTIONS.filter((source) => source !== "manual").length}
    />
  );
}
