import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Clock,
  Eye,
  Globe2,
  Plus,
  RefreshCcw,
  Target,
  TriangleAlert,
} from "lucide-react";

import { AsciiPeaks } from "@/components/landing/ascii-peaks";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";
import type { LandingRole, LandingStats } from "@/app/page";

const COMPANIES = [
  {
    name: "Supabase",
    icon: "/logos/supabase.svg",
    weight: "font-bold lowercase",
  },
  { name: "Vercel", icon: "/logos/vercel.svg", weight: "font-medium" },
  { name: "Cloudflare", icon: "/logos/cloudflare.svg", weight: "font-bold" },
  { name: "GitLab", icon: "/logos/gitlab.svg", weight: "font-bold" },
  { name: "OpenAI", icon: "/logos/openai-wordmark.svg", weight: "wordmark" },
  {
    name: "Anthropic",
    icon: "/logos/anthropic.svg",
    weight: "font-bold tracking-[-0.04em]",
  },
] as const;

const PROBLEMS = [
  {
    number: "01",
    title: "Location Rules Buried In Prose",
    body: "Eligibility lives in a paragraph, not a filter. You only find out after you have applied.",
    icon: TriangleAlert,
  },
  {
    number: "02",
    title: "Fit Scores Without Evidence",
    body: "A percentage tells you nothing if you cannot see which requirement produced it.",
    icon: Eye,
  },
  {
    number: "03",
    title: "Requirements That Keep Changing",
    body: "Stated skills and nice-to-haves blur together, so the bar moves with every rewrite.",
    icon: RefreshCcw,
  },
  {
    number: "04",
    title: "Deadlines That Slip Away",
    body: "Cutoffs are stated once, then buried under reposts. Most candidates find out too late.",
    icon: Clock,
  },
] as const;

const READS = [
  {
    number: "01",
    title: "Can they take you?",
    body: "The location, visa, and sponsorship lines are parsed into a region set. Africa is a member, not an afterthought.",
    output: "A verdict with the exact quote.",
    icon: Globe2,
  },
  {
    number: "02",
    title: "Would you pass?",
    body: "Your skills are matched against stated requirements first, then nice-to-haves — never the other way around.",
    output: "A fit score with the gaps named.",
    icon: Target,
  },
  {
    number: "03",
    title: "By when?",
    body: "Dates are extracted only when they sit beside an explicit deadline label, so a founding year is never a cutoff.",
    output: "A real date, or nothing.",
    icon: CalendarClock,
  },
] as const;

const FAQS = [
  {
    question: "Is Shortlist free?",
    answer:
      "Yes. There is no account, no paywall, and no upsell. The board is a static snapshot of public postings, refreshed every eight hours.",
  },
  {
    question: "Where do the postings come from?",
    answer:
      "Company applicant-tracking boards (Greenhouse, Ashby and Lever) plus public remote feeds. Every posting links back to the employer, where the application actually happens.",
  },
  {
    question: "How do you decide who can apply?",
    answer:
      "Structured location fields are read first, then the posting text for visa and region language. The verdict always carries the field or sentence that produced it, so you can inspect the reasoning.",
  },
  {
    question: "What does the fit score mean?",
    answer:
      "It measures how much of the stated requirement set your skills cover, adjusted for seniority and eligibility. It is a reading of the posting, not a prediction about the hiring manager.",
  },
] as const;

const PREVIEW_LOGOS: Record<string, string> = {
  supabase: "/logos/supabase.svg",
  vercel: "/logos/vercel.svg",
  cloudflare: "/logos/cloudflare.svg",
  gitlab: "/logos/gitlab.svg",
  openai: "/logos/openai-wordmark.svg",
  anthropic: "/logos/anthropic.svg",
};

const VERDICT_LABEL: Record<string, string> = {
  open: "Open to you",
  relocation: "Open if you relocate",
  "region-locked": "Region-locked",
  conflict: "Verdict unclear",
  unknown: "Verdict unclear",
};

