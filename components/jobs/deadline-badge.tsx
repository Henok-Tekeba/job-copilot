"use client";

import * as React from "react";
import { CalendarClockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/use-mounted";
import { deadlineLabel, daysUntil } from "@/lib/jobs";

/**
 * Deadline pill.
 *
 * Renders nothing until after hydration: the page is prerendered at build time,
 * so a relative label computed during the prerender would differ from the one
 * computed in the browser and trip a hydration mismatch.
 */
export function DeadlineBadge({ deadline }: { deadline: string | null | undefined }) {
  const today = useNow();

  if (!deadline || today === null) return null;

  const days = daysUntil(deadline, today);
  if (Number.isNaN(days)) return null;

  const closed = days < 0;
  const urgent = !closed && days <= 7;

  return (
    <Badge
      variant={urgent ? "destructive" : "outline"}
      className="gap-1 font-mono text-xs tabular-nums"
    >
      <CalendarClockIcon className="size-3" />
      {deadlineLabel(deadline, today)}
    </Badge>
  );
}

/** Warns when a posting looks unpaid, commission-only, or fee-charging. */
export function RedFlagBadge({ flags }: { flags: string[] | undefined }) {
  if (!flags || flags.length === 0) return null;
  return (
    <Badge variant="destructive" className="text-xs">
      {flags[0]}
    </Badge>
  );
}
