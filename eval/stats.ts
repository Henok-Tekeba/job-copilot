/**
 * Statistics helpers for the eval runner.
 *
 * Every metric reported anywhere carries a 95% Wilson confidence interval and
 * the n behind it. Wilson is used instead of the naive p ± 1.96·sqrt(p(1-p)/n)
 * because it behaves well at small n and at proportions near 0 or 1 — exactly
 * the case for the rare stances.
 *
 * Used by eval/run.ts (Phase 2). Natural-set and stratified-set metrics are
 * computed separately, never pooled.
 */

const Z_95 = 1.96;

export type Interval = {
  /** Point estimate, k / n. Null when n is 0. */
  p: number | null;
  low: number | null;
  high: number | null;
  /** The sample size behind the estimate. Always reported, even when null. */
  n: number;
};

export function wilson95(successes: number, n: number): Interval {
  if (n <= 0) {
    return { p: null, low: null, high: null, n };
  }
  const p = successes / n;
  const denom = 1 + Z_95 ** 2 / n;
  const center = (p + (Z_95 ** 2) / (2 * n)) / denom;
  const spread = (Z_95 * Math.sqrt((p * (1 - p)) / n + (Z_95 ** 2) / (4 * n * n))) / denom;
  return {
    p,
    low: Math.max(0, center - spread),
    high: Math.min(1, center + spread),
    n,
  };
}

/**
 * Precision with its interval: of everything the engine called X, how often
 * was it right. Returns the null interval when the engine never called X.
 */
export function precision(truePositives: number, falsePositives: number): Interval {
  return wilson95(truePositives, truePositives + falsePositives);
}

/**
 * Recall with its interval: of all real X, how many the engine found.
 * Returns the null interval when there is no real X in the set.
 */
export function recall(truePositives: number, falseNegatives: number): Interval {
  return wilson95(truePositives, truePositives + falseNegatives);
}
