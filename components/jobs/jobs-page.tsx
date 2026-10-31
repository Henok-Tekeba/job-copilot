"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { byPriority } from "@/lib/summary";
import { daysUntil } from "@/lib/jobs";
import type { Job } from "@/lib/types";

import { useRouter, useSearchParams } from "next/navigation";

import { CommandPalette } from "@/components/jobs/command-palette";
import { BoardList } from "@/components/jobs/board-list";
import { BoardShell } from "@/components/jobs/board-shell";
import {
  BoardFilters,
  type OpportunityFilter,
  type SortBy,
} from "@/components/jobs/board-filters";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { useProfile } from "@/hooks/use-profile";
import { applyProfile, isDefaultProfile } from "@/lib/profile";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTrackedJobs } from "@/hooks/use-tracked-jobs";

type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | Job["source"];

const PAGE_SIZE = 24;

// Shortlist is internships and contracts only; anything else the feeds
// carry (full-time, junior, program) is dropped before it ever renders.
const SHOWN_OPPORTUNITY = new Set(["internship", "contract"]);

export default function JobsPage({ initialJobs }: { initialJobs: Job[] }) {  // Seeded with a real first page from the server, so the first paint is
  // postings rather than skeletons.
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [loaded, setLoaded] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);

  // Data arrives as an asset rather than as serialised props, so the HTML stays
  // small enough to load on a phone.
  React.useEffect(() => {
    let cancelled = false;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    fetch(`${basePath}/jobs.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<Job[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setJobs(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const [search, setSearch] = React.useState("");
  // The landing hero search lands on /jobs?search=…; adopt it once on mount.
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const incoming = searchParams.get("search");
    if (incoming != null && incoming !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(incoming);
    }
  }, [searchParams]);
  const [opportunityFilter, setOpportunityFilter] =
    React.useState<OpportunityFilter>("all");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = React.useState<EligibilityFilter>("open");
  const [showNonSoftware, setShowNonSoftware] = React.useState(false);
  const [minFit, setMinFit] = React.useState(0);
  // Defaults to priority so the prerendered order matches the hydrated order.
  const [sortBy, setSortBy] = React.useState<SortBy>("priority");
  // The hero's second field filters by what the posting itself says about
  // where the work sits.
  const [location, setLocation] = React.useState("");

  // Pagination is owned here, not by the table or the card list. Both render the
  // same slice so the page can be prerendered small: 4,000 postings rendered in
  // full produced a 17 MB index.html.
  const [pageIndex, setPageIndex] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Saved / applied / dismissed, persisted in the browser. The static site has
  // no server, so this is the application tracker.
  const tracked = useTrackedJobs();
  const { profile } = useProfile();  const [tab, setTab] = React.useState<"all" | "saved" | "applied">("all");

  const filterKey = [
    search,
    location,
    opportunityFilter,
    sourceFilter,
    eligibilityFilter,
    showNonSoftware,
    minFit,
    sortBy,
    tab,
  ].join("|");
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPageIndex(0);
  }

  const router = useRouter();
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_STATIC === "1") return;
    async function loadApplied() {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) return;
        const apps: Array<{ jobId: string | null }> = await res.json();
        const ids = new Set(apps.filter((a) => a.jobId).map((a) => a.jobId!));
        setAppliedIds(ids);
      } catch {
        // The API route was removed with the applications page; the local
        // tracker still records applied state.
      }
    }
    loadApplied();
  }, []);

  const handleDismiss = React.useCallback(
    (id: string) => {
      tracked.dismiss(id);
    },
    [tracked],
  );

  const openJob = React.useCallback(
    (job: Job) => {
      router.push(`/jobs/${job.id}`);
    },
    [router],
  );

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const effectiveJobs = React.useMemo(() => {
    if (isDefaultProfile(profile)) return jobs;
    return jobs.map((j) => applyProfile(j, profile.skills));
  }, [jobs, profile]);

  // One predicate, two consumers: the visible list and the tab count. The tab
  // count ignores the opportunity pill so its number keeps the same meaning
  // whichever pill is active — a count that silently changes is a lie.
  const passesFilters = React.useCallback(
    (
      job: Job,
      opts?: { ignoreOpportunity?: boolean; ignoreTab?: boolean },
    ) => {
      const query = search.trim().toLowerCase();
      if (tracked.dismissed.has(job.id)) return false;
      if (!opts?.ignoreTab) {
        if (tab === "saved" && !tracked.saved.has(job.id)) return false;
        if (
          tab === "applied" &&
          !tracked.applied.has(job.id) &&
          !appliedIds.has(job.id)
        )
          return false;
      }
      if (!showNonSoftware && job.relevance !== "software") return false;
      if (
        query &&
        !job.title.toLowerCase().includes(query) &&
        !job.company.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (!SHOWN_OPPORTUNITY.has(job.evaluation.opportunity)) return false;
      if (
        !opts?.ignoreOpportunity &&
        opportunityFilter !== "all" &&
        job.evaluation.opportunity !== opportunityFilter
      ) {
        return false;
      }
      if (sourceFilter !== "all" && job.source !== sourceFilter) return false;
      if (
        location &&
        !job.location.toLowerCase().includes(location.toLowerCase())
      ) {
        return false;
      }
      if (eligibilityFilter === "open" && job.evaluation.eligible === "no")
        return false;
      if (eligibilityFilter === "no" && job.evaluation.eligible !== "no")
        return false;
      if (job.evaluation.fitScore !== null && job.evaluation.fitScore < minFit)
        return false;
      return true;
    },
    [
      search,
      location,
      opportunityFilter,
      sourceFilter,
      eligibilityFilter,
      showNonSoftware,
      minFit,
      tab,
      tracked.dismissed,
      tracked.saved,
      tracked.applied,
      appliedIds,
    ],
  );

  const filteredJobs = React.useMemo(() => {
    return effectiveJobs
      .filter((job) => passesFilters(job))
      .sort((a, b) => {
        if (sortBy === "closing") {
          // Closed and undated postings sink below anything still open.
          const rank = (job: Job) => {
            if (!job.deadline) return Number.POSITIVE_INFINITY;
            const days = daysUntil(job.deadline);
            return Number.isNaN(days) || days < 0
              ? Number.POSITIVE_INFINITY
              : days;
          };
          const diff = rank(a) - rank(b);
          if (diff !== 0) return diff;
        } else if (sortBy === "newest") {
          const at = a.postedAt ? Date.parse(a.postedAt) : 0;
          const bt = b.postedAt ? Date.parse(b.postedAt) : 0;
          if (at !== bt) return bt - at;
        }

        // `priority` already folds in seniority and eligibility.
        return byPriority(a, b);
      });
  }, [effectiveJobs, passesFilters, sortBy]);

  const allCount = React.useMemo(
    () =>
      effectiveJobs.filter((job) =>
        passesFilters(job, { ignoreOpportunity: true, ignoreTab: true }),
      ).length,
    [effectiveJobs, passesFilters],
  );

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedJobs = filteredJobs.slice(
    safePageIndex * PAGE_SIZE,
    safePageIndex * PAGE_SIZE + PAGE_SIZE
  );

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inInput =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (event.metaKey || event.ctrlKey) return;

      if (event.key === "/") {
        if (inInput) return;
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>("[data-search-input]")
          ?.focus();
        return;
      }
      if (inInput) return;

      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        if (pagedJobs.length === 0) return;
        const idx = pagedJobs.findIndex((j) => j.id === selectedId);
        let next = idx;
        if (event.key === "j") {
          next = idx < 0 ? 0 : Math.min(pagedJobs.length - 1, idx + 1);
        } else {
          next = idx < 0 ? 0 : Math.max(0, idx - 1);
        }
        setSelectedId(pagedJobs[next].id);
        return;
      }
      if (event.key === "Enter") {
        const job = pagedJobs.find((j) => j.id === selectedId);
        if (job) {
          event.preventDefault();
          openJob(job);
        }
        return;
      }
      if (event.key === "s") {
        const job = pagedJobs.find((j) => j.id === selectedId);
        if (job) {
          event.preventDefault();
          tracked.toggleSaved(job.id);
        }
        return;
      }
      if (event.key === "x") {
        const job = pagedJobs.find((j) => j.id === selectedId);
        if (job) {
          event.preventDefault();
          handleDismiss(job.id);
        }
        return;
      }
      if (event.key === "a") {
        const job = pagedJobs.find((j) => j.id === selectedId);
        if (job) {
          event.preventDefault();
          tracked.markApplied(job);
        }
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pagedJobs, selectedId, tracked, openJob, handleDismiss]);


  const sidebarNode = (
    <BoardFilters
      search={search}
      onSearchChange={setSearch}
      opportunityFilter={opportunityFilter}
      onOpportunityFilterChange={setOpportunityFilter}
      eligibilityFilter={eligibilityFilter}
      onEligibilityFilterChange={setEligibilityFilter}
      showNonSoftware={showNonSoftware}
      onShowNonSoftwareChange={setShowNonSoftware}
      sortBy={sortBy}
      onSortByChange={setSortBy}
      minFit={minFit}
      onMinFitChange={setMinFit}
      profileActive={!isDefaultProfile(profile)}
    />
  );

  const handleResetFilters = () => {
    setSearch("");
    setOpportunityFilter("all");
    setSourceFilter("all");
    setEligibilityFilter("open");
    setShowNonSoftware(false);
    setMinFit(0);
    setLocation("");
  };

  return (
    <BoardShell
      tab={tab}
      onTabChange={setTab}
      counts={{
        all: allCount,
        saved: tracked.saved.size,
        applied: tracked.applied.size + appliedIds.size,
      }}
      resultCount={filteredJobs.length}
      opportunityFilter={opportunityFilter}
      onOpportunityFilterChange={setOpportunityFilter}
      searchValue={search}
      onSearchChange={setSearch}
      locationValue={location}
      onLocationChange={setLocation}
      sidebarSlot={sidebarNode}
    >
      {loadFailed && jobs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Could not load postings</EmptyTitle>
              <EmptyDescription>
                The job snapshot did not load. Check your connection and try
                again.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadFailed(false);
                  setReloadToken((n) => n + 1);
                }}
              >
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
        <>
        <BoardList
          jobs={pagedJobs}
          loading={false}
          appliedIds={appliedIds}
          savedIds={tracked.saved}
          selectedId={selectedId}
          profileActive={!isDefaultProfile(profile)}
          onToggleSaved={tracked.toggleSaved}
          onOpen={openJob}
          onResetFilters={handleResetFilters}
          emptyTitle={
            tab === "saved"
              ? "Nothing saved yet"
              : tab === "applied"
                ? "Nothing marked applied"
                : "No internships match"
          }
          emptyDescription={
            tab === "saved"
              ? "Save postings you want to come back to and they will collect here."
              : tab === "applied"
                ? "Mark a posting as applied to keep the list here."
                : "Try widening the search or lowering the minimum fit score."
          }
        />

        {loaded && (
          <JobsPagination
            pageIndex={safePageIndex}
            pageSize={PAGE_SIZE}
            total={filteredJobs.length}
            onPageChange={setPageIndex}
          />
        )}
        </>
      )}

      <CommandPalette
        jobs={jobs}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={openJob}
      />

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Open search</span>
              <span className="font-mono text-xs">⌘ K</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Show shortcuts</span>
              <span className="font-mono text-xs">?</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Navigate a row</span>
              <span className="font-mono text-xs">↑ ↓</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Open a posting</span>
              <span className="font-mono text-xs">Enter</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BoardShell>
  );
}
