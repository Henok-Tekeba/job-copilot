import Link from "next/link";
import { format } from "date-fns";

import { CompanyAvatar } from "@/components/company-avatar";
import { opportunityLabel, workplaceLabel } from "@/lib/labels";
import { isUnstatedLocation } from "@/lib/regions";
import type { Job } from "@/lib/types";

function deadlineText(job: Job) {
  return job.deadline
    ? `Apply by ${format(new Date(job.deadline), "MMM d")}`
    : "Rolling deadline";
}

function place(job: Job) {
  return isUnstatedLocation(job.location) ? "" : job.location;
}

/**
 * The freshest postings, set like a front page: one lead posting at headline
 * scale with the engine's caught line, then three briefs in ruled columns.
 * No cards here — the type and the rules carry the hierarchy.
 */
export function LatestInternships({
  recent,
  total,
}: {
  recent: Job[];
  total: number;
}) {
  const [lead, ...rest] = recent;
  if (!lead) return null;

  return (
    <section className="mx-auto w-full max-w-[1080px] px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="flex items-end justify-between gap-4 border-t border-[#14141a] pt-4">
        <p className="text-[13px] font-medium text-[#14141a]">Latest internships</p>
        <Link
          href="/jobs"
          className="text-[12px] font-medium text-[#5c5c64] transition-colors hover:text-[#14141a]"
        >
          Browse all {total.toLocaleString("en-US")}
        </Link>
      </div>

      <LeadPosting job={lead} />

      {rest.length > 0 && (
        <div className="mt-10 grid gap-x-10 border-t border-[#e9e9ee] sm:mt-14 sm:grid-cols-3 sm:divide-x sm:divide-[#e9e9ee] sm:border-t-0">
          {rest.map((job) => (
            <BriefPosting key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

function LeadPosting({ job }: { job: Job }) {
  const eligibility = job.evaluation.eligibility;
  const evidence = eligibility?.evidence.find((item) => item.value)?.value;
  const summary = eligibility?.summary ?? "";

  const [before, after] = evidence
    ? (() => {
        const at = summary.toLowerCase().indexOf(evidence.toLowerCase());
        return at >= 0
          ? [summary.slice(0, at), summary.slice(at + evidence.length)]
          : [summary, ""];
      })()
    : [summary, ""];

  const meta = [opportunityLabel(job.evaluation.opportunity), workplaceLabel(eligibility?.workplace)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/jobs/${job.id}`} className="group mt-8 block max-w-[780px] sm:mt-10">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#6f6f78]">
        <CompanyAvatar job={job} className="size-7" />
        <span className="font-medium text-[#14141a]">
          {job.company || "Unknown company"}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Posted{" "}
          {job.postedAt ? format(new Date(job.postedAt), "MMM d") : "recently"}
        </span>
      </div>

      <h3 className="mt-4 text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.035em] text-[#14141a]">
        {job.title}
      </h3>

      {summary ? (
        <p className="mt-4 max-w-[560px] text-[14px] leading-[1.8] text-[#5c5c64]">
          {before}
          {evidence && after ? (
            <mark className="hl hl-on font-medium text-[#14141a]">{evidence}</mark>
          ) : null}
          {after}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px]">
        {meta ? <span className="text-[#5c5c64]">{meta}</span> : null}
        <span className="text-[#14141a] tabular-nums">{deadlineText(job)}</span>
        {place(job) ? <span className="text-[#6f6f78]">{place(job)}</span> : null}
        <span className="font-medium text-[#2b4bf2] sm:ml-2">Read the posting</span>
      </div>
    </Link>
  );
}

function BriefPosting({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex flex-col gap-2 border-t border-[#e9e9ee] py-5 sm:border-t-0 sm:px-6 sm:first:pl-0 sm:first:pr-6 sm:last:pr-0"
    >
      <div className="flex items-center gap-2">
        <CompanyAvatar job={job} className="size-6" />
        <span className="truncate text-[11px] text-[#6f6f78]">
          {job.company || "Unknown company"}
        </span>
      </div>
      <p className="line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em] text-[#14141a]">
        {job.title}
      </p>
      <p className="text-[11px] text-[#6f6f78] tabular-nums">
        {deadlineText(job)}
        {place(job) ? ` · ${place(job)}` : ""}
      </p>
    </Link>
  );
}
