"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { PageHeader } from "@/components/page-header";
import { byPriority, summarizeJobs, type JobsSummary } from "@/lib/summary";
import { daysUntil } from "@/lib/jobs";
import type { Job } from "@/lib/types";

import { useRouter } from "next/navigation";

import { CommandPalette } from "@/components/jobs/command-palette";
import { JobsCardList } from "@/components/jobs/jobs-card-list";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { JobsTable } from "@/components/jobs/jobs-table";
import {
  JobsToolbar,
  type OpportunityFilter,
  type SortBy,
} from "@/components/jobs/jobs-toolbar";
import { ProfileBar } from "@/components/jobs/profile-bar";
import { StatCards } from "@/components/jobs/stat-cards";
import { OnboardingDialog, useOnboarding } from "@/components/jobs/onboarding";
import { useProfile } from "@/hooks/use-profile";
import { applyProfile, isDefaultProfile } from "@/lib/profile";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTrackedJobs } from "@/hooks/use-tracked-jobs";

type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | Job["source"];

const PAGE_SIZE = 24;

export default function JobsPage({
  initialJobs,
  initialSummary,
}: {
  initialJobs: Job[];
  initialSummary: JobsSummary;
}) {
  // Seeded with a real first page from the server, so the first paint is
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

  const summary = loaded ? summarizeJobs(jobs) : initialSummary;

  const [search, setSearch] = React.useState("");
  // Defaults to "all" rather than "focus": with 128 company boards connected,
  // the open-and-worldwide roles are mostly full-time, and hiding them by
  // default buried the single biggest source of reachable work.
  const [opportunityFilter, setOpportunityFilter] =
    React.useState<OpportunityFilter>("all");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = React.useState<EligibilityFilter>("open");
  const [showNonSoftware, setShowNonSoftware] = React.useState(false);
  const [minFit, setMinFit] = React.useState(0);
  // Defaults to priority so the prerendered order matches the hydrated order.
  const [sortBy, setSortBy] = React.useState<SortBy>("priority");

  // Pagination is owned here, not by the table or the card list. Both render the
  // same slice so the page can be prerendered small: 4,000 postings rendered in
  // full produced a 17 MB index.html.
  const [pageIndex, setPageIndex] = React.useState(0);

  // Saved / applied / dismissed, persisted in the browser. The static site has
  // no server, so this is the application tracker.
  const tracked = useTrackedJobs();
  const { profile, toggleSkill, setSkills, setActive } = useProfile();
  const [tab, setTab] = React.useState<"all" | "saved" | "applied">("all");
  const [profileSheetOpen, setProfileSheetOpen] = React.useState(false);
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const filterKey = [
    search,
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
      const res = await fetch("/api/applications");
      if (res.ok) {
        const apps: Array<{ jobId: string | null }> = await res.json();
        const ids = new Set(apps.filter((a) => a.jobId).map((a) => a.jobId!));
        setAppliedIds(ids);
      }
    }
    loadApplied();
  }, []);

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

  const filteredJobs = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return effectiveJobs
      .filter((job) => {
        if (tracked.dismissed.has(job.id)) return false;
        if (tab === "saved" && !tracked.saved.has(job.id)) return false;
        if (
          tab === "applied" &&
          !tracked.applied.has(job.id) &&
          !appliedIds.has(job.id)
        )
          return false;
        if (!showNonSoftware && job.relevance !== "software") return false;
        if (query && !job.title.toLowerCase().includes(query) && !job.company.toLowerCase().includes(query)) {
          return false;
        }
        if (opportunityFilter === "focus" && job.evaluation.opportunity === "fulltime") {
          return false;
        }
        if (
          opportunityFilter !== "focus" &&
          opportunityFilter !== "all" &&
          job.evaluation.opportunity !== opportunityFilter
        ) {
          return false;
        }
        if (sourceFilter !== "all" && job.source !== sourceFilter) return false;
        if (eligibilityFilter === "open" && job.evaluation.eligible === "no") return false;
        if (eligibilityFilter === "no" && job.evaluation.eligible !== "no") return false;
        if (job.evaluation.fitScore !== null && job.evaluation.fitScore < minFit) return false;
        return true;
      })
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
  }, [
    effectiveJobs,
    search,
    opportunityFilter,
    sourceFilter,
    eligibilityFilter,
    showNonSoftware,
    minFit,
    sortBy,
    tab,
    tracked.saved,
    tracked.applied,
    tracked.dismissed,
    appliedIds,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedJobs = filteredJobs.slice(
    safePageIndex * PAGE_SIZE,
    safePageIndex * PAGE_SIZE + PAGE_SIZE
  );



  const handleDismiss = (id: string) => {
    tracked.dismiss(id);
  };

  const openJob = (job: Job) => {
    router.push(`/jobs/${job.id}`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setOpportunityFilter("all");
    setSourceFilter("all");
    setEligibilityFilter("open");
    setShowNonSoftware(false);
    setMinFit(0);
  };

  return (
    <>
      <PageHeader>
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          aria-label="Search jobs"
          onClick={() => setPaletteOpen(true)}
        >
          <SearchIcon />
          <span className="hidden md:inline">Search jobs</span>
          <KbdGroup className="hidden md:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-1.5 pt-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Tech internships, contracts and junior roles, read for international applicants.
          </p>
        </div>

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
        <StatCards
          summary={summary}
          jobs={jobs}
          loaded={loaded}
          onReachable={() => setEligibilityFilter("open")}
          onInternships={() => setOpportunityFilter("internship")}
          onClosingSoon={() => setSortBy("closing")}
          onBestPriority={() => setSortBy("priority")}
        />

        <ProfileBar
          profile={profile}
          onToggleSkill={toggleSkill}
          onSetSkills={setSkills}
          onSetActive={setActive}
          sheetOpen={profileSheetOpen}
          onSheetOpenChange={setProfileSheetOpen}
        />

        <OnboardingDialog
          open={showOnboarding}
          onOpenProfile={() => {
            dismissOnboarding();
            setProfileSheetOpen(true);
          }}
          onSkip={dismissOnboarding}
        />

        <div className="flex flex-col gap-4">
          <JobsToolbar
            search={search}
            onSearchChange={setSearch}
            opportunityFilter={opportunityFilter}
            onOpportunityFilterChange={setOpportunityFilter}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            eligibilityFilter={eligibilityFilter}
            onEligibilityFilterChange={setEligibilityFilter}
            showNonSoftware={showNonSoftware}
            onShowNonSoftwareChange={setShowNonSoftware}
            minFit={minFit}
            onMinFitChange={setMinFit}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList variant="line" className="max-w-full overflow-x-auto">
              <TabsTrigger value="all">
                All
                <span className="font-mono text-xs tabular-nums">
                  {filteredJobs.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved
                <span className="font-mono text-xs tabular-nums">
                  {tracked.saved.size}
                </span>
              </TabsTrigger>
              <TabsTrigger value="applied">
                Applied
                <span className="font-mono text-xs tabular-nums">
                  {tracked.applied.size + appliedIds.size}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="-mx-4 border-t border-border sm:-mx-6">
            <div className="hidden md:block">
              <JobsTable
                jobs={pagedJobs}
                loading={false}
                appliedIds={appliedIds}
                savedIds={tracked.saved}
                onToggleSaved={tracked.toggleSaved}
                onToggleApplied={(job) =>
                  tracked.applied.has(job.id) || appliedIds.has(job.id)
                    ? tracked.unmarkApplied(job.id)
                    : tracked.markApplied(job)
                }
                onRowClick={openJob}
                onDismiss={handleDismiss}
                onResetFilters={handleResetFilters}
              />
            </div>
            <div className="md:hidden">
              <JobsCardList
                jobs={pagedJobs}
                loading={false}
                appliedIds={appliedIds}
                savedIds={tracked.saved}
                onToggleSaved={tracked.toggleSaved}
                onToggleApplied={(job) =>
                  tracked.applied.has(job.id) || appliedIds.has(job.id)
                    ? tracked.unmarkApplied(job.id)
                    : tracked.markApplied(job)
                }
                emptyTitle={
                  tab === "saved"
                    ? "Nothing saved yet"
                    : tab === "applied"
                      ? "Nothing marked applied"
                      : "No jobs match"
                }
                emptyDescription={
                  tab === "saved"
                    ? "Save postings you want to come back to and they will collect here."
                    : tab === "applied"
                      ? "Mark a posting as applied to keep the list here."
                      : "Try widening the search or lowering the minimum fit score."
                }
                onRowClick={openJob}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          {loaded && (
            <JobsPagination
              pageIndex={safePageIndex}
              pageSize={PAGE_SIZE}
              total={filteredJobs.length}
              onPageChange={setPageIndex}
            />
          )}
        </div>
          </>
        )}
      </div>

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
    </>
  );
}
