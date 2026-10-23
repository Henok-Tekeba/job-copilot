import Link from "next/link";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { CountUp, Reveal } from "@/components/reveal";
import { WallDocument } from "@/components/landing/wall-document";
import { CtaLink } from "@/components/landing/cta-link";
import { RecentCarousel } from "@/components/landing/recent-carousel";
import { LandingSearch } from "@/components/landing/landing-search";
import { CompanyAvatar } from "@/components/company-avatar";
import { opportunityLabel, workplaceLabel } from "@/lib/labels";
import { isUnstatedLocation } from "@/lib/regions";
import type { Job } from "@/lib/types";
import type { LandingStats, WallSample } from "@/app/page";

const HOW = [
  {
    title: "Can they take you?",
    body: "We read the location rules and visa notes in the posting and give a plain answer, with the exact words that caused it.",
    output: "a verdict, quoted from the text",
  },
  {
    title: "Would you pass?",
    body: "Your skills are scored against what the posting asks for, so you know where you stand before applying.",
    output: "a priority score out of 100",
  },
  {
    title: "What are you missing?",
    body: "The skills you do not have yet are named up front, so you know what to learn next.",
    output: "the list of skills to learn",
  },
  {
    title: "By when?",
    body: "Deadlines are pulled from the posting text, so you never miss a cutoff.",
    output: "a date, read from the text",
  },
] as const;

const COMPARE = [
  {
    label: "Will they take you?",
    them: "Buried in the text, if written at all",
    us: "A verdict with the exact words that caused it",
  },
  {
    label: "What you are missing",
    them: "You find out in the rejection",
    us: "Named before you apply",
  },
  {
    label: "Personal match",
    them: "One list for everyone",
    us: "A % on every row, scored from your skills",
  },
  {
    label: "Deadlines",
    them: "Rarely surfaced",
    us: "Read from the posting text",
  },
  {
    label: "What gets listed",
    them: "Senior and full-time filler",
    us: "Internships and contracts only",
  },
] as const;

