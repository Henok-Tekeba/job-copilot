"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";

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
import { VERDICT_STYLE } from "@/lib/verdict-style";
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
  const verdict = job.evaluation.eligibility?.verdict;
  const verdictLabel = verdict ? VERDICT_STYLE[verdict].label : "Reach unclear";
  const verdictTone =
    verdict === "open" || verdict === "relocation"
      ? "text-[#548bff]"
      : "text-[#8f8f94]";

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
        "group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(12px,1.4vw,20px)] gap-y-2 border-b border-[#ececec] py-[clamp(14px,1.5vw,20px)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#548bff]/35 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_64px_auto] md:grid-cols-[auto_minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_64px_auto]",
        selected
          ? "bg-[#f8fbff] shadow-[inset_2px_0_0_#548bff]"
          : "hover:bg-[#fbfbfb]",
      )}
    >
      <CompanyAvatar
        job={job}
        className="size-[clamp(36px,3.1vw,42px)] rounded-none border border-[#ececec] bg-[#fbfbfb]"
      />

      <div className="min-w-0">
        <p className="truncate font-satoshi text-[clamp(14px,1.18vw,17px)] leading-[1.25] font-medium tracking-[-0.02em] text-[#0b0b0d]">
          {job.title}
        </p>
        <p className="mt-1 truncate text-[11.5px] text-[#8f8f94]">
          {job.company || "Unknown company"}
          {applied ? (
            <span className="ml-2 font-mono text-[9px] tracking-[0.04em] text-[#548bff] uppercase">
              Applied
            </span>
          ) : null}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[10px] text-[#9a9a9a] md:hidden">
          <span className={`shrink-0 ${verdictTone}`}>{verdictLabel}</span>
          <span className="text-[#d0d0d0]">·</span>
          <span className="truncate">{job.location}</span>
        </p>
      </div>

      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {[opportunityLabel(job.evaluation.opportunity), workplaceLabel(job.evaluation.eligibility?.workplace)]
              .filter(Boolean)
              .map((chip, index, all) => (
                <span
                  key={chip}
                  className="font-mono text-[9.5px] tracking-[0.04em] text-[#5f5f65] uppercase"
                >
                  {chip}
                  {index < all.length - 1 ? (
                    <span className="mx-2 text-[#cfcfcf]">·</span>
                  ) : null}
                </span>
              ))}
          </div>
          <span className={`font-mono text-[9px] tracking-[0.04em] uppercase ${verdictTone}`}>
            {verdictLabel}
          </span>
        </div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-[12px] text-[#3a3a3a]">{job.location}</p>
        <p className="mt-1 font-mono text-[9.5px] text-[#9a9a9a]">
          {mounted
            ? timeAgo(job.postedAt)
            : job.postedAt
              ? format(new Date(job.postedAt), "MMM d")
              : "—"}
        </p>
      </div>

      <span
        className={cn(
          "hidden size-9 place-items-center border font-mono text-[10.5px] tabular-nums sm:grid",
          matchPct !== null
            ? "border-[#dce8fb] bg-[#f8fbff] text-[#548bff]"
            : "border-[#ececec] bg-white text-[#b0b0b5]",
        )}
        title={matchPct !== null ? `${matchPct}% skill match` : "No profile match"}
      >
        {matchPct !== null ? `${matchPct}%` : "—"}
      </span>

      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save internship"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSaved(job.id);
        }}
        className="grid size-11 place-items-center border border-[#e2e2e2] bg-white text-[#3a3a3a] transition-colors hover:border-[#548bff] hover:text-[#548bff] focus-visible:outline-none sm:size-9"
      >
        <Bookmark className={cn("size-[15px]", saved && "fill-[#548bff] text-[#548bff]")} />
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
      <div className="flex flex-col">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-none border-b border-[#ececec]" />
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
    <div>
      <div className="hidden items-center gap-x-[clamp(12px,1.4vw,20px)] border-b border-[#14141a] pb-2 font-mono text-[9px] tracking-[0.08em] text-[#77777d] uppercase md:grid md:grid-cols-[auto_minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_64px_auto]">
        <span className="size-[clamp(36px,3.1vw,42px)]" aria-hidden="true" />
        <span>Role</span>
        <span>Type / Access</span>
        <span>Location</span>
        <span>Match</span>
        <span className="size-9" aria-hidden="true" />
      </div>
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
