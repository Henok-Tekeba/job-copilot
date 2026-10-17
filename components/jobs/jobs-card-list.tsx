"use client";

import * as React from "react";
import { BookmarkIcon, CheckIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DeadlineBadge,
  NewBadge,
  RedFlagBadge,
} from "@/components/jobs/deadline-badge";
import { cn } from "@/lib/utils";
import { isUnstatedLocation } from "@/lib/regions";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Job } from "@/lib/types";

type JobsCardListProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  savedIds: Set<string>;
  onToggleSaved: (id: string) => void;
  onToggleApplied: (job: Job) => void;
  onRowClick: (job: Job) => void;
  onResetFilters: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return "";
  }
}

/**
 * The board on a phone: the same ledger, one row per posting.
 *
 * The verdict rail is carried over from the table so a screen and a narrow
 * window read as the same board, and the row is ruled rather than boxed — a
 * stack of cards on mobile is what made the board feel like a directory.
 */
function JobCard({
  job,
  applied,
  saved,
  onToggleSaved,
  onToggleApplied,
  onRowClick,
}: {
  job: Job;
  applied: boolean;
  saved: boolean;
  onToggleSaved: (id: string) => void;
  onToggleApplied: (job: Job) => void;
  onRowClick: (job: Job) => void;
}) {
  const fit = job.evaluation.fit;
  const verdict = job.evaluation.eligibility?.verdict ?? "unknown";

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col gap-1.5 border-b border-border py-3 pl-3 pr-4 active:bg-muted/40",
        "border-l-2",
        VERDICT_STYLE[verdict].rail
      )}
      onClick={() => onRowClick(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(job);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-sm leading-snug font-medium text-foreground">
          {job.title}
        </span>
        <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
          {fit?.priority ?? job.evaluation.fitScore ?? "-"}
        </span>
      </div>

      <p className="truncate text-xs text-muted-foreground">
        {[
          job.company || "Unknown company",
          isUnstatedLocation(job.location) ? "" : job.location,
          job.postedAt && formatDate(job.postedAt),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <p className="text-xs text-muted-foreground">
        <span className={VERDICT_STYLE[verdict].text}>
          {VERDICT_STYLE[verdict].label}
        </span>
        {" · "}
        {job.evaluation.opportunity}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <DeadlineBadge deadline={job.deadline} />
        <NewBadge postedAt={job.postedAt} />
        <RedFlagBadge flags={job.evaluation.redFlags} />
      </div>

      {/* The pre-apply check: what would likely screen them out. */}
      {fit?.basis === "required" && fit.requiredMissing.length > 0 && (
        <p className="text-xs text-muted-foreground">
          You lack: {fit.requiredMissing.slice(0, 3).join(", ")}
          {fit.requiredMissing.length > 3
            ? ` and ${fit.requiredMissing.length - 3} more`
            : ""}
        </p>
      )}

      {/* Triage actions. The row opens the detail page; these do not. */}
      <div
        className="flex items-center gap-1.5 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant={saved ? "secondary" : "outline"}
          size="xs"
          onClick={() => onToggleSaved(job.id)}
        >
          <BookmarkIcon />
          {saved ? "Saved" : "Save"}
        </Button>
        <Button
          variant={applied ? "secondary" : "outline"}
          size="xs"
          onClick={() => onToggleApplied(job)}
        >
          <CheckIcon />
          {applied ? "Applied" : "Mark applied"}
        </Button>
      </div>
    </div>
  );
}

export function JobsCardList({
  jobs,
  loading,
  appliedIds,
  savedIds,
  onToggleSaved,
  onToggleApplied,
  onRowClick,
  onResetFilters,
  emptyTitle = "No jobs match",
  emptyDescription = "Try widening the search or lowering the minimum fit score.",
}: JobsCardListProps) {
  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border-b border-border py-4 pl-3 pr-4"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          applied={appliedIds.has(job.id)}
          saved={savedIds.has(job.id)}
          onToggleSaved={onToggleSaved}
          onToggleApplied={onToggleApplied}
          onRowClick={onRowClick}
        />
      ))}
    </div>
  );
}
