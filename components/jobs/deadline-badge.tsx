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
      className="gap-1 rounded-none border-[#e2e2e2] font-mono text-[9.5px] uppercase tabular-nums"
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
    <Badge variant="destructive" className="rounded-none font-mono text-[9.5px] uppercase">
      {flags[0]}
    </Badge>
  );
}

/** Marks postings from the last two days, so repeat visits show what changed. */
export function NewBadge({ postedAt }: { postedAt: string | null | undefined }) {
  const today = useNow();

  if (!postedAt || today === null) return null;

  const posted = Date.parse(postedAt);
  if (Number.isNaN(posted)) return null;
  if (today.getTime() - posted > 48 * 3_600_000) return null;

  return (
    <Badge variant="secondary" className="rounded-none border-[#dce8fb] bg-[#f8fbff] font-mono text-[9.5px] uppercase text-[#548bff]">
      New
    </Badge>
  );
}
