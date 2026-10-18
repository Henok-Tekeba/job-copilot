import Link from "next/link";

import { AsciiMap } from "@/components/ascii-map";
import {
  VerdictInspector,
  type LandingSample,
} from "@/components/landing/verdict-inspector";
import { VerdictTool } from "@/components/landing/verdict-tool";
import { ThemeToggle } from "@/components/theme-toggle";
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
 * Site front door.
 *
 * The hero is the read itself: paste a posting, get the verdict. Everything
 * else is proof that the read is real and reproducible.
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
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="font-display text-sm font-semibold tracking-tight">
            Job Copilot
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline"
            >
              Browse the board
            </Link>
            <ThemeToggle className="size-8" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-32">
          <AsciiMap
            className="absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black_50%,transparent)] text-[10px] sm:h-[26rem] sm:text-[13px] lg:h-[34rem] lg:text-[16px]"
          />
          <div className="relative flex flex-col items-center gap-10 text-center">
            <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">
              Will this employer take an international applicant?
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A board of tech internships, contracts and junior roles from{" "}
              {feeds} hiring feeds, each one read for that question — and for
              what you would still be missing if you applied.
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {summary.total} postings
              </span>
              <span className="font-mono tabular-nums">
                {summary.reachable} open to you
              </span>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-2xl border border-border bg-card p-4 sm:p-6 motion-reduce:animate-none">
              <p className="mb-3 text-xs text-muted-foreground">
                Paste any posting. The read appears here.
              </p>
              <VerdictTool />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-balance text-lg font-semibold tracking-tight">
              Or try three from the current snapshot
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick one to see the read the board gives it.
            </p>
            <div className="mt-8">
              <VerdictInspector samples={samples} />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-balance text-lg font-semibold tracking-tight">
              How a posting is read
            </h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 border-t border-border pt-5"
                >
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
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
      </main>
    </div>
  );
}