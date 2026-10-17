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
};

export const VERDICT_STYLE: Record<Eligibility["verdict"], VerdictStyle> = {
  open: {
    label: "Open to you",
    badge: "border-emerald-500/40 text-emerald-400",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  relocation: {
    label: "Needs relocation",
    badge: "border-sky-500/40 text-sky-400",
    text: "text-sky-400",
    dot: "border border-sky-500",
  },
  "region-locked": {
    label: "Region locked",
    badge: "border-red-500/40 text-red-400",
    text: "text-red-400",
    dot: "border border-red-500/70",
  },
  conflict: {
    label: "Conflicting signals",
    badge: "border-amber-500/40 text-amber-400",
    text: "text-amber-400",
    dot: "border border-amber-500",
  },
  unknown: {
    label: "Unknown",
    badge: "border-amber-500/40 text-amber-400",
    text: "text-amber-400",
    dot: "border border-amber-500",
  },
};
