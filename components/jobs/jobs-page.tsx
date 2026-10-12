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
import { JobsTable } from "@/components/jobs/jobs-table";
import { JobsToolbar } from "@/components/jobs/jobs-toolbar";
import { StatCards } from "@/components/jobs/stat-cards";

type LevelFilter = "all" | "intern" | "junior" | "mid" | "senior";
type EligibilityFilter = "open" | "all" | "no";
type SourceFilter = "all" | "remoteok" | "remotive";

export default function JobsPage({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = React.useState<EligibilityFilter>("open");
  const [showNonSoftware, setShowNonSoftware] = React.useState(false);
  const [minFit, setMinFit] = React.useState(0);

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
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
        if (levelFilter !== "all" && job.evaluation.level !== levelFilter) return false;
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
  }, [jobs, search, levelFilter, sourceFilter, eligibilityFilter, showNonSoftware, minFit]);

  const softwareCount = jobs.filter((j) => j.relevance === "software").length;
  const openCount = jobs.filter((j) => j.evaluation.eligible === "yes").length;

  const handleMarkApplied = (id: string) => {
    setAppliedIds((prev) => new Set(prev).add(id));
  };

  const handleDismiss = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setSelectedJob((current) => (current?.id === id ? null : current));
  };

  const handleResetFilters = () => {
    setSearch("");
    setLevelFilter("all");
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
      <header className="flex h-14 items-center gap-3 border-b border-white/10 px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <Breadcrumb>
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
          className="ml-auto mr-6"
          onClick={() => setPaletteOpen(true)}
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search jobs</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
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
            levelFilter={levelFilter}
            onLevelFilterChange={setLevelFilter}
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