/** No motion on cards: stillness is the brand. Hover only ever changes text colour. */
function RecentCard({ job, featured }: { job: Job; featured: boolean }) {
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
      <h3 className="line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.01em] text-[#14141a]">
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
          <span className="block font-mono text-[10.5px] tabular-nums text-[#6f6f78]">
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
  stats,
  wallSample,
}: {
  recent: Job[];
  stats: LandingStats;
  wallSample: WallSample | null;
}) {
  const LEDGER = [
    { label: "Refuse your region outright", value: stats.regionLocked, accent: false },
    { label: "Open, but only if you relocate", value: stats.relocation, accent: false },
    { label: "Never say whether they take you", value: stats.unclear, accent: false },
    { label: "Open to you as-is", value: stats.open, accent: true },
  ] as const;

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
        <Link
          href="/skills"
          className="text-[13px] font-medium text-[#5c5c64] transition-colors hover:text-[#14141a]"
        >
          Your skills
        </Link>
      </header>

      <section className="mx-auto w-full max-w-[1000px] px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-28 sm:pb-20">
        <h1 className="mx-auto max-w-[880px] text-[clamp(2.9rem,7vw,5.4rem)] leading-[0.98] font-medium tracking-[-0.045em] text-[#14141a]">
          Land the right internship.
          <br />
          Work{" "}
          <mark className="hl hl-on px-2 pb-1 font-medium">without borders.</mark>
        </h1>
        <p className="mx-auto mt-7 max-w-[540px] text-[15.5px] leading-relaxed text-[#5c5c64]">
          Every posting is read for whether this employer would actually take
          you, and what you still need before you apply.
        </p>

        <LandingSearch />

        <p className="mt-6 text-[11.5px] text-[#6f6f78]">
          {stats.total.toLocaleString("en-US")} internships and contracts read ·
          refreshed every 8 hours · international-first
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 pt-10 pb-20 sm:px-6">
        <h2 className="text-[clamp(1.8rem,3.6vw,2.5rem)] font-medium tracking-[-0.025em] text-[#14141a]">
          Latest internships
        </h2>

        <div className="mt-6">
          <RecentCarousel>
            {recent.map((job, i) => (
              <RecentCard key={job.id} job={job} featured={i === 0} />
            ))}
          </RecentCarousel>
        </div>
      </section>


      {/* The wall — a real posting, caught in the act, and the ledger */}
      <section className="border-y border-[#e9e9ee] bg-[#f4f4f6]">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="max-w-2xl text-[clamp(1.8rem,3.8vw,2.6rem)] leading-[1.06] font-medium tracking-[-0.02em] text-[#14141a]">
              <span className="mask-wipe">
                Thousands of tech internships get posted every month. Your
                region gets filtered out by{" "}
                <span className="text-[#2b4bf2]">a line you never see.</span>
              </span>
            </h2>
          </Reveal>

          {wallSample && (
            <Reveal>
              <div className="relative mt-12 rounded-[24px] border border-[#ececf0] bg-white p-6 shadow-[0_24px_64px_-32px_rgba(15,15,30,0.3)] sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#6f6f78]">
                    A posting, exactly as it reads
                  </span>
                  <span className="h-px flex-1 bg-[#e9e9ee]" />
                  <span className="rounded-lg bg-[#f4f4f6] px-3 py-1.5 text-[12px] font-medium text-[#5c5c64]">
                    {stats.regionLocked.toLocaleString("en-US")} postings carry a
                    line like this
                  </span>
                </div>
                <p className="mt-6 text-[13px] font-semibold text-[#14141a]">
                  {wallSample.title}
                </p>
                <p className="text-[12px] text-[#6f6f78]">{wallSample.company}</p>
                <WallDocument sample={wallSample} />
              </div>
            </Reveal>
          )}

          <div className="mt-12">
            {LEDGER.map((row, i) => (
              <Reveal key={row.label} delay={i * 70} className="last:border-b">
              <div
                className="flex items-baseline justify-between gap-4 border-t border-[#e9e9ee] py-4"
              >
                <span
                  className={
                    row.accent
                      ? "text-[15px] font-semibold text-[#2b4bf2]"
                      : "text-[15px] text-[#14141a]"
                  }
                >
                  {row.label}
                </span>
                <span
                  className={
                    row.accent
                      ? "text-[20px] font-semibold text-[#2b4bf2] tabular-nums"
                      : "text-[20px] font-medium text-[#14141a] tabular-nums"
                  }
                >
                  {row.accent ? <CountUp to={row.value} /> : row.value.toLocaleString("en-US")}
                  <span className="ml-2 text-[12px] font-normal text-[#6f6f78]">
                    {Math.round((row.value / stats.total) * 100)}%
                  </span>
                </span>
              </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-[#6f6f78]">
            Counted live from the {stats.total.toLocaleString("en-US")} internships
            and contracts on the board right now. Sponsorship:{" "}
            {stats.sponsorshipOffered.toLocaleString("en-US")} postings say it is
            offered, {stats.sponsorshipDenied.toLocaleString("en-US")} say no,{" "}
            {stats.sponsorshipSilent.toLocaleString("en-US")} never mention it.
          </p>
        </div>
      </section>

      {/* How it reads — four reads, one rule, their outputs */}
      <section className="border-t border-[#e9e9ee]">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="text-[clamp(1.8rem,3.6vw,2.5rem)] font-medium tracking-[-0.02em] text-[#14141a]">
              How a posting is read
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 grid gap-x-10 gap-y-12 border-t border-[#14141a] pt-0 sm:grid-cols-2 lg:grid-cols-4">
              {HOW.map((step, i) => (
                <div key={step.title} className="relative pt-8">
                  <span
                    aria-hidden="true"
                    className="absolute top-[-3.5px] left-0 size-[7px] bg-[#2b4bf2]"
                  />
                  <span className="text-[40px] leading-none font-medium tracking-tight text-[#14141a]">
                    {i + 1}
                    <span className="text-[#2b4bf2]">.</span>
                  </span>
                  <h3 className="mt-3 text-[15px] font-semibold text-[#14141a]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6f6f78]">
                    {step.body}
                  </p>
                  <p className="mt-4 border-t border-[#e9e9ee] pt-2.5 text-[12px] text-[#6f6f78]">
                    <span className="font-medium text-[#5c5c64]">You get: </span>
                    {step.output}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-[#e9e9ee] bg-[#f4f4f6]">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="max-w-2xl text-[clamp(1.8rem,3.6vw,2.5rem)] leading-[1.08] font-medium tracking-[-0.02em] text-[#14141a]">
              The big boards sell listings.{" "}
              <span className="text-[#2b4bf2]">Shortlist sells the answer.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-10 overflow-hidden rounded-[24px] border border-[#ececf0] bg-white shadow-[0_24px_64px_-32px_rgba(15,15,30,0.25)]">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-x-4 border-b border-[#e9e9ee] bg-[#f4f4f6] px-5 py-3 text-[12px] font-semibold text-[#5c5c64] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:px-8">
                <span>&nbsp;</span>
                <span className="hidden sm:block">The big boards</span>
                <span className="text-[#2b4bf2]">Shortlist</span>
              </div>
              {COMPARE.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-4 border-b border-[#e9e9ee] px-5 py-4 text-[13px] last:border-b-0 sm:px-8"
                >
                  <span className="font-semibold text-[#14141a]">{row.label}</span>
                  <span className="hidden items-start gap-2 text-[#6f6f78] sm:flex">
                    <X className="mt-0.5 size-3.5 shrink-0 text-[#c9c9cf]" />
                    {row.them}
                  </span>
                  <span className="flex items-start gap-2 text-[#14141a]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#2b4bf2]" strokeWidth={3} />
                    {row.us}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#e9e9ee]">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-16 text-center sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-[clamp(1.9rem,4vw,2.7rem)] font-medium tracking-[-0.02em] text-[#14141a]">
              Stop applying{" "}
              <span className="text-[#2b4bf2]">blind.</span>
            </h2>
          </Reveal>
          <Reveal delay={90}>
            <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-[#6f6f78]">
              Pick your skills once. See, on every posting, whether they would
              take you — and what is missing before you apply.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-8 flex justify-center">
              <CtaLink />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1080px] px-4 pb-10 sm:px-6">
        <div className="border-t border-[#e9e9ee] pt-6">
          <p className="max-w-2xl text-[11px] leading-[1.6] text-[#6f6f78]">
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
            <span className="ml-auto text-[11px] text-[#6f6f78]">
              © {new Date().getFullYear()} Shortlist
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
