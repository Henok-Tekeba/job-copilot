"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/components/company-avatar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMounted } from "@/hooks/use-mounted";
import { cn } from "cn";
import { opportunityLabel, workplaceLabel } from "@/lib/labels";
import type { Job } from "@/lib/types";

type BoardListProps = {
  jobs: Job[];
  loading: boolean;
  appliedIds: Set<string>;
  savedIds: Set<string>;
  selectedId: string | null;
  profileActive: boolean;
  onToggleSaved: (id: string) => void;
  onOpen: (job: Job) => void;
  onResetFilters: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

/**
 * The board rows from the reference design: logo, title over company, tag
 * pills, location, relative time, bookmark. One row per posting, ruled only
 * by spacing; the selected row is the soft grey fill. Hover changes colour,
 * never geometry.
 */
function BoardRow({
  job,
  selected,
  saved,
  applied,
  matchPct,
  onToggleSaved,
  onOpen,
}: {
  job: Job;
  selected: boolean;
  saved: boolean;
  applied: boolean;
  matchPct: number | null;
  onToggleSaved: (id: string) => void;
  onOpen: (job: Job) => void;
}) {
  const mounted = useIsMounted();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(job);
        }
      }}
      className={cn(
        "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2b4bf2]/35 sm:grid-cols-[auto_minmax(0,240px)_1fr_160px_110px_auto] sm:py-3.5",
        selected ? "bg-[#f4f4f6]" : "hover:bg-[#f4f4f6]/70",
      )}
    >
      <CompanyAvatar job={job} />

      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium leading-snug text-[#14141a]">
          {job.title}
        </p>
        <p className="truncate text-[12px] text-[#8b8b93]">
          {job.company || "Unknown company"}
          {applied ? " · Applied ✓" : ""}
        </p>
      </div>

      <div className="hidden min-w-0 flex-wrap items-center gap-1.5 sm:flex">
        {[opportunityLabel(job.evaluation.opportunity), workplaceLabel(job.evaluation.eligibility?.workplace)]
          .filter(Boolean)
          .map((chip) => (
            <span
              key={chip}
              className="inline-flex h-8 items-center rounded-lg bg-[#f4f4f6] px-3 text-[12.5px] font-medium text-[#5c5c64]"
            >
              {chip}
            </span>
          ))}
      </div>

      <p className="hidden truncate text-[13px] text-[#14141a] sm:block">
        {job.location}
      </p>

      <p className="hidden font-mono text-[12px] text-[#8b8b93] lg:block">
        {mounted ? timeAgo(job.postedAt) : "—"}
      </p>

      {matchPct !== null ? (
        <span className="hidden h-8 items-center rounded-lg bg-[#f4f4f6] px-2.5 text-[12.5px] font-semibold text-[#2b4bf2] tabular-nums sm:inline-flex">
          {matchPct}%
        </span>
      ) : null}

      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save internship"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSaved(job.id);
        }}
        className="grid size-9 place-items-center rounded-full text-[#14141a] transition-colors hover:bg-white focus-visible:outline-none"
      >
        <Bookmark className={cn("size-[18px]", saved && "fill-[#2b4bf2] text-[#2b4bf2]")} />
      </button>
    </div>
  );
}

export function BoardList({
  jobs,
  loading,
  appliedIds,
  savedIds,
  selectedId,
  profileActive,
  onToggleSaved,
  onOpen,
  onResetFilters,
  emptyTitle = "No internships match",
  emptyDescription = "Try widening the search or lowering the minimum fit score.",
}: BoardListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
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
    <div className="flex flex-col gap-1">
      {jobs.map((job) => (
        <BoardRow
          key={job.id}
          job={job}
          selected={job.id === selectedId}
          saved={savedIds.has(job.id)}
          applied={appliedIds.has(job.id)}
          matchPct={
            profileActive && job.evaluation.fit?.score != null
              ? Math.round(job.evaluation.fit.score)
              : null
          }
          onToggleSaved={onToggleSaved}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