function CompanyMark({ name }: { name: string }) {
  const logo = PREVIEW_LOGOS[name.toLowerCase()];
  return (
    <span className="grid size-[clamp(36px,3.1vw,44px)] shrink-0 place-items-center border border-[#ececec] bg-[#fbfbfb]">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          className="max-h-[46%] max-w-[62%] object-contain"
          loading="lazy"
        />
      ) : (
        <span className="font-mono text-[11px] text-[#77777d]">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function CompanyLogo({
  name,
  icon,
  weight,
}: {
  name: string;
  icon: string;
  weight: string;
}) {
  if (weight === "wordmark") {
    return (
      <span className="flex shrink-0 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt={name}
          className="h-[1.25em] w-auto"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-[0.42em]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className="size-[1.1em] shrink-0" loading="lazy" />
      <span
        className={`font-satoshi text-[1.35em] leading-none tracking-[-0.045em] ${weight}`}
      >
        {name}
      </span>
    </span>
  );
}

/**
 * The landing page is a single editorial sheet: a hairline frame, one very
 * large piece of type, a dot-matrix range, and then the argument in a numbered
 * list. The brand blue is used only where the sentence turns, the way it is in
 * the reference.
 */
export function LandingPage({
  stats,
  featured,
}: {
  stats: LandingStats;
  featured: LandingRole[];
}) {
  return (
    <main className="sl-landing min-h-dvh bg-white text-[#0b0b0d]">
      <SiteHeader />

      <SiteShell>
          <section className="sl-hero relative overflow-hidden">
            <AsciiPeaks className="absolute right-0 bottom-0 h-[64%] w-[65%]" />

            <div className="relative z-10 flex min-h-[inherit] flex-col px-[clamp(18px,2.75vw,40px)] pt-[clamp(8px,0.9vw,13px)]">
              <h1 className="sl-display max-w-[96%]">
                Your next role{" "}
                <span className="text-[#548bff]">deserves</span>
                <br className="hidden sm:block" /> a fair shot{" "}
                <span className="text-[#548bff]">anywhere.</span>
              </h1>

              <p className="mt-[clamp(24px,3.45vw,50px)] max-w-[22rem] text-[clamp(12px,1.03vw,15px)] leading-[1.55] text-[#3d3d3d]">
                {stats.total.toLocaleString("en-US")} postings read for whether
                they would hire you, what you&rsquo;re missing, and when to
                apply.
              </p>

              <div className="mt-[clamp(12px,1.15vw,18px)] flex flex-wrap items-center gap-[clamp(8px,0.75vw,12px)]">
                <Link
                  href="/jobs"
                  className="sl-primary-btn h-[clamp(34px,3.2vw,46px)] min-h-11"
                >
                  Browse jobs
                  <ArrowRight className="size-[1.1em]" strokeWidth={1.6} />
                </Link>
                <Link
                  href="/skills"
                  className="sl-secondary-btn h-[clamp(34px,3.2vw,46px)] min-h-11"
                >
                  Your skills
                  <span className="grid size-[1.3em] place-items-center border border-current/35">
                    <ArrowUpRight className="size-[0.85em]" strokeWidth={1.5} />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          <section className="sl-trusted relative overflow-hidden">
            <div className="px-[clamp(18px,2.75vw,40px)]">
              <SiteLabel>Teams hiring on Shortlist</SiteLabel>
            </div>

            <div className="mt-[clamp(18px,2.45vw,35px)] overflow-hidden">
              <div className="sl-marquee flex w-max">
                {[0, 1].map((group) => (
                  <div
                    key={group}
                    aria-hidden={group === 1}
                    className="flex items-center gap-[clamp(46px,6.2vw,102px)] pr-[clamp(46px,6.2vw,102px)] pl-[clamp(8px,1.2vw,18px)]"
                  >
                    {COMPANIES.map((company) => (
                      <CompanyLogo
                        key={company.name}
                        name={company.name}
                        icon={company.icon}
                        weight={company.weight}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="how"
            className="sl-problem border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)]"
          >
            <SiteLabel>The problem</SiteLabel>

            <div className="mt-[clamp(32px,5.55vw,80px)] grid grid-cols-1 gap-y-14 md:grid-cols-2 md:gap-y-0">
              <div className="md:pr-[clamp(16px,3vw,48px)]">
                <h2 className="sl-problem-heading max-w-[24rem]">
                  What Keeps Global Talent
                  <br />
                  Up At Night
                </h2>
                <p className="mt-[clamp(16px,1.8vw,26px)] max-w-[19rem] text-[clamp(12px,1.03vw,15px)] leading-[1.6] text-[#9a9a9a]">
                  Location rules, visa notes, and quiet restrictions are buried
                  in the text&mdash;so most candidates find out too late.
                </p>
              </div>

              <ol className="md:pl-[clamp(0px,0.2vw,4px)] md:-mt-[clamp(0px,0.7vw,10px)]">
                {PROBLEMS.map((problem) => {
                  const Icon = problem.icon;
                  return (
                    <li
                      key={problem.number}
                      className="grid grid-cols-[auto_1fr_auto] items-start gap-x-[clamp(14px,1.8vw,28px)] border-t border-dashed border-[#e2e2e2] pt-[clamp(4px,0.42vw,6px)] pb-[clamp(22px,2.25vw,32px)] first:border-t-0 first:pt-0 first:pb-[clamp(30px,2.95vw,42px)]"
                    >
                      <span className="pt-[0.3em] font-mono text-[clamp(11px,0.98vw,14px)] leading-none text-[#77777d]">
                        {problem.number}
                      </span>
                      <div>
                        <h3 className="font-satoshi text-[clamp(14px,1.4vw,20px)] leading-[1.25] font-medium tracking-[-0.025em]">
                          {problem.title}
                        </h3>
                        <p className="mt-[clamp(10px,1.4vw,20px)] max-w-[24rem] text-[clamp(12px,1vw,14.4px)] leading-[1.55] text-[#9a9a9a]">
                          {problem.body}
                        </p>
                      </div>
                      <span className="mt-[0.12em] grid size-[clamp(30px,2.9vw,42px)] place-items-center border border-[#dce8fb] bg-[#f8fbff] text-[#7d97c2]">
                        <Icon
                          className="size-[46%]"
                          strokeWidth={1.4}
                          aria-hidden="true"
                        />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(34px,4.6vw,66px)]">
            <SiteLabel>By the numbers</SiteLabel>
            <div className="mt-[clamp(24px,3vw,44px)] grid grid-cols-2 border-t border-[#14141a] md:grid-cols-4">
              {[
                {
                  value: stats.total,
                  label: "Postings read",
                  note: "Every live internship and contract in the snapshot.",
                  accent: false,
                },
                {
                  value: stats.open,
                  label: "Open to you",
                  note: "The verdict is yes without a move.",
                  accent: true,
                },
                {
                  value: stats.relocation,
                  label: "Open if you relocate",
                  note: "A yes, but only after a move.",
                  accent: false,
                },
                {
                  value: stats.regionLocked,
                  label: "Refuse your region",
                  note: "The posting excludes where you are.",
                  accent: false,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-b border-[#ececec] py-6 pr-5 odd:border-r md:border-b-0 md:border-r md:last:border-r-0 md:px-5 md:first:pl-0"
                >
                  <p
                    className={`font-satoshi text-[clamp(2.2rem,4.3vw,4rem)] leading-none font-medium tracking-[-0.045em] tabular-nums ${
                      stat.accent ? "text-[#548bff]" : "text-[#050506]"
                    }`}
                  >
                    {stat.value.toLocaleString("en-US")}
                  </p>
                  <p className="sl-label mt-4">{stat.label}</p>
                  <p className="mt-2 max-w-[13rem] text-[12px] leading-[1.55] text-[#9a9a9a]">
                    {stat.note}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] tracking-[0.04em] text-[#9a9a9a]">
              Counted live from the board on this build. Verdicts can change as
              postings are edited or filled.
            </p>
          </section>

          <section
            id="method"
            className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(34px,4.6vw,66px)]"
          >
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SiteLabel>How it reads</SiteLabel>
                <h2 className="sl-heading mt-[clamp(18px,2.2vw,32px)] max-w-[22ch]">
                  Three reads.{" "}
                  <span className="text-[#548bff]">One clear answer.</span>
                </h2>
              </div>
              <Link
                href="/jobs"
                className="sl-text-link inline-flex items-center gap-1.5"
              >
                See it on the board
                <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="mt-[clamp(28px,3.6vw,52px)] grid gap-0 border-t border-[#14141a] md:grid-cols-3 md:divide-x md:divide-[#ececec]">
              {READS.map((read) => {
                const Icon = read.icon;
                return (
                  <div
                    key={read.number}
                    className="border-b border-[#ececec] py-6 last:border-b-0 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="pt-1 font-mono text-[clamp(11px,0.98vw,14px)] leading-none text-[#77777d]">
                        {read.number}
                      </span>
                      <span className="grid size-[clamp(32px,2.7vw,40px)] place-items-center border border-[#dce8fb] bg-[#f8fbff] text-[#7d97c2]">
                        <Icon
                          className="size-[46%]"
                          strokeWidth={1.4}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <h3 className="mt-6 font-satoshi text-[clamp(18px,1.5vw,22px)] leading-[1.15] font-medium tracking-[-0.025em]">
                      {read.title}
                    </h3>
                    <p className="mt-3 max-w-[24rem] text-[clamp(12px,1vw,14.4px)] leading-[1.65] text-[#8f8f94]">
                      {read.body}
                    </p>
                    <p className="mt-6 border-t border-dashed border-[#e2e2e2] pt-3">
                      <span className="sl-label mr-2">Output</span>
                      <span className="text-[12.5px] text-[#5f5f65]">
                        {read.output}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(34px,4.6vw,66px)]">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SiteLabel>On the board</SiteLabel>
                <h2 className="sl-heading mt-[clamp(18px,2.2vw,32px)] max-w-[20ch]">
                  A few roles worth opening.
                </h2>
              </div>
              <Link
                href="/jobs"
                className="sl-text-link inline-flex items-center gap-1.5"
              >
                See the full board
                <ArrowRight className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="mt-[clamp(24px,3vw,44px)] border-t border-[#14141a]">
              {featured.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[clamp(12px,1.6vw,22px)] gap-y-2 border-b border-[#ececec] py-[clamp(14px,1.6vw,22px)] transition-colors last:border-b-0 hover:bg-[#fbfbfb] md:grid-cols-[auto_minmax(0,1fr)_190px_64px_auto]"
                >
                  <CompanyMark name={job.company} />
                  <div className="min-w-0">
                    <p className="truncate font-satoshi text-[clamp(15px,1.25vw,18px)] leading-[1.2] font-medium tracking-[-0.02em]">
                      {job.title}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-[#8f8f94]">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <span
                    className={`hidden font-mono text-[10px] tracking-[0.04em] uppercase md:block ${
                      job.verdict === "open" || job.verdict === "relocation"
                        ? "text-[#548bff]"
                        : "text-[#77777d]"
                    }`}
                  >
                    {VERDICT_LABEL[job.verdict] ?? "Verdict unclear"}
                  </span>
                  <span
                    className="hidden size-9 place-items-center border border-[#dce8fb] bg-[#f8fbff] font-mono text-[10.5px] text-[#548bff] tabular-nums md:grid"
                    title="Priority score"
                  >
                    {job.priority ?? "—"}
                  </span>
                  <ArrowUpRight
                    className="size-4 text-[#77777d] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#548bff]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Link>
              ))}
              {featured.length === 0 ? (
                <p className="py-8 text-[13px] text-[#8f8f94]">
                  The snapshot is still loading. Open the board to see every
                  posting.
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(34px,4.6vw,66px)]">
            <div className="grid gap-[clamp(24px,4vw,64px)] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <SiteLabel>Questions</SiteLabel>
                <h2 className="sl-heading mt-[clamp(18px,2.2vw,32px)] max-w-[22rem]">
                  Questions, answered.
                </h2>
                <p className="mt-[clamp(16px,1.8vw,26px)] max-w-[20rem] text-[clamp(12px,1.03vw,15px)] leading-[1.6] text-[#9a9a9a]">
                  Shortlist reads the posting, not your chances. The method page
                  shows exactly what the engine can and cannot know.
                </p>
                <Link
                  href="/#method"
                  className="sl-text-link mt-6 inline-flex items-center gap-1.5"
                >
                  Read the method
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>

              <div className="border-t border-[#14141a]">
                {FAQS.map((faq) => (
                  <details
                    key={faq.question}
                    className="sl-faq group border-b border-[#ececec] py-[clamp(14px,1.5vw,20px)] last:border-b-0"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="font-satoshi text-[clamp(14px,1.2vw,17px)] leading-[1.3] font-medium tracking-[-0.02em]">
                        {faq.question}
                      </span>
                      <span className="sl-faq-toggle grid size-7 shrink-0 place-items-center border border-[#dce8fb] bg-[#f8fbff] text-[#7d97c2]">
                        <Plus className="size-3.5" strokeWidth={1.5} />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[34rem] pr-9 text-[clamp(12px,1vw,14.4px)] leading-[1.65] text-[#8f8f94]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(42px,5.5vw,82px)]">
            <div className="grid items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div>
                <SiteLabel>Get started</SiteLabel>
                <h2 className="sl-display-sm mt-[clamp(18px,2.2vw,32px)] max-w-[14ch]">
                  Stop applying{" "}
                  <span className="text-[#548bff]">blind.</span>
                </h2>
              </div>
              <div className="flex flex-col items-start gap-5 md:items-end">
                <div className="flex flex-wrap gap-[clamp(8px,0.75vw,12px)]">
                  <Link
                    href="/jobs"
                    className="sl-primary-btn h-[clamp(38px,3.2vw,46px)] min-h-11"
                  >
                    Browse internships
                    <ArrowRight className="size-[1.1em]" strokeWidth={1.6} />
                  </Link>
                  <Link
                    href="/skills"
                    className="sl-secondary-btn h-[clamp(38px,3.2vw,46px)] min-h-11"
                  >
                    Pick your skills
                    <ArrowUpRight className="size-[0.9em]" strokeWidth={1.6} />
                  </Link>
                </div>
                <p className="font-mono text-[10px] tracking-[0.06em] text-[#9a9a9a] uppercase">
                  No account · No tracking · Refreshed every 8 hours
                </p>
              </div>
            </div>
          </section>

          <SiteFooter />
      </SiteShell>
    </main>
  );
}
