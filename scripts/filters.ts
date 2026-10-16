/**
 * Collection filters.
 *
 * Ninety-eight company boards will happily hand over ten thousand postings,
 * most of them "Account Executive, EMEA" and "Staff SRE". Storing all of it
 * would mean a jobs.json measured in tens of megabytes and a git history that
 * grows on every run, so the coarse cut happens here and the fine scoring
 * happens later in scripts/evaluate.ts.
 */

import type { NormalizedJob } from "./types";

/** Titles that indicate a role this project can actually help with. */
const TARGET_ROLE_PATTERN =
  /\b(engineer|engineering|developer|software|sde|swe|programmer|devops|sre|site reliability|backend|back-end|frontend|front-end|fullstack|full-stack|full stack|machine learning|mlops|data scientist|data engineer|data analyst|qa|quality assurance|tester|test engineer|mobile|ios|android|api|platform|infrastructure|cloud|security|architect|computer|web developer|technical writer|solutions engineer)\b/i;

/**
 * Titles above the level this project targets. Keeping them out at collection
 * time is what stops the corpus filling with roles that need a decade of
 * experience.
 */
const OUT_OF_SCOPE_SENIORITY_PATTERN =
  /\b(senior|sr\.?|staff|principal|distinguished|director|head of|vp|vice president|chief|cto|cio|manager|lead|expert|fellow)\b/i;

/** Roles older than this are stale for a deadline-driven search. */
export const RETENTION_DAYS = 120;

export function isTargetRole(title: string): boolean {
  if (!title) return false;
  if (!TARGET_ROLE_PATTERN.test(title)) return false;
  // "Senior" never appears in the strings we want; "Engineering Manager" does.
  if (OUT_OF_SCOPE_SENIORITY_PATTERN.test(title)) return false;
  return true;
}

export function isFresh(postedAt: string, days: number = RETENTION_DAYS): boolean {
  if (!postedAt) return true;
  const time = Date.parse(postedAt);
  if (Number.isNaN(time)) return true;
  return Date.now() - time <= days * 86_400_000;
}

export function passesCollectionFilter(job: NormalizedJob): boolean {
  return isTargetRole(job.title) && isFresh(job.postedAt);
}

/**
 * Drop stale postings and, if still over the cap, keep the newest.
 *
 * The cap is a deliberate guard on repository size rather than a product
 * decision: `jobs.json` is committed on every collector run, and a slow
 * unbounded growth curve is worse than a hard, visible ceiling.
 */
export function pruneJobs(
  jobs: NormalizedJob[],
  options: { maxJobs?: number; retentionDays?: number } = {}
): { kept: NormalizedJob[]; droppedStale: number; droppedOverCap: number } {
  const { maxJobs = 4000, retentionDays = RETENTION_DAYS } = options;

  const fresh = jobs.filter((job) => isFresh(job.postedAt, retentionDays));
  const droppedStale = jobs.length - fresh.length;

  if (fresh.length <= maxJobs) {
    return { kept: fresh, droppedStale, droppedOverCap: 0 };
  }

  const sorted = [...fresh].sort(
    (a, b) => Date.parse(b.postedAt || "1970-01-01") - Date.parse(a.postedAt || "1970-01-01")
  );
  const kept = sorted.slice(0, maxJobs);

  // Sort back to a stable order so the diff between runs stays readable.
  kept.sort((a, b) => a.id.localeCompare(b.id));

  return { kept, droppedStale, droppedOverCap: fresh.length - kept.length };
}
