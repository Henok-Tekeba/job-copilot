import type { Job } from "./types";

/**
 * The four numbers that decide what to do next.
 *
 * Computed once at build time for the first paint and once in the browser after
 * the full snapshot loads, so both agree and neither shows a placeholder.
 */
export type JobsSummary = {
  /** Total postings on the board. */
  total: number;
  /** Open to you, or reachable by relocating. */
  reachable: number;
  /** Of those, the internships, contracts and junior roles. */
  entry: number;
  open: number;
  relocation: number;
  /** Highest priority on the board, or null when nothing has been scored. */
  best: number | null;
};

const ENTRY_OPPORTUNITIES = new Set(["internship", "contract", "junior", "program"]);

export function summarizeJobs(jobs: Job[]): JobsSummary {
  let open = 0;
  let relocation = 0;
  let entry = 0;
  let best: number | null = null;

  for (const job of jobs) {
    const verdict = job.evaluation.eligibility?.verdict;
    if (verdict !== "open" && verdict !== "relocation") continue;

    if (verdict === "open") open++;
    else relocation++;

    if (ENTRY_OPPORTUNITIES.has(job.evaluation.opportunity)) entry++;

    const priority = job.evaluation.fit?.priority;
    if (typeof priority === "number" && (best === null || priority > best)) {
      best = priority;
    }
  }

  return {
    total: jobs.length,
    reachable: open + relocation,
    entry,
    open,
    relocation,
    best,
  };
}

/**
 * The default ranking: highest priority first.
 *
 * Shared by the server, which uses it to pick the postings it pre-renders, and
 * by the browser, which uses it to order the full snapshot. Without a single
 * definition the first paint showed one order and the loaded list showed
 * another, which reads as the page jumping.
 */
export function byPriority(a: Job, b: Job): number {
  const aPriority = a.evaluation.fit?.priority ?? a.evaluation.fitScore ?? 0;
  const bPriority = b.evaluation.fit?.priority ?? b.evaluation.fitScore ?? 0;
  return bPriority - aPriority;
}

/** The default filter: anything not explicitly closed. */
export function isReachable(job: Job): boolean {
  return job.evaluation.eligible !== "no";
}
