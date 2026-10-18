"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CheckIcon,
  ExternalLink,
  Trash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  DeadlineBadge,
  NewBadge,
  RedFlagBadge,
} from "@/components/jobs/deadline-badge";
import { EligibilityPanel } from "@/components/jobs/eligibility-panel";
import { useTrackedJobs } from "@/hooks/use-tracked-jobs";
import { useProfile } from "@/hooks/use-profile";
import { applyProfile, isDefaultProfile } from "@/lib/profile";
import { isUnstatedLocation } from "@/lib/regions";
import { stripHtml } from "@/lib/jobs";
import type { Job } from "@/lib/types";

/**
 * The posting, as its own page.
 *
 * A side sheet made every posting feel like an afterthought. This is the thing
 * the whole site is about, so it gets the whole page: title, the eligibility
 * reasoning, the fit breakdown, and the posting body, with triage actions that
 * survive reloads.
 */
export function JobDetailPage({ job }: { job: Job }) {
  const router = useRouter();
  const tracked = useTrackedJobs();
  const { profile } = useProfile();
  const activeProfile = !isDefaultProfile(profile);

  const jobForView = React.useMemo(
    () => (isDefaultProfile(profile) ? job : applyProfile(job, profile.skills)),
    [job, profile]
  );

  const applied = tracked.isApplied(job.id);
  const saved = tracked.saved.has(job.id);
  const notes = tracked.jobNotesFor(job.id);

  const fit = jobForView.evaluation.fit;
  const plainDescription = stripHtml(job.description);
  const locationLabel = isUnstatedLocation(job.location) ? "" : job.location;

  return (
    <>
      <PageHeader>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/jobs" />}
          className="-ml-1"
        >
          <ArrowLeftIcon />
          All jobs
        </Button>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-2xl font-semibold leading-snug tracking-tight text-balance">
            {job.title}
          </h1>

          <p className="text-sm text-muted-foreground">
            {[job.company || "Unknown company", locationLabel]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{job.evaluation.opportunity}</span>
            {job.deadline && <DeadlineBadge deadline={job.deadline} />}
            {job.salary && <span className="font-mono">{job.salary}</span>}
            <NewBadge postedAt={job.postedAt} />
            <RedFlagBadge flags={job.evaluation.redFlags} />
          </div>

          {activeProfile && (
            <p className="text-xs text-muted-foreground">
              Fit shown for your profile ({profile.skills.length} skills).
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                window.open(job.applyUrl || job.sourceUrl, "_blank", "noopener")
              }
            >
              <ExternalLink />
              Open posting
            </Button>
            <Button
              variant={saved ? "secondary" : "outline"}
              onClick={() => tracked.toggleSaved(job.id)}
            >
              <BookmarkIcon />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant={applied ? "secondary" : "outline"}
              disabled={applied}
              onClick={() => tracked.markApplied(job)}
            >
              <CheckIcon />
              {applied ? "Applied" : "Mark applied"}
            </Button>
            <Button
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={() => {
                tracked.dismiss(job.id);
                router.push("/jobs");
              }}
            >
              <Trash />
              Dismiss
            </Button>
          </div>
        </div>

        <EligibilityPanel eligibility={job.evaluation.eligibility} />

        {job.evaluation.deadlineEvidence && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Deadline read from the posting
            </span>
            <p className="text-xs">{job.evaluation.deadlineEvidence}</p>
          </div>
        )}

        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Match
          </h2>
          {fit && fit.score !== null ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-3">
                <span className="font-mono text-5xl leading-none font-semibold tracking-tight tabular-nums">
                  {fit.priority}
                </span>
                <span className="pb-1 text-xs text-muted-foreground">
                  priority · {fit.score} skill fit
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {fit.reasons.join(" · ")}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Not enough skills detected
            </span>
          )}

          {fit?.basis === "required" && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-medium text-muted-foreground">
                Required — you lack
              </span>
              <div className="flex flex-wrap gap-1">
                {fit.requiredMissing.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Nothing — you meet every requirement.
                  </span>
                ) : (
                  fit.requiredMissing.map((skill) => (
                    <Badge key={skill} variant="outline" className="border-dashed">
                      {skill}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}

          {fit && fit.niceMissing.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-medium text-muted-foreground">
                Nice to have — you lack
              </span>
              <div className="flex flex-wrap gap-1">
                {fit.niceMissing.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-medium text-muted-foreground">
              You have
            </span>
            <div className="flex flex-wrap gap-1">
              {jobForView.evaluation.matched.length === 0 ? (
                <span className="text-sm text-muted-foreground">None</span>
              ) : (
                jobForView.evaluation.matched.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Posting
          </h2>
          <ScrollArea className="h-[55vh] rounded-lg border border-border p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {plainDescription || "No description in the snapshot."}
            </p>
          </ScrollArea>
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Notes
          </h2>
          <Textarea
            placeholder="Notes for this posting…"
            value={notes}
            onChange={(e) => tracked.setJobNotes(job.id, e.target.value)}
            className="min-h-40"
          />
          <p className="text-xs text-muted-foreground">
            Notes are saved in this browser and survive reloads.
          </p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {job.attribution}
          </a>
          {job.postedAt && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              posted {job.postedAt.slice(0, 10)}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
