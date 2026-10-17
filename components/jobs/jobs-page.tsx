"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { PageHeader } from "@/components/page-header";
import { daysUntil } from "@/lib/jobs";
import type { Job } from "@/lib/types";

import { CommandPalette } from "@/components/jobs/command-palette";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import { JobsCardList } from "@/components/jobs/jobs-card-list";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { JobsTable } from "@/components/jobs/jobs-table";
import {
  JobsToolbar,
  type OpportunityFilter,
  type SortBy,
} from "@/components/jobs/jobs-toolbar";
import { StatCards } from "@/components/jobs/stat-cards";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | Job["source"];

const PAGE_SIZE = 24;

type LoadState = "loading" | "ready" | "error";

export default function JobsPage() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
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
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const loading = loadState === "loading";

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

  const filterKey = [
    search,
    opportunityFilter,
    sourceFilter,
    eligibilityFilter,
    showNonSoftware,
    minFit,
    sortBy,
  ].join("|");
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPageIndex(0);
  }

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [paletteOpen, setPaletteOpen] = React.useState(false);

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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredJobs = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs
      .filter((job) => {
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
        const aPriority = a.evaluation.fit?.priority ?? a.evaluation.fitScore ?? 0;
        const bPriority = b.evaluation.fit?.priority ?? b.evaluation.fitScore ?? 0;
        return bPriority - aPriority;
      });
  }, [
    jobs,
    search,
    opportunityFilter,
    sourceFilter,
    eligibilityFilter,
    showNonSoftware,
    minFit,
    sortBy,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedJobs = filteredJobs.slice(
    safePageIndex * PAGE_SIZE,
    safePageIndex * PAGE_SIZE + PAGE_SIZE
  );

  const softwareCount = jobs.filter((j) => j.relevance === "software").length;
  const openCount = jobs.filter((j) => j.evaluation.eligible === "yes").length;

  const handleMarkApplied = async (job: Job) => {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: job.title,
        company: job.company,
        url: job.applyUrl || job.sourceUrl,
        appliedAt: new Date().toISOString().slice(0, 10),
        notes: "",
      }),
    });
      if (res.ok) {
      await res.json();
      setAppliedIds((prev) => new Set(prev).add(job.id));
    }
  };

  const handleDismiss = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setSelectedJob((current) => (current?.id === id ? null : current));
  };

  const handleResetFilters = () => {
    setSearch("");
    setOpportunityFilter("all");
    setSourceFilter("all");
    setEligibilityFilter("open");
    setShowNonSoftware(false);
    setMinFit(0);
  };

  const handleNotesChange = (value: string) => {
    if (!selectedJob) return;
    setNotes((prev) => ({ ...prev, [selectedJob.id]: value }));
  };

  return (
    <>
      <PageHeader>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" render={<Link href="/" />}>
                Jobs
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>All</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
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
        <div className="flex flex-col gap-1 pt-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {loadState === "ready"
              ? `${softwareCount} software jobs, ${openCount} open to you`
              : "Loading postings…"}
          </p>
        </div>

        {loadState === "error" ? (
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
                  setLoadState("loading");
                  setReloadToken((n) => n + 1);
                }}
              >
                Retry
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
        <StatCards jobs={jobs} />

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

          <div className="rounded-lg md:border md:border-border">
            <div className="hidden md:block">
              <JobsTable
                jobs={pagedJobs}
                loading={loading}
                appliedIds={appliedIds}
                onRowClick={setSelectedJob}
                onMarkApplied={handleMarkApplied}
                onDismiss={handleDismiss}
                onResetFilters={handleResetFilters}
              />
            </div>
            <div className="md:hidden">
              <JobsCardList
                jobs={pagedJobs}
                loading={loading}
                appliedIds={appliedIds}
                onRowClick={setSelectedJob}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          <JobsPagination
            pageIndex={safePageIndex}
            pageSize={PAGE_SIZE}
            total={filteredJobs.length}
            onPageChange={setPageIndex}
          />
        </div>
          </>
        )}
      </div>

      <JobDetailSheet
        job={selectedJob}
        applied={selectedJob ? appliedIds.has(selectedJob.id) : false}
        notes={selectedJob ? (notes[selectedJob.id] ?? "") : ""}
        onNotesChange={handleNotesChange}
        onMarkApplied={handleMarkApplied}
        onDismiss={handleDismiss}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />

      <CommandPalette
        jobs={jobs}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={setSelectedJob}
      />
    </>
  );
}
