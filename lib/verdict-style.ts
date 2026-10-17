import type { Eligibility } from "./types";

/**
 * How each eligibility verdict is drawn.
 *
 * Defined once so the detail panel, the cards and the table cannot drift apart,
 * which is how the four status colours came to be repeated in three places.
 */
export type VerdictStyle = {
  label: string;
  /** Badge treatment in the detail panel. */
  badge: string;
  /** Text-only treatment. */
  text: string;
  /** The dot beside a title in a list. */
  dot: string;
  /** The rail down the left edge of a board row. */
  rail: string;
};

/**
 * Feed field names are snake_case jargon (`candidate_required_location`); the
 * UI speaks plain English. Defined once so the eligibility panel and the
 * landing inspector cannot label the same field differently.
 */
export const EVIDENCE_FIELD_LABELS: Record<string, string> = {
  candidate_required_location: "Required location",
  location: "Location",
};

export const VERDICT_STYLE: Record<Eligibility["verdict"], VerdictStyle> = {
  open: {
    label: "Open to you",
    badge: "border-emerald-500/40 text-emerald-400",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    rail: "border-l-emerald-500",
  },
  relocation: {
    label: "Needs relocation",
    badge: "border-sky-500/40 text-sky-400",
    text: "text-sky-400",
    dot: "border border-sky-500",
    rail: "border-l-sky-500/70",
  },
  "region-locked": {
    label: "Region locked",
    badge: "border-red-500/40 text-red-400",
    text: "text-red-400",
    dot: "border border-red-500/70",
    rail: "border-l-red-500/70",
  },
  conflict: {
    label: "Conflicting signals",
    badge: "border-amber-500/40 text-amber-400",
    text: "text-amber-400",
    dot: "border border-amber-500",
    rail: "border-l-amber-500/70",
  },
  unknown: {
    label: "Reach unclear",
    badge: "border-amber-500/40 text-amber-400",
    text: "text-amber-400",
    dot: "border border-amber-500",
    rail: "border-l-amber-500/40",
  },
};
