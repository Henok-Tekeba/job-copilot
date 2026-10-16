"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useNow } from "@/hooks/use-mounted";
import { daysUntil } from "@/lib/jobs";
import type { Job } from "@/lib/types";

const ENTRY_OPPORTUNITIES = ["internship", "contract", "junior", "program"];

/**
 * The four numbers that decide what to do next: how much is reachable, what is
 * about to expire, what is aimed at someone starting out, and the best score
 * on the board.
 */
export function StatCards({ jobs }: { jobs: Job[] }) {
  // Deadlines need "now", which the prerender does not have.
  const today = useNow();

  const openJobs = jobs.filter(
    (job) => job.evaluation.eligibility?.verdict === "open"
  );

  const entryOpen = openJobs.filter((job) =>
    ENTRY_OPPORTUNITIES.includes(job.evaluation.opportunity)
  );

  const closingSoon =
    today === null
      ? null
      : jobs.filter((job) => {
          if (!job.deadline) return false;
          const days = daysUntil(job.deadline, today);
          return !Number.isNaN(days) && days >= 0 && days <= 14;
        }).length;

  const priorities = jobs
    .map((job) => job.evaluation.fit?.priority)
    .filter((p): p is number => typeof p === "number" && p > 0);

  const best = priorities.length > 0 ? Math.max(...priorities) : null;

  const stats = [
    { label: "Open to you", value: openJobs.length },
    { label: "Closing in 14 days", value: closingSoon ?? "—" },
    { label: "Internships & contracts", value: entryOpen.length },
    { label: "Best priority", value: best ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex flex-col gap-1">
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
