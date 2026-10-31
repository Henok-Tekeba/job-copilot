"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookmarkIcon,
  CheckIcon,
  ExternalLink,
  Trash,
} from "lucide-react";
import { format } from "date-fns";

import { CompanyAvatar } from "@/components/company-avatar";
import {
  DeadlineBadge,
  NewBadge,
  RedFlagBadge,
} from "@/components/jobs/deadline-badge";
import { EligibilityPanel } from "@/components/jobs/eligibility-panel";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";
import { useProfile } from "@/hooks/use-profile";
import { useTrackedJobs } from "@/hooks/use-tracked-jobs";
import { stripHtml } from "@/lib/jobs";
import {
  cap,
  opportunityLabel,
  workplaceLabel as workplaceWord,
} from "@/lib/labels";
import { applyProfile, isDefaultProfile } from "@/lib/profile";
import { isUnstatedLocation } from "@/lib/regions";
import type { Job } from "@/lib/types";
import { ENGINE_STYLE } from "@/lib/verdict-style";
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
 * The posting as its own sheet: title, evidence, fit, body, and the actions
 * that matter. The verdict is the spine; everything else supports it.
 */
export function JobDetailPage({
  job,
  verdict,
}: {
  job: Job;
  verdict?: EngineVerdict;
}) {
  const router = useRouter();
  const tracked = useTrackedJobs();
  const { profile } = useProfile();
  const activeProfile = !isDefaultProfile(profile);

  const jobForView = React.useMemo(
    () =>
      isDefaultProfile(profile) ? job : applyProfile(job, profile.skills),
    [job, profile],
  );

  const applied = tracked.isApplied(job.id);
  const saved = tracked.saved.has(job.id);

  const fit = jobForView.evaluation.fit;
  const plainDescription = stripHtml(job.description);

  const locationLabel = isUnstatedLocation(job.location) ? "" : job.location;
  const workplaceLabel = workplaceWord(job.evaluation.eligibility?.workplace);

  return (
    <main className="sl-landing min-h-dvh bg-white text-[#0b0b0d]">
      <SiteHeader cta={{ href: "/skills", label: "Get matched" }} />

      <SiteShell>
        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] pt-[clamp(24px,3.2vw,44px)] pb-[clamp(26px,3.4vw,48px)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/jobs"
              className="sl-text-link inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              All internships
            </Link>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9.5px] tracking-[0.05em] text-[#9a9a9a] uppercase transition-colors hover:text-[#0b0b0d]"
            >
              {job.attribution}
            </a>
          </div>

          <div className="mt-[clamp(18px,2.4vw,34px)]">
            <SiteLabel>
              {opportunityLabel(job.evaluation.opportunity)}
              {workplaceLabel ? ` · ${workplaceLabel}` : ""}
            </SiteLabel>
            <h1 className="sl-display-sm mt-[clamp(16px,2vw,28px)] max-w-[22ch]">
              {job.title}
            </h1>

            <div className="mt-[clamp(16px,1.8vw,26px)] flex flex-wrap items-center gap-x-4 gap-y-3 text-[12px] text-[#77777d]">
              <span className="inline-flex items-center gap-2">
                <CompanyAvatar
                  job={job}
                  className="size-7 rounded-none border border-[#ececec] bg-[#fbfbfb]"
                />
                <span className="text-[#0b0b0d]">{job.company}</span>
              </span>
              {locationLabel ? <span>{locationLabel}</span> : null}
              {job.postedAt ? (
                <span>Posted {format(new Date(job.postedAt), "MMM d")}</span>
              ) : null}
              <DeadlineBadge deadline={job.deadline} />
              <NewBadge postedAt={job.postedAt} />
              <RedFlagBadge flags={job.evaluation.redFlags} />
            </div>
          </div>
        </section>

        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(28px,4vw,58px)]">
          <div className="grid gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="order-2 min-w-0 border-t border-[#14141a] lg:order-1">
              <section className="border-b border-[#ececec] py-[clamp(22px,2.6vw,34px)]">
                <SectionTitle>Will they take you?</SectionTitle>
                {verdict ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.06em] text-[#548bff] uppercase">
                      <span className="size-1.5 bg-[#548bff]" />
                      {ENGINE_STYLE[verdict.status].label}
                    </span>
                    {verdict.reasons.slice(0, 3).map((reason, i) => (
                      <p
                        key={i}
                        className="text-[13.5px] leading-[1.7] text-[#5f5f65]"
                      >
                        {reason.summary}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EligibilityPanel eligibility={job.evaluation.eligibility} />
                  </div>
                )}
                {job.evaluation.deadlineEvidence ? (
                  <p className="mt-3 font-mono text-[10px] leading-[1.5] text-[#9a9a9a]">
                    Deadline read from the posting:{" "}
                    {job.evaluation.deadlineEvidence}
                  </p>
                ) : null}
              </section>

              <section className="border-b border-[#ececec] py-[clamp(22px,2.6vw,34px)]">
                <SectionTitle>Match</SectionTitle>
                {fit && fit.score !== null ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-end gap-3">
                      <span className="font-satoshi text-[clamp(2.8rem,4.6vw,4rem)] leading-none font-medium tracking-[-0.05em] text-[#548bff] tabular-nums">
                        {fit.priority}
                      </span>
                      <span className="pb-1 font-mono text-[10px] tracking-[0.04em] text-[#77777d] uppercase">
                        Priority — {fit.score} skill fit
                      </span>
                    </div>
                    <p className="max-w-[34rem] text-[12.5px] leading-[1.6] text-[#8f8f94]">
                      {fit.reasons.join(" · ")}
                    </p>
                    {fit.requiredMissing.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {fit.requiredMissing.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="border border-dashed border-[#d9d9d9] px-2.5 py-1.5 font-mono text-[10px] text-[#5f5f65]"
                          >
                            {skill}
                          </span>
                        ))}
                        {fit.requiredMissing.length > 4 ? (
                          <span className="font-mono text-[10px] text-[#9a9a9a]">
                            +{fit.requiredMissing.length - 4} more to learn
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-[#8f8f94]">
                    Not enough skills detected to score this posting.
                  </p>
                )}
              </section>

              <section className="py-[clamp(22px,2.6vw,34px)]">
                <SectionTitle>The posting</SectionTitle>
                {plainDescription ? (
                  <p className="mt-4 line-clamp-6 max-w-[68ch] text-[13.5px] leading-[1.75] whitespace-pre-wrap text-[#5f5f65]">
                    {plainDescription.slice(0, 900)}
                  </p>
                ) : (
                  <p className="mt-4 text-[13px] text-[#8f8f94]">
                    No description in the snapshot.
                  </p>
                )}
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-text-link mt-5 inline-flex items-center gap-1.5"
                >
                  Read the full posting
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </a>
              </section>
            </div>

            <aside className="order-1 h-fit lg:order-2 lg:sticky lg:top-6">
              <div className="border border-[#ececec] bg-white p-5">
                <SiteLabel>Apply</SiteLabel>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      job.applyUrl || job.sourceUrl,
                      "_blank",
                      "noopener",
                    )
                  }
                  className="sl-primary-btn mt-4 h-11 w-full min-h-11"
                >
                  Apply on the company site
                  <ExternalLink className="size-[1.05em]" strokeWidth={1.5} />
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => tracked.toggleSaved(job.id)}
                    className="sl-secondary-btn h-11 min-h-11 w-full"
                  >
                    <BookmarkIcon
                      className={`size-[0.95em] ${saved ? "fill-[#548bff] text-[#548bff]" : ""}`}
                    />
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={applied}
                    onClick={() => tracked.markApplied(job)}
                    className="sl-secondary-btn h-11 min-h-11 w-full disabled:opacity-50"
                  >
                    <CheckIcon className="size-[0.95em]" />
                    {applied ? "Applied" : "Applied?"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    tracked.dismiss(job.id);
                    router.push("/jobs");
                  }}
                  className="sl-text-link mt-4 inline-flex items-center gap-1.5"
                >
                  <Trash className="size-3.5" strokeWidth={1.5} />
                  Dismiss
                </button>
              </div>

              <div className="mt-6 hidden border-t border-[#ececec] pt-5 lg:block">
                <SiteLabel>The posting</SiteLabel>
                <div className="mt-3 flex flex-col">
                  <MetaRow label="Company">{job.company}</MetaRow>
                  <MetaRow label="Source">{cap(job.source)}</MetaRow>
                  <MetaRow label="Location">
                    {locationLabel || "Not stated"}
                  </MetaRow>
                  {job.postedAt ? (
                    <MetaRow label="Posted">
                      {format(new Date(job.postedAt), "MMM d, yyyy")}
                    </MetaRow>
                  ) : null}
                </div>
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-text-link mt-4 inline-flex items-center gap-1.5"
                >
                  Open the original
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </a>
              </div>

              {activeProfile ? (
                <p className="mt-6 font-mono text-[10px] leading-[1.6] text-[#9a9a9a]">
                  Fit shown for your profile ({profile.skills.length} skills).
                </p>
              ) : null}
            </aside>
          </div>
        </section>

        <SiteFooter />
      </SiteShell>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-satoshi text-[clamp(1.1rem,1.45vw,1.45rem)] leading-[1.2] font-medium tracking-[-0.025em] text-[#050506]">
      {children}
    </h2>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#ececec] py-2.5 text-[12px]">
      <span className="font-mono text-[9.5px] tracking-[0.04em] text-[#8f8f94] uppercase">
        {label}
      </span>
      <span className="truncate text-right text-[#3a3a3a]">{children}</span>
    </div>
  );
}
