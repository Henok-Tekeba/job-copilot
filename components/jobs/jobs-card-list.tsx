"use client";

import * as React from "react";
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
import { DeadlineBadge, RedFlagBadge } from "@/components/jobs/deadline-badge";
import { sourceLabel } from "@/lib/jobs";
import type { Job } from "@/lib/types";

type JobsCardListProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  onRowClick: (job: Job) => void;
  onResetFilters: () => void;
};

function RemoteDot({ job }: { job: Job }) {
  const verdict = job.evaluation.eligibility?.verdict;
  const eligible = job.evaluation.eligible;
  const reason = job.evaluation.eligibility?.summary || job.evaluation.remoteReason || "No info";

  const open = verdict ? verdict === "open" : eligible === "yes";
  const locked = verdict ? verdict === "region-locked" : eligible === "no";

  return (
    <span className="flex size-4 items-center justify-center" title={reason}>
      {open && <span className="size-2 rounded-full bg-emerald-500" />}
      {!open && !locked && (
        <span className="size-2 rounded-full border border-amber-500" />
      )}
      {locked && <span className="size-2 rounded-full border border-red-500/70" />}
      <span className="sr-only">Eligibility: {reason}</span>
    </span>
  );
}

function JobCard({
  job,
  applied,
  onRowClick,
}: {
  job: Job;
  applied: boolean;
  onRowClick: (job: Job) => void;
}) {
  const missing = job.evaluation.missing;
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
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-snug font-medium text-foreground">
              {job.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {job.company || "Unknown company"}
            </span>
          </div>
          <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
            {job.evaluation.fit?.priority ?? job.evaluation.fitScore ?? "-"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="capitalize">
            {job.evaluation.opportunity}
          </Badge>
          <Badge variant="secondary">{sourceLabel(job.source)}</Badge>
          {applied && <Badge variant="secondary">Applied</Badge>}
          <DeadlineBadge deadline={job.deadline} />
          <RedFlagBadge flags={job.evaluation.redFlags} />
          <RemoteDot job={job} />
        </div>

        {missing.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {missing.slice(0, 2).map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
            {missing.length > 2 && (
              <Badge variant="outline">+{missing.length - 2}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function JobsCardList({
  jobs,
  loading,
  appliedIds,
  onRowClick,
  onResetFilters,
}: JobsCardListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No jobs match your filters</EmptyTitle>
          <EmptyDescription>
            Try widening the search or lowering the minimum fit score.
          </EmptyDescription>
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
          onRowClick={onRowClick}
        />
      ))}
    </div>
  );
}
