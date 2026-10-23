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
import { CompanyAvatar } from "@/components/company-avatar";
import { format } from "date-fns";
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
import { ENGINE_STYLE } from "@/lib/verdict-style";
import { workplaceLabel as workplaceWord, opportunityLabel, cap } from "@/lib/labels";
import type { Job } from "@/lib/types";
import type { VerdictStatus } from "@/engine/verdict";

type EngineVerdict = {
  status: VerdictStatus;
  confidence: number;
  reasons: Array<{
    source: string;
    summary: string;
    quote?: string;
    record?: { source: string; dataYear: string; detail: string };
  }>;
};

export type { EngineVerdict };

/**
 * The posting, as its own page.
 *
 * A side sheet made every posting feel like an afterthought. This is the thing
 * the whole site is about, so it gets the whole page: title, the eligibility
 * reasoning, the fit breakdown, and the posting body, with triage actions that
 * survive reloads.
 */
export function JobDetailPage({ job, verdict }: { job: Job; verdict?: EngineVerdict }) {
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

  const fit = jobForView.evaluation.fit;
  const plainDescription = stripHtml(job.description);

  const locationLabel = isUnstatedLocation(job.location) ? "" : job.location;
  const workplaceLabel = workplaceWord(job.evaluation.eligibility?.workplace);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-6 sm:px-8">
      <div className="flex h-auto max-h-none w-full max-w-[1060px] flex-col rounded-[28px] border border-[#ececf0] bg-white shadow-[0_24px_64px_-28px_rgba(15,15,30,0.25)] lg:h-[min(760px,calc(100dvh-3rem))]">
        {/* Card top bar */}
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/jobs" />}
            className="rounded-full bg-white text-[#5c5c64] shadow-none"
          >
            <ArrowLeftIcon />
            All internships
          </Button>
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-[11px] text-[#6f6f78] hover:underline"
          >
            {job.attribution}
          </a>
        </div>

        <div className="grid min-h-0 flex-1 gap-10 overflow-hidden px-6 pt-6 pb-8 sm:px-10 sm:pt-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="order-2 flex min-h-0 min-w-0 flex-col lg:order-1 lg:overflow-hidden">
            <div className="flex flex-col gap-6 pb-2">
              <h1 className="text-[clamp(1.7rem,3.4vw,2.3rem)] font-medium leading-[1.12] tracking-[-0.03em] text-balance text-[#14141a]">
                {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6f6f78]">
                <span>{opportunityLabel(job.evaluation.opportunity)}</span>
                {workplaceLabel && <span>· {workplaceLabel}</span>}
                {job.deadline && <DeadlineBadge deadline={job.deadline} />}
                {job.salary && <span>{job.salary}</span>}
                <NewBadge postedAt={job.postedAt} />
                <RedFlagBadge flags={job.evaluation.redFlags} />
              </div>
            </div>

            {/* Verdict */}
            <section className="flex flex-col gap-2">
              <SectionTitle>Will they take you?</SectionTitle>
              {verdict ? (
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-[#14141a]">
                    <span className="size-1.5 rounded-full bg-[#14141a]" />
                    {ENGINE_STYLE[verdict.status].label}
                  </span>
                  {verdict.reasons.slice(0, 3).map((reason, i) => (
                    <p key={i} className="text-[13px] leading-relaxed text-[#5c5c64]">
                      {reason.summary}
                    </p>
                  ))}
                </div>
              ) : (
                <EligibilityPanel eligibility={job.evaluation.eligibility} />
              )}
              {job.evaluation.deadlineEvidence && (
                <p className="text-[12px] text-[#6f6f78]">
                  Deadline read from the posting: {job.evaluation.deadlineEvidence}
                </p>
              )}
            </section>

            {/* Match */}
            <section className="flex flex-col gap-2 border-t border-[#e9e9ee] pt-5">
              <SectionTitle>Match</SectionTitle>
              {fit && fit.score !== null ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-3">
                    <span className="text-[40px] leading-none font-semibold tracking-tight text-[#14141a] tabular-nums">
                      {fit.priority}
                    </span>
                    <span className="pb-1 text-[12px] text-[#6f6f78]">
                      Priority — {fit.score} skill fit
                    </span>
                  </div>
                  <p className="truncate text-[12px] text-[#6f6f78]">{fit.reasons.join(" · ")}</p>
                  {fit.requiredMissing.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {fit.requiredMissing.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="outline" className="border-dashed">
                          {skill}
                        </Badge>
                      ))}
                      {fit.requiredMissing.length > 4 && (
                        <span className="text-[11px] text-[#6f6f78]">
                          +{fit.requiredMissing.length - 4} more to learn
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[13px] text-[#6f6f78]">Not enough skills detected</span>
              )}
            </section>

            {/* Posting */}
            <section className="flex flex-col gap-2 border-t border-[#e9e9ee] pt-5">
              <SectionTitle>The posting</SectionTitle>
              {plainDescription ? (
                <p className="line-clamp-6 text-[13px] leading-relaxed text-[#5c5c64] whitespace-pre-wrap">
                  {plainDescription.slice(0, 900)}
                </p>
              ) : (
                <p className="text-[13px] leading-relaxed text-[#6f6f78]">
                  No description in the snapshot.
                </p>
              )}
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-medium text-[#2b4bf2] hover:underline"
              >
                Read the full posting →
              </a>
            </section>

          </div>

          {/* Side column */}
          <div className="order-1 flex flex-col gap-6 lg:order-2 lg:overflow-y-auto lg:pr-1">
            <div className="flex items-center gap-3">
              <CompanyAvatar job={job} className="size-11" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#14141a]">
                  {job.company || "Unknown company"}
                </p>
                <p className="truncate text-[12px] text-[#6f6f78]">
                  {locationLabel || "Location not stated"}
                </p>
              </div>
            </div>

            <MetaRow label="Source">{cap(job.source)}</MetaRow>
            {job.postedAt && (
              <MetaRow label="Posted">
                {format(new Date(job.postedAt), "MMM d, yyyy")}
              </MetaRow>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={() =>
                  window.open(job.applyUrl || job.sourceUrl, "_blank", "noopener")
                }
                className="h-11 rounded-xl text-[14px]"
              >
                <ExternalLink />
                Apply on the company site
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={saved ? "secondary" : "outline"}
                  onClick={() => tracked.toggleSaved(job.id)}
                  className="rounded-xl text-[13px]"
                >
                  <BookmarkIcon />
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant={applied ? "secondary" : "outline"}
                  disabled={applied}
                  onClick={() => tracked.markApplied(job)}
                  className="rounded-xl text-[13px]"
                >
                  <CheckIcon />
                  {applied ? "Applied" : "Applied?"}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  tracked.dismiss(job.id);
                  router.push("/jobs");
                }}
                className="justify-start rounded-xl text-[13px] text-[#6f6f78] hover:text-[#14141a]"
              >
                <Trash />
                Dismiss
              </Button>
            </div>

            {activeProfile && (
              <p className="text-[11px] text-[#6f6f78]">
                Fit shown for your profile ({profile.skills.length} skills).
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#14141a]">
      {children}
    </h2>
  );
}


function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e9e9ee] pb-2 text-[13px]">
      <span className="text-[#6f6f78]">{label}</span>
      <span className="truncate text-right text-[#14141a]">{children}</span>
    </div>
  );
}
