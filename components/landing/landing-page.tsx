import Link from "next/link";
import { format } from "date-fns";

import { LogoMark } from "@/components/logo-mark";
import { RecentCarousel } from "@/components/landing/recent-carousel";
import { LandingSearch } from "@/components/landing/landing-search";
import { CompanyAvatar } from "@/components/company-avatar";
import { opportunityLabel, workplaceLabel } from "@/lib/labels";
import { isUnstatedLocation } from "@/lib/regions";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Job } from "@/lib/types";

const CATEGORIES = [
  { label: "Open to you", tint: "bg-emerald-100 text-emerald-700" },
  { label: "Needs relocation", tint: "bg-sky-100 text-sky-700" },
  { label: "Region locked", tint: "bg-red-100 text-red-700" },
  { label: "Reach unclear", tint: "bg-amber-100 text-amber-700" },
] as const;

type Counts = {
  open: number;
  relocation: number;
  regionLocked: number;
  unclear: number;
};

/** No motion on cards: stillness is the brand. Hover only ever changes text colour. */
function RecentCard({ job, featured }: { job: Job; featured: boolean }) {
  const verdict = job.evaluation.eligibility?.verdict ?? "unknown";
  const posted = job.postedAt ? format(new Date(job.postedAt), "MMM d") : "recent";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={
        featured
          ? "flex h-full min-h-[230px] flex-col rounded-2xl border border-[#2b4bf2]/45 bg-white p-5 shadow-[0_18px_40px_-26px_rgba(43,75,242,0.5)]"
          : "flex h-full min-h-[230px] flex-col rounded-2xl border border-[#ececf0] bg-white p-5 shadow-[0_14px_36px_-26px_rgba(15,15,30,0.2)]"
      }
    >
      <div className="flex items-center gap-2">
        <span className={`size-2 shrink-0 rounded-full ${VERDICT_STYLE[verdict].dot}`} />
        <span className={`text-[11px] font-medium ${VERDICT_STYLE[verdict].text}`}>
          {VERDICT_STYLE[verdict].label}
        </span>
      </div>

      <h3 className="mt-2 line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em] text-[#14141a]">
        {job.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[opportunityLabel(job.evaluation.opportunity), workplaceLabel(job.evaluation.eligibility?.workplace)]
          .filter(Boolean)
          .map((chip) => (
            <span
              key={chip}
              className="rounded-md bg-[#f4f4f6] px-2 py-1 text-[10.5px] font-medium text-[#5c5c64]"
            >
              {chip}
            </span>
          ))}
      </div>

      <p className="mt-4 font-mono text-[13px] font-medium text-[#14141a] tabular-nums">
        {job.deadline
          ? `Apply by ${format(new Date(job.deadline), "MMM d")}`
          : "Rolling deadline"}
      </p>

      <div className="mt-auto flex items-center gap-2.5 pt-5">
        <CompanyAvatar job={job} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#14141a]">
            {job.company || "Unknown company"}
          </span>
          <span className="block font-mono text-[10.5px] tabular-nums text-[#8b8b93]">
            {[
              isUnstatedLocation(job.location) ? "" : job.location,
              `Posted ${posted}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </div>
    </Link>
  );
}

/**
 * The landing: bold typography leading, with the brand blue reserved for the
 * words that matter and a single strong search row. Snap functionality stays
 * in the latest-postings rail; hover states change colour only, never
 * position, never shadows, never borders.
 */
export function LandingPage({
  recent,
  counts,
}: {
  recent: Job[];
  counts: Counts;
}) {
  const countFor = (label: (typeof CATEGORIES)[number]["label"]) =>
    label === "Open to you"
      ? counts.open
      : label === "Needs relocation"
        ? counts.relocation
        : label === "Region locked"
          ? counts.regionLocked
          : counts.unclear;

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#2b4bf2] text-white">
            <LogoMark className="size-4.5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#14141a]">
            shortlist
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1080px] px-4 pt-14 pb-8 sm:px-6 sm:pt-24">
        <h1 className="max-w-3xl text-[clamp(2.6rem,6vw,4.1rem)] leading-[1.05] font-medium tracking-[-0.02em] text-[#14141a]">
          Land the right internship.
          <br />
          Work <span className="text-[#2b4bf2]">without borders.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#8b8b93]">
          Every posting on the board is read for the two things nobody tells you:
          whether this employer would actually take you, and what you still need
          before you apply.
        </p>

        <LandingSearch />
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 pt-10 pb-20 sm:px-6">
        <h2 className="text-[clamp(1.9rem,4vw,2.7rem)] font-semibold tracking-[-0.025em] text-[#14141a]">
          Latest{" "}
          <span className="relative inline-block px-1 text-[#2b4bf2]">
            Internships
            <svg
              aria-hidden="true"
              viewBox="0 0 120 44"
              fill="none"
              className="absolute -inset-x-3 -inset-y-2 size-full text-[#2b4bf2]/25"
            >
              <ellipse
                cx="60"
                cy="22"
                rx="56"
                ry="17"
                stroke="currentColor"
                strokeWidth="3"
                transform="rotate(-3 60 22)"
              />
            </svg>
          </span>{" "}
          Opportunity
        </h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.label}
                href="/jobs"
                className="group flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#e9e9ee] transition-colors hover:bg-[#f4f4f6] lg:bg-transparent lg:px-3 lg:ring-0"
              >
                <span
                  className={
                    i === 0
                      ? "text-sm font-medium text-[#2b4bf2]"
                      : "text-sm text-[#5c5c64] transition-colors group-hover:text-[#14141a]"
                  }
                >
                  {cat.label}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[11px] tabular-nums ${cat.tint}`}
                >
                  {countFor(cat.label)}
                </span>
              </Link>
            ))}
          </aside>

          <RecentCarousel>
            {recent.map((job, i) => (
              <RecentCard key={job.id} job={job} featured={i === 0} />
            ))}
          </RecentCarousel>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1080px] px-4 pb-10 sm:px-6">
        <div className="border-t border-[#e9e9ee] pt-6">
          <p className="max-w-2xl text-[11px] leading-[1.6] text-[#8b8b93]">
            This tool reads the words in a posting. It cannot know what an
            employer decides in the room, whether a role is already filled, or
            whether a visa will be granted. Treat every verdict as a signal, not
            a promise.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="text-[11px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[11px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-[11px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
              Cookies
            </Link>
            <a href="mailto:tekebahenok6@gmail.com" className="text-[11px] text-[#5c5c64] transition-colors hover:text-[#14141a]">
              Contact
            </a>
            <span className="ml-auto text-[11px] text-[#8b8b93]">
              © {new Date().getFullYear()} Shortlist
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
