"use client";

import * as React from "react";
import { BookmarkIcon, CheckIcon } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { sourceLabel } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Job } from "@/lib/types";

type JobsCardListProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  savedIds: Set<string>;
  onToggleSaved: (id: string) => void;
  onToggleApplied: (id: string) => void;
  onRowClick: (job: Job) => void;
  onResetFilters: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function VerdictDot({ job }: { job: Job }) {
  const verdict = job.evaluation.eligibility?.verdict ?? "unknown";
  const reason =
    job.evaluation.eligibility?.summary ||
    job.evaluation.remoteReason ||
    "No information";

  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", VERDICT_STYLE[verdict].dot)}
      title={reason}
    >
      <span className="sr-only">Eligibility: {reason}</span>
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return "";
  }
}

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
  onToggleApplied: (id: string) => void;
  onRowClick: (job: Job) => void;
}) {
  const fit = job.evaluation.fit;

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => onRowClick(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(job);
        }
      }}
    >
      <CardContent className="flex flex-col gap-1.5">
        {/* One ranked line: title, and the number it is sorted by. */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium leading-snug text-foreground">
            {job.title}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <VerdictDot job={job} />
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {fit?.priority ?? job.evaluation.fitScore ?? "-"}
            </span>
          </span>
        </div>

        <p className="truncate text-xs text-muted-foreground">
          {[job.company || "Unknown company", job.location, job.postedAt && formatDate(job.postedAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="capitalize">
            {job.evaluation.opportunity}
          </Badge>
          <Badge variant="secondary">{sourceLabel(job.source)}</Badge>
          <NewBadge postedAt={job.postedAt} />
          <DeadlineBadge deadline={job.deadline} />
          <RedFlagBadge flags={job.evaluation.redFlags} />
        </div>

        {/* The pre-apply check: what would likely screen them out. */}
        {fit?.basis === "required" && fit.requiredMissing.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">
            You lack: {fit.requiredMissing.slice(0, 3).join(", ")}
            {fit.requiredMissing.length > 3
              ? ` and ${fit.requiredMissing.length - 3} more`
              : ""}
          </p>
        )}

        {/* Triage actions. The card opens the detail sheet; these do not. */}
        <div
          className="flex items-center gap-1.5 pt-0.5"
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
            onClick={() => onToggleApplied(job.id)}
          >
            <CheckIcon />
            {applied ? "Applied" : "Mark applied"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
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
    <div className="flex flex-col gap-2 p-2">
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
