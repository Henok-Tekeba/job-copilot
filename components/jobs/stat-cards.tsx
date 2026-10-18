"use client";

import { cn } from "@/lib/utils";
import { useNow } from "@/hooks/use-mounted";
import { daysUntil } from "@/lib/jobs";
import type { JobsSummary } from "@/lib/summary";
import type { Job } from "@/lib/types";

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
  onReachable,
  onInternships,
  onClosingSoon,
  onBestPriority,
}: {
  summary: JobsSummary;
  jobs: Job[];
  loaded: boolean;
  onReachable?: () => void;
  onInternships?: () => void;
  onClosingSoon?: () => void;
  onBestPriority?: () => void;
}) {
  const today = useNow();
  const closingSoon = loaded && today ? countClosingSoon(jobs, today) : null;

  const cells: {
    key: string;
    label: string;
    value: string | number;
    size: "lg" | "md";
    onClick?: () => void;
  }[] = [
    {
      key: "reachable",
      label: "Reachable",
      value: summary.reachable,
      size: "lg",
      onClick: onReachable,
    },
    {
      key: "internships",
      label: "Internships",
      value: summary.entry,
      size: "md",
      onClick: onInternships,
    },
    {
      key: "closing",
      label: "Closing soon",
      value: closingSoon ?? "—",
      size: "md",
      onClick: onClosingSoon,
    },
    {
      key: "priority",
      label: "Best priority",
      value: summary.best ?? "—",
      size: "md",
      onClick: onBestPriority,
    },
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border border border-border sm:grid-cols-4 sm:divide-y-0">
      {cells.map((cell) => {
        const Comp = cell.onClick ? "button" : "div";
        return (
          <Comp
            key={cell.key}
            onClick={cell.onClick}
            className={cn(
              "flex flex-col gap-1 px-4 py-3 text-left",
              cell.onClick && "transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
            )}
          >
            <span
              className={cn(
                "font-mono leading-none tabular-nums",
                cell.size === "lg"
                  ? "text-[48px] font-semibold tracking-tight"
                  : "text-[24px] font-medium"
              )}
            >
              {cell.value}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              {cell.label}
            </span>
          </Comp>
        );
      })}
    </div>
  );
}