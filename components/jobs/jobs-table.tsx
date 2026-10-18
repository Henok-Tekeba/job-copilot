"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { DeadlineBadge } from "@/components/jobs/deadline-badge";
import { useNow } from "@/hooks/use-mounted";
import { relativeTime, sourceLabel } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import { isUnstatedLocation } from "@/lib/regions";
import type { Job } from "@/lib/types";

type JobsTableProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  savedIds: Set<string>;
  onRowClick: (job: Job) => void;
  onToggleApplied: (job: Job) => void;
  onToggleSaved: (id: string) => void;
  onDismiss: (id: string) => void;
  onResetFilters: () => void;
};

function VerdictCell({ job }: { job: Job }) {
  const verdict = job.evaluation.eligibility?.verdict ?? "unknown";
  const reason =
    job.evaluation.eligibility?.summary ||
    job.evaluation.remoteReason ||
    "Nothing in the posting says either way.";
  const sponsorship = job.evaluation.eligibility?.sponsorship?.verdict;

  return (
    <HoverCard>
      <HoverCardTrigger>
        <span
          className={cn(
            "cursor-default text-sm font-medium",
            VERDICT_STYLE[verdict].text
          )}
        >
          {VERDICT_STYLE[verdict].label}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-72">
        <span className={cn("text-xs font-medium", VERDICT_STYLE[verdict].text)}>
          {VERDICT_STYLE[verdict].label}
        </span>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {reason}
        </p>
        {sponsorship === "offered" || sponsorship === "not-offered" ? (
          <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
            {sponsorship === "offered"
              ? "Visa sponsorship offered."
              : "No visa sponsorship."}
          </p>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

export function JobsTable({
  jobs,
  loading,
  appliedIds,
  savedIds,
  onRowClick,
  onToggleApplied,
  onToggleSaved,
  onDismiss,
  onResetFilters,
}: JobsTableProps) {
  const nowDate = useNow();
  const now = nowDate ? nowDate.getTime() : 0;

  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
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
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-32 pl-4 text-xs font-normal text-muted-foreground sm:pl-6">
            Verdict
          </TableHead>
          <TableHead className="text-xs font-normal text-muted-foreground">
            Role
          </TableHead>
          <TableHead className="w-16 text-xs font-normal text-muted-foreground">
            Priority
          </TableHead>
          <TableHead className="hidden w-24 text-xs font-normal text-muted-foreground md:table-cell">
            Type
          </TableHead>
          <TableHead className="hidden w-28 text-xs font-normal text-muted-foreground lg:table-cell">
            Closes
          </TableHead>
          <TableHead className="hidden w-44 text-xs font-normal text-muted-foreground xl:table-cell">
            Missing
          </TableHead>
          <TableHead className="w-14 pr-4 sm:pr-6" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {jobs.map((job) => {
          const applied = appliedIds.has(job.id);
          const location = isUnstatedLocation(job.location) ? null : job.location;
          const missing = job.evaluation.missing;
          const verdict = job.evaluation.eligibility?.verdict ?? "unknown";

          return (
            <TableRow
              key={job.id}
              className={cn(
                "group cursor-pointer border-b-border/70 border-l-2",
                VERDICT_STYLE[verdict].rail
              )}
              onClick={() => onRowClick(job)}
            >
              <TableCell className="py-2 pl-4 align-top sm:pl-6">
                <VerdictCell job={job} />
              </TableCell>

              <TableCell className="max-w-0 py-2 align-top">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {job.title}
                    </span>
                    {applied && (
                      <span className="shrink-0 text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        applied
                      </span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[
                      job.company || "Unknown company",
                      location,
                      sourceLabel(job.source),
                      job.postedAt && relativeTime(job.postedAt, now),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </TableCell>

              <TableCell className="py-2 align-top">
                <span className="font-mono text-sm font-medium tabular-nums">
                  {job.evaluation.fit?.priority ?? job.evaluation.fitScore ?? "—"}
                </span>
              </TableCell>

              <TableCell className="hidden py-2 align-top md:table-cell">
                <span className="text-xs text-muted-foreground">
                  {job.evaluation.opportunity}
                </span>
              </TableCell>

              <TableCell className="hidden py-2 align-top lg:table-cell">
                {job.deadline ? (
                  <DeadlineBadge deadline={job.deadline} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell className="hidden py-2 align-top xl:table-cell">
                {missing.length === 0 ? (
                  <span className="text-xs text-muted-foreground">nothing</span>
                ) : (
                  <HoverCard>
                    <HoverCardTrigger>
                      <span className="cursor-default text-xs text-muted-foreground underline decoration-dotted underline-offset-4">
                        {missing.slice(0, 2).join(", ")}
                        {missing.length > 2 && (
                          <span className="font-mono">
                            {" "}
                            +{missing.length - 2}
                          </span>
                        )}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" align="start" className="w-64">
                      <div className="flex flex-wrap gap-1">
                        {missing.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </TableCell>

              <TableCell className="py-2 pr-4 align-top sm:pr-6">
                <div
                  className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          window.open(
                            job.applyUrl || job.sourceUrl,
                            "_blank",
                            "noopener"
                          )
                        }
                      >
                        Open posting
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onToggleSaved(job.id)}>
                        {savedIds.has(job.id) ? "Remove from saved" : "Save"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={applied}
                        onSelect={() => onToggleApplied(job)}
                      >
                        {applied ? "Applied" : "Mark applied"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onDismiss(job.id)}
                      >
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
