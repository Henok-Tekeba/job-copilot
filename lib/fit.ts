/**
 * Fit scoring.
 *
 * The old score was `matched / detected`, which had two problems: a job asking
 * for 3 skills scored the same as one asking for 30, and a role you can never
 * take outranked one you can. Here the score is skill-only and honest, and a
 * separate `priority` folds in seniority and eligibility for sorting.
 */

import type { Level, Opportunity } from "./types";
import type { EligibilityVerdict } from "./eligibility";

export type FitBreakdown = {
  /** Skill fit, 0-100, or null when there is nothing to measure against. */
  score: number | null;
  /** score adjusted for seniority and eligibility; used for default sorting. */
  priority: number;
  /** Fraction of required skills covered, 0-1. */
  coverage: number;
  requiredMatched: string[];
  requiredMissing: string[];
  niceMatched: string[];
  niceMissing: string[];
  levelWeight: number;
  eligibilityWeight: number;
  /** Whether the score was measured against requirements or all detected skills. */
  basis: "required" | "detected";
  /** Short human-readable reasons, for the UI. */
  reasons: string[];
};

const LEVEL_WEIGHTS: Record<Level, number> = {
  intern: 1,
  junior: 1,
  mid: 0.92,
  senior: 0.75,
};

const ELIGIBILITY_WEIGHTS: Record<EligibilityVerdict, number> = {
  open: 1,
  unknown: 0.85,
  conflict: 0.7,
  "region-locked": 0.4,
};

export function computeFit(input: {
  requiredSkills: string[];
  niceSkills: string[];
  detectedSkills: string[];
  knownSkills: Set<string>;
  level: Level;
  verdict: EligibilityVerdict;
  sectionsDetected: boolean;
}): FitBreakdown {
  const {
    requiredSkills,
    niceSkills,
    detectedSkills,
    knownSkills,
    level,
    verdict,
    sectionsDetected,
  } = input;

  const requiredMatched = requiredSkills.filter((s) => knownSkills.has(s));
  const requiredMissing = requiredSkills.filter((s) => !knownSkills.has(s));
  const niceMatched = niceSkills.filter((s) => knownSkills.has(s));
  const niceMissing = niceSkills.filter((s) => !knownSkills.has(s));

  // Prefer measuring against stated requirements. Fall back to every detected
  // skill when the posting had no requirement sections at all.
  const useRequired = sectionsDetected && requiredSkills.length > 0;
  const basis: FitBreakdown["basis"] = useRequired ? "required" : "detected";

  const denominator = useRequired ? requiredSkills.length : detectedSkills.length;
  const numerator = useRequired
    ? requiredMatched.length
    : detectedSkills.filter((s) => knownSkills.has(s)).length;

  const coverage = denominator > 0 ? numerator / denominator : 0;
  const score = denominator > 0 ? Math.round(coverage * 100) : null;

  const levelWeight = LEVEL_WEIGHTS[level];
  const eligibilityWeight = ELIGIBILITY_WEIGHTS[verdict];

  const priority =
    score === null
      ? 0
      : Math.round(score * levelWeight * eligibilityWeight);

  const reasons: string[] = [];
  if (useRequired) {
    reasons.push(
      `${requiredMatched.length} of ${requiredSkills.length} required skills`
    );
  } else if (denominator > 0) {
    reasons.push(
      `${numerator} of ${detectedSkills.length} detected skills`
    );
  } else {
    reasons.push("no skills detected in posting");
  }
  if (niceMissing.length > 0) {
    reasons.push(`${niceMissing.length} nice-to-have gap${niceMissing.length === 1 ? "" : "s"}`);
  }
  if (levelWeight < 1) reasons.push(`${level} role`);
  if (eligibilityWeight < 1) reasons.push("eligibility reduces priority");

  return {
    score,
    priority,
    coverage,
    requiredMatched,
    requiredMissing,
    niceMatched,
    niceMissing,
    levelWeight,
    eligibilityWeight,
    basis,
    reasons,
  };
}

/** Median of a list, or null when empty. Used for pay-weighted skill ROI. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

/** Opportunity types that are actually reachable for an early-career candidate. */
export const ENTRY_OPPORTUNITIES: Opportunity[] = [
  "internship",
  "program",
  "contract",
  "junior",
];
