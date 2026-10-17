"use client";

import { Card, CardContent } from "@/components/ui/card";
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

  const stats = [
    { label: "Reachable", value: summary.reachable },
    { label: "Internships & contracts", value: summary.entry },
    { label: "Closing in 14 days", value: closingSoon ?? "—" },
    { label: "Best priority", value: summary.best ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
