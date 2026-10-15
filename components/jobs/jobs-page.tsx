"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Job } from "@/lib/types";

import { CommandPalette } from "@/components/jobs/command-palette";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import { JobsCardList } from "@/components/jobs/jobs-card-list";
import { JobsTable } from "@/components/jobs/jobs-table";
import { JobsToolbar, type OpportunityFilter } from "@/components/jobs/jobs-toolbar";
import { StatCards } from "@/components/jobs/stat-cards";

type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | "remoteok" | "remotive" | "hackernews" | "manual";

export default function JobsPage({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [loading] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [opportunityFilter, setOpportunityFilter] =
    React.useState<OpportunityFilter>("focus");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = React.useState<EligibilityFilter>("open");
  const [showNonSoftware, setShowNonSoftware] = React.useState(false);
  const [minFit, setMinFit] = React.useState(0);

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
        const aYes = a.evaluation.eligible === "yes" ? 0 : 1;
        const bYes = b.evaluation.eligible === "yes" ? 0 : 1;
        if (aYes !== bYes) return aYes - bYes;
        const aFit = a.evaluation.fitScore ?? -1;
        const bFit = b.evaluation.fitScore ?? -1;
        return bFit - aFit;
      });
  }, [jobs, search, opportunityFilter, sourceFilter, eligibilityFilter, showNonSoftware, minFit]);

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
    setOpportunityFilter("focus");
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
      <header className="flex h-14 items-center gap-3 border-b border-white/10 px-4 sm:px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="hidden h-6 md:block" />
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
          className="ml-auto sm:mr-0"
          onClick={() => setPaletteOpen(true)}
        >
          <SearchIcon />
          <span className="hidden md:inline">Search jobs</span>
          <KbdGroup className="hidden md:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1 pt-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {softwareCount} software jobs, {openCount} open to you
          </p>
        </div>

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
          />

          <div className="rounded-lg border border-white/10">
            <div className="hidden md:block">
              <JobsTable
                jobs={filteredJobs}
                loading={loading}
                appliedIds={appliedIds}
                onRowClick={setSelectedJob}
                onMarkApplied={handleMarkApplied}
                onDismiss={handleDismiss}
                onResetFilters={handleResetFilters}
              />
            </div>
            <JobsCardList
              jobs={filteredJobs}
              loading={loading}
              appliedIds={appliedIds}
              onRowClick={setSelectedJob}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </main>

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
