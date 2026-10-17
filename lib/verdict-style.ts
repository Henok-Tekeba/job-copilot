import type { Eligibility } from "./types";

/**
 * One accent, two intensities, and a muted floor.
 *
 * Reachability is the single most important thing about a posting, so it is the
 * only thing allowed to carry colour. Bright accent means you can act now; dim
 * accent means it needs a move; muted means it is simply not for you. Red is
 * reserved for red flags, which are a genuine alarm rather than a category.
 *
 * Defining this once stops the four competing status colours that had grown
 * across the panel, the cards and the table.
 */
export type VerdictStyle = {
  label: string;
  /** Badge treatment in the detail panel. */
  badge: string;
  /** Text-only treatment for dense rows. */
  text: string;
  /** The dot beside a title in a list. */
  dot: string;
};

export const VERDICT_STYLE: Record<Eligibility["verdict"], VerdictStyle> = {
  open: {
    label: "Open to you",
    badge: "border-primary/50 text-primary",
    text: "text-primary",
    dot: "bg-primary",
  },
  relocation: {
    label: "Needs relocation",
    badge: "border-primary/25 text-primary/75",
    text: "text-primary/75",
    dot: "border border-primary/60",
  },
  "region-locked": {
    label: "Not open to you",
    badge: "border-border text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/35",
  },
  conflict: {
    label: "Conflicting signals",
    badge: "border-destructive/50 text-destructive",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  unknown: {
    label: "Unclear",
    badge: "border-border text-muted-foreground",
    text: "text-muted-foreground",
    dot: "border border-muted-foreground/50",
  },
};
