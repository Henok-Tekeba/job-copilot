/**
 * Combined verdict (Phase 4).
 *
 * Combines the two evidence sources into one verdict, with a small scoring
 * table you can read top to bottom — no black box:
 *
 *   1. Blocking text (no sponsorship / must already be authorized /
 *      citizenship or clearance)            -> unlikely
 *   2. Sponsor-positive text                -> open
 *   3. Silent text + real company record    -> likely
 *   4. Silent text + no record              -> unclear
 *
 * Two deliberate asymmetries:
 *  - Text beats records in both directions. What the employer actually wrote
 *    this year is stronger evidence than what they filed last year.
 *  - Records only ever LIFT a verdict (silent -> likely), never sink one.
 *
 * Every reason cites its evidence: the verbatim quote from the posting, or
 * the record with its source and data year. The UI renders reasons directly.
 *
 * Honesty note (docs too): company records show PAST sponsorship, not
 * present ability or intent. A licensed sponsor can stop sponsoring; an
 * unlicensed one can start. "likely" means history, not a promise.
 *
 * Browser-safe: no I/O.
 */

import type { Stance, TextStanceResult } from "./textStance";

export type VerdictStatus = "open" | "likely" | "unclear" | "unlikely";

export type VerdictReason = {
  source: "posting_text" | "company_records";
  summary: string;
  /** Verbatim quote from the posting, when the reason came from text. */
  quote?: string;
  /** Record provenance, when the reason came from records. */
  record?: {
    source: string;
    dataYear: string;
    /** What the record actually says, e.g. "Licensed UK sponsor (A rating)". */
    detail: string;
  };
};

export type Verdict = {
  status: VerdictStatus;
  /** 0-1. Reflects the weakest link among the evidence used. */
  confidence: number;
  reasons: VerdictReason[];
};

export type CompanyRecordLike = {
  uk?: boolean;
  ukRating?: string;
  n?: number;
  lastYear?: number;
};

export type RecordProvenance = {
  /** Display name of the source, e.g. "UK Home Office sponsor register". */
  name: string;
  dataYear: string;
};

export type VerdictInput = {
  textStance: TextStanceResult;
  company: string;
  record?: CompanyRecordLike;
  recordMatchConfidence?: number;
  provenance?: RecordProvenance;
};

/** A record match below this confidence is treated as no record at all. */
const MIN_RECORD_CONFIDENCE = 0.7;

export function combineVerdict(input: VerdictInput): Verdict {
  const { textStance, company, record, recordMatchConfidence = 1, provenance } = input;
  const stance = textStance.stance as Stance;

  // 1. Blocking text always wins.
  if (stance === "no_sponsorship" || stance === "requires_authorization" || stance === "citizenship_or_clearance") {
    const summary =
      stance === "no_sponsorship"
        ? "The posting says they will not sponsor."
        : stance === "requires_authorization"
          ? "The posting requires work authorisation you would need to already have."
          : "The posting requires citizenship or a security clearance.";
    return {
      status: "unlikely",
      confidence: textStance.confidence,
      reasons: [
        { source: "posting_text", summary, quote: textStance.quote || undefined },
      ],
    };
  }

  // 2. Sponsor-positive text wins next.
  if (stance === "sponsors") {
    return {
      status: "open",
      confidence: textStance.confidence,
      reasons: [
        { source: "posting_text", summary: "The posting says they sponsor visas or welcome international applicants.", quote: textStance.quote || undefined },
      ],
    };
  }

  // 3. Silent text: worldwide-hiring evidence lifts to "open"; a real
  // company record lifts to "likely"; otherwise unclear.
  if (textStance.worldwide) {
    return {
      status: "open",
      confidence: textStance.worldwide.confidence,
      reasons: [
        {
          source: "posting_text",
          summary: "The posting hires from anywhere / worldwide, so where you are does not block you. Visa sponsorship is still unstated.",
          quote: textStance.worldwide.quote,
        },
      ],
    };
  }

  const hasRealRecord =
    !!record &&
    (recordMatchConfidence ?? 1) >= MIN_RECORD_CONFIDENCE &&
    (record.uk === true || (typeof record.n === "number" && record.n > 0));

  if (hasRealRecord) {
    const recordReason: VerdictReason = {
      source: "company_records",
      summary: `${company || "This employer"} has a real history of sponsoring, so a silent posting reads as likely rather than unclear.`,
      record: provenance
        ? {
            source: provenance.name,
            dataYear: provenance.dataYear,
            detail: record!.uk
              ? `Licensed UK sponsor${record!.ukRating ? ` (${record!.ukRating} rating)` : ""}, per the ${provenance.dataYear} register`
              : `${record!.n} sponsorship filings, most recent ${record!.lastYear ?? "unknown"}`,
          }
        : undefined,
    };
    return {
      status: "likely",
      // Record-backed: confident but below explicit text, because records age.
      confidence: 0.7,
      reasons: [recordReason],
    };
  }

  // 4. Nothing known. This is a valid answer; say what is missing instead of
  // pretending.
  return {
    status: "unclear",
    confidence: textStance.confidence,
    reasons: [
      {
        source: "posting_text",
        summary:
          "The posting says nothing about visas or work authorisation" +
          ((recordMatchConfidence ?? 1) > 0 && company ? `, and ${company} has no record in the sources we can check.` : "."),
      },
    ],
  };
}
