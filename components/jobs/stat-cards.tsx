"use client";

import { Separator } from "@/components/ui/separator";
import { useNow } from "@/hooks/use-mounted";
import { daysUntil } from "@/lib/jobs";
import type { JobsSummary } from "@/lib/summary";
import type { Job } from "@/lib/types";

/**
 * The headline numbers, supplied by the server on first paint so the page never
 * shows a row of zeros while the snapshot loads.
 *
 * Only "closing in 14 days" has to be computed in the browser, because it
 * depends on today's date.
 */
function countClosingSoon(jobs: Job[], today: Date): number {
  let count = 0;
  for (const job of jobs) {
    if (!job.deadline) continue;
    const days = daysUntil(job.deadline, today);
    if (!Number.isNaN(days) && days >= 0 && days <= 14) count++;
  }
  return count;
}

/**
 * The board's ledger strip.
 *
 * One ruled line rather than four boxes: the reachable count is the only number
 * worth reading first, so it is set large in mono and the rest sit beside it as
 * supporting figures. Cards here would give four things equal weight.
 */
export function StatCards({
  summary,
  jobs,
  loaded,
}: {
  summary: JobsSummary;
  jobs: Job[];
  loaded: boolean;
}) {
  const today = useNow();
  const closingSoon = loaded && today ? countClosingSoon(jobs, today) : null;

  const rest = [
    { label: "Internships & contracts", value: summary.entry },
    { label: "Closing in 14 days", value: closingSoon ?? "—" },
    { label: "Best priority", value: summary.best ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-end sm:gap-8">
      <div className="flex shrink-0 flex-col gap-1">
        <span className="font-mono text-4xl leading-none font-semibold tracking-tight tabular-nums">
          {summary.reachable}
        </span>
        <span className="text-xs text-muted-foreground">
          open to you, of {summary.total} postings
        </span>
      </div>

      <Separator orientation="vertical" className="hidden h-10 sm:block" />

      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {rest.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="font-mono text-lg leading-none font-medium tabular-nums">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
