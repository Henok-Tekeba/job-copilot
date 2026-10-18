"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { GapsCardList } from "@/components/gaps/gaps-card-list";
import type { Job } from "@/lib/types";

/** Opportunity types worth gap-analysing: the roles actually within reach. */
const GAP_OPPORTUNITIES = new Set(["internship", "contract", "junior"]);

export function GapsClient({
  lastUpdated,
  knownSkills = [],
}: {
  lastUpdated: string;
  knownSkills?: string[];
}) {
  const [initialJobs, setInitialJobs] = React.useState<Job[]>([]);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [showOwned, setShowOwned] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<string | null>(null);

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
        setInitialJobs(
          (Array.isArray(data) ? data : []).filter(
            (job) =>
              job.relevance === "software" &&
              GAP_OPPORTUNITIES.has(job.evaluation.opportunity) &&
              (job.evaluation.eligible === "yes" ||
                job.evaluation.eligible === "unclear")
          )
        );
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const knownSkillsSet = React.useMemo(() => new Set(knownSkills), [knownSkills]);

  const skillRows = React.useMemo(() => {
    const skillMap = new Map<string, Job[]>();

    for (const job of initialJobs) {
      for (const skill of [...job.evaluation.matched, ...job.evaluation.missing]) {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, []);
        }
        skillMap.get(skill)!.push(job);
      }
    }

    return Array.from(skillMap.entries())
      .map(([skill, jobs]) => ({
        skill,
        count: jobs.length,
        jobs,
        hasSkill: knownSkillsSet.has(skill),
      }))
      .sort((a, b) => b.count - a.count);
  }, [initialJobs, knownSkillsSet]);

  const filteredRows = React.useMemo(() => {
    return showOwned ? skillRows : skillRows.filter((r) => !r.hasSkill);
  }, [skillRows, showOwned]);

  const selectedRow = skillRows.find((r) => r.skill === selectedSkill);

  const lastUpdatedLabel = new Date(lastUpdated).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <PageHeader>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/gaps" render={<Link href="/gaps" />}>
                Gaps
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Skills</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-1 pt-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Skill Gaps
          </h1>
          <p className="text-sm text-muted-foreground">
            Based on {initialJobs.length} opportunities · Updated {lastUpdatedLabel}
          </p>
        </div>

        {loadState === "loading" ? (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : loadState === "error" ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Could not load postings</EmptyTitle>
              <EmptyDescription>
                The job snapshot did not load. Check your connection and reload.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : initialJobs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No opportunities to analyze</EmptyTitle>
              <EmptyDescription>
                Internship, contract, and junior software roles that are open or
                unclear will show up here after a collect.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Switch
                id="show-owned"
                checked={showOwned}
                onCheckedChange={setShowOwned}
                aria-label="Show skills I have"
              />
              <Label htmlFor="show-owned" className="text-sm font-medium">
                Show skills I have
              </Label>
            </div>

            <div className="rounded-lg md:border md:border-border">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Jobs asking</TableHead>
                      <TableHead>% of these jobs</TableHead>
                      <TableHead>You have it</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {showOwned
                            ? "No skills found"
                            : "No missing skills — you have them all."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => {
                        const pct = Math.round(
                          (row.count / initialJobs.length) * 100
                        );
                        return (
                          <TableRow
                            key={row.skill}
                            className="cursor-pointer"
                            onClick={() => setSelectedSkill(row.skill)}
                          >
                            <TableCell className="font-medium">{row.skill}</TableCell>
                            <TableCell className="font-mono text-sm tabular-nums">
                              {row.count}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="w-10 font-mono text-xs tabular-nums text-muted-foreground">
                                  {pct}%
                                </span>
                                <Progress value={pct} className="w-24" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.hasSkill ? (
                                <Badge variant="secondary">You have it</Badge>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden">
                <GapsCardList
                  rows={filteredRows}
                  totalJobs={initialJobs.length}
                  onSelect={setSelectedSkill}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet
        open={!!selectedSkill}
        onOpenChange={(open) => {
          if (!open) setSelectedSkill(null);
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          {selectedRow && (
            <>
              <SheetHeader className="items-start text-left">
                <SheetTitle>{selectedRow.skill}</SheetTitle>
                <SheetDescription>
                  Asked in {selectedRow.count} of these opportunities
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4 pb-4">
                {selectedRow.jobs.map((job) => (
                  <Card key={job.id} size="sm">
                    <CardContent className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company || "Unknown company"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          window.open(
                            job.applyUrl || job.sourceUrl,
                            "_blank",
                            "noopener"
                          )
                        }
                      >
                        <ExternalLinkIcon />
                        <span className="sr-only">Open posting</span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
