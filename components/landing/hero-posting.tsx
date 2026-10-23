import { format } from "date-fns";

import { CompanyAvatar } from "@/components/company-avatar";
import { opportunityLabel, workplaceLabel } from "@/lib/labels";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Job } from "@/lib/types";

/**
 * The hero's signature object: a real posting from the board, with its
 * disqualifying line caught under the highlighter and the verdict stated in
 * plain ink. This is the product's most characteristic object, so it opens
 * the page instead of sitting three sections down.
 */
export function HeroPosting({ job }: { job: Job }) {
  const eligibility = job.evaluation.eligibility;
  const verdict = eligibility?.verdict ?? "unknown";
  const evidence = eligibility?.evidence.find((item) => item.value)?.value;
  const summary = eligibility?.summary ?? "Reach unclear from the posting text.";

  // Highlight the exact phrase the verdict came from, when it appears in the
  // summary sentence; otherwise leave the sentence unmarked.
  const [before, after] = evidence
    ? (() => {
        const at = summary.toLowerCase().indexOf(evidence.toLowerCase());
        return at >= 0
          ? [summary.slice(0, at), summary.slice(at + evidence.length)]
          : [summary, ""];
      })()
    : [summary, ""];

  return (
    <div className="relative">
      <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-[0_32px_80px_-40px_rgba(15,15,30,0.35)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#6f6f78]">
            <span className="size-1.5 rounded-full bg-[#2b4bf2]" />
            Read by the engine
          </span>
          <span className="text-[11px] text-[#6f6f78]">
            {job.postedAt ? `Posted ${format(new Date(job.postedAt), "MMM d")}` : "Live now"}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <CompanyAvatar job={job} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-[12px] text-[#6f6f78]">
              {job.company || "Unknown company"}
            </p>
            <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-[#14141a]">
              {job.title}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13.5px] leading-[1.75] text-[#5c5c64]">
          {before}
          {evidence && after ? (
            <mark className="hl hl-on font-medium text-[#14141a]">{evidence}</mark>
          ) : null}
          {after}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {[opportunityLabel(job.evaluation.opportunity), workplaceLabel(eligibility?.workplace)]
            .filter(Boolean)
            .map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-[#f4f4f6] px-2 py-1 text-[10.5px] font-medium text-[#5c5c64]"
              >
                {chip}
              </span>
            ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-[#14141a]">
            <span className="size-1.5 rounded-full bg-[#14141a]" />
            {VERDICT_STYLE[verdict].label}
          </span>
        </div>
      </div>

      <p className="mt-3 pl-1 text-[11px] text-[#6f6f78]">
        One of the postings on the board — every line checked against its own
        text.
      </p>
    </div>
  );
}
