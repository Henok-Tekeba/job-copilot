import Link from "next/link";

import { AsciiMap } from "@/components/ascii-map";
import {
  VerdictInspector,
  type LandingSample,
} from "@/components/landing/verdict-inspector";
import { VerdictTool } from "@/components/landing/verdict-tool";
import { ThemeToggle } from "@/components/theme-toggle";
import type { JobsSummary } from "@/lib/summary";

const STEPS = [
  {
    title: "Can they take you?",
    body: "We read the location rules and visa notes in the posting and give a plain answer, with the exact words that caused it.",
  },
  {
    title: "Would you pass?",
    body: "Your skills and level are scored against what the posting asks for, so you know where you stand before applying.",
  },
  {
    title: "What are you missing?",
    body: "The skills you do not have yet are named up front, so you know what to learn next.",
  },
  {
    title: "By when?",
    body: "Deadlines are pulled from the posting text, so you do not miss a cutoff.",
  },
] as const;

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
          <span className="font-heading text-sm font-semibold tracking-tight">
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
          <div className="relative max-w-2xl">
            <div className="flex flex-col gap-8">
              <h1 className="max-w-xl font-serif text-4xl font-normal leading-[1.0] tracking-tight sm:text-5xl">
                Will this employer take an <em className="italic">international</em> applicant?
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                Tech internships, contracts and junior roles from {feeds} hiring
                feeds. Each one checked for two things: whether they would take
                an international applicant, and what you would still be missing.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  {summary.total} postings
                </span>
                <span className="font-mono tabular-nums">
                  {summary.reachable} open to you
                </span>
              </div>
            </div>

            <div className="mt-10 border border-border bg-card p-5 sm:p-6">
              <p className="mb-3 text-xs text-muted-foreground">
                Paste any posting. The engine runs in your browser and shows its evidence.
              </p>
              <VerdictTool />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-balance font-serif text-2xl font-normal tracking-tight">
              Try three real postings
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick one to see how the board reads it.
            </p>
            <div className="mt-8">
              <VerdictInspector samples={samples} />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-balance font-serif text-2xl font-normal tracking-tight">
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

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            This tool reads the words in a posting. It cannot know what an
            employer decides in the room, whether a role is already filled, or
            whether a visa will be granted. Treat every verdict as a signal, not
            a promise.
          </p>
        </div>
      </footer>
    </div>
  );
}