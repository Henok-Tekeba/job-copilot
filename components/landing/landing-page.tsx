import Link from "next/link";

import { AsciiMap } from "@/components/ascii-map";
import {
  VerdictInspector,
  type LandingSample,
} from "@/components/landing/verdict-inspector";
import { VerdictTool } from "@/components/landing/verdict-tool";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { JobsSummary } from "@/lib/summary";

/**
 * The four things every posting on the board answers, in the order they are
 * worked out. A real sequence, hence the numbers.
 */
const STEPS = [
  {
    title: "Can they take you?",
    body: "Feed fields, the location string and the posting body read together, and the verdict keeps the evidence it used.",
  },
  {
    title: "Would you pass?",
    body: "Your skills and level scored against what the posting asks for, into a priority the board sorts by.",
  },
  {
    title: "What are you missing?",
    body: "The required skills you lack, named before you apply rather than after.",
  },
  {
    title: "By when?",
    body: "Deadlines read out of the posting text, so applications land before the cutoff.",
  },
] as const;

/**
 * Site front door. One loud element — the inspector of real verdicts — and
 * everything else quiet: figures in Geist Mono, hairlines instead of cards,
 * status colour only where the board itself uses it.
 */
export function LandingPage({
  samples,
  summary,
  feeds,
}: {
  samples: LandingSample[];
  summary: JobsSummary;
  feeds: number;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="font-heading text-sm font-semibold tracking-tight">
            Job Copilot
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse the board
            </Link>
            <ThemeToggle className="size-8" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto w-full max-w-5xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
          <AsciiMap
            className="inset-x-0 top-0 h-64 [mask-image:linear-gradient(to_bottom,black_60%,transparent)] text-[10px] sm:h-[22rem] sm:text-[14px] lg:h-[30rem] lg:text-[18px]"
          />
          <div className="relative">
            <h1
              className="max-w-3xl animate-in text-balance text-4xl font-semibold leading-[1.08] tracking-tight fill-mode-backwards slide-in-from-bottom-4 fade-in duration-700 ease-out sm:text-5xl"
            >
              Will this employer take an international applicant?
            </h1>
            <p className="mt-6 max-w-[62ch] animate-in text-base leading-relaxed text-muted-foreground fill-mode-backwards slide-in-from-bottom-4 fade-in delay-[120ms] duration-700 ease-out sm:text-lg">
              A personal board of tech internships, contracts and junior roles from{" "}
              {feeds} hiring feeds, each one read for that question — and for what
              you would still be missing if you applied.
            </p>

            <div className="mt-12 animate-in fill-mode-backwards fade-in delay-[260ms] duration-700 ease-out">
              <p className="mb-3 text-xs text-muted-foreground">
                Three postings from the current snapshot. Pick one to see the read.
              </p>
              <VerdictInspector samples={samples} />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-lg font-semibold tracking-tight">
              Or read your own posting
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
              Paste any job description. The same engine that scores the board
              reads it for reach and fit, and names what you would still be
              missing.
            </p>
            <div className="mt-8">
              <VerdictTool />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-lg font-semibold tracking-tight">
              How a posting is read
            </h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-2 border-t border-border pt-4"
                >
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-20">
            <p className="max-w-[68ch] text-base leading-relaxed">
              <span className="font-mono tabular-nums">{summary.total}</span>{" "}
              postings,{" "}
              <span className="font-mono tabular-nums">{summary.reachable}</span>{" "}
              open to you or worth relocating for;{" "}
              <span className="font-mono tabular-nums">{summary.entry}</span> of
              those are internships, contracts or junior roles. Rebuilt from{" "}
              <span className="font-mono tabular-nums">{feeds}</span> hiring
              feeds every 8 hours, and stale postings are dropped.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="self-start"
                render={<Link href="/jobs" />}
              >
                Browse the board
              </Button>
              <p className="text-xs text-muted-foreground">
                Saved jobs and notes stay in this browser.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
