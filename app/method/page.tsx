import * as fs from "fs";
import * as path from "path";
import { PageHeader } from "@/components/page-header";
import type { Interval } from "@/eval/stats";

/**
 * The Method page is GENERATED from the eval result files — never edited by
 * hand. The numbers update whenever the eval re-runs; hardcoded accuracy is
 * forbidden. Built at build time from eval/results/, so the static export
 * ships real numbers or fails the build.
 */

type SetResult = {
  setName: string;
  n: number;
  statementDetection: { precision: Interval; recall: Interval };
  stanceAccuracyAmongDetected: Interval;
  blocked: { precision: Interval; recall: Interval };
  sponsors: { precision: Interval; recall: Interval };
  accuracy: Interval;
  verdict: { accuracy: Interval; perStatus: Record<string, { precision: Interval; recall: Interval }> };
  baselines: { alwaysSilent: Interval; alwaysUnclear: Interval };
  worstMistakes: Array<{ id: string; company: string; title: string; trueStance: string; predictedStance: string; confidence: number; quote: string; trueQuote?: string }>;
};

type Results = {
  engineVersion: string;
  runAt: string;
  mode: string;
  labelHashes: { natural: string; stratified: string };
  labelsUnaudited?: boolean | null;
  trickyCases: { total: number; passed: number; failures: Array<{ name: string; got: string }> };
  dev?: SetResult;
  test?: SetResult;
  stratifiedDev?: SetResult;
  stratifiedTest?: SetResult;
  leakageChecks?: string[];
};

function loadResults(): { dev: Results | null; final: Results | null } {
  const read = (p: string): Results | null => {
    try {
      return JSON.parse(fs.readFileSync(path.join(process.cwd(), p), "utf-8"));
    } catch {
      return null;
    }
  };
  const dir = path.join(process.cwd(), "eval", "results");
  let final: Results | null = null;
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("final-") && f.endsWith(".json"))
      .sort();
    if (files.length > 0) final = read(`eval/results/${files[files.length - 1]}`);
  } catch {
    final = null;
  }
  return { dev: read("eval/results/latest.json"), final };
}

function pct(m: Interval | undefined): string {
  if (!m || m.p === null) return "—";
  return `${(100 * m.p).toFixed(1)}%`;
}

function ci(m: Interval | undefined): string {
  if (!m || m.p === null || m.low === null || m.high === null) return `n=${m?.n ?? 0}`;
  return `${(100 * m.p).toFixed(1)}% [95% CI ${(100 * m.low).toFixed(1)}–${(100 * m.high).toFixed(1)}%, n=${m.n}]`;
}

function MetricTable({ title, r }: { title: string; r: SetResult }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">{title} (n={r.n})</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-2 font-normal">Metric</th>
            <th className="py-2 font-normal">Value</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs tabular-nums">
          <tr><td className="py-1.5 pr-4">statement detection — precision</td><td>{ci(r.statementDetection.precision)}</td></tr>
          <tr><td className="py-1.5 pr-4">statement detection — recall</td><td>{ci(r.statementDetection.recall)}</td></tr>
          <tr><td className="py-1.5 pr-4">stance accuracy among detected</td><td>{ci(r.stanceAccuracyAmongDetected)}</td></tr>
          <tr><td className="py-1.5 pr-4">blocked — precision / recall</td><td>{pct(r.blocked.precision)} / {pct(r.blocked.recall)}</td></tr>
          <tr><td className="py-1.5 pr-4">sponsors — precision / recall</td><td>{pct(r.sponsors.precision)} / {pct(r.sponsors.recall)}</td></tr>
          <tr><td className="py-1.5 pr-4">overall stance accuracy</td><td>{ci(r.accuracy)}</td></tr>
          <tr><td className="py-1.5 pr-4">baseline: always “silent”</td><td>{ci(r.baselines.alwaysSilent)}</td></tr>
          <tr><td className="py-1.5 pr-4">verdict accuracy</td><td>{ci(r.verdict.accuracy)}</td></tr>
          <tr><td className="py-1.5 pr-4">baseline: always “unclear” (verdict)</td><td>{ci(r.baselines.alwaysUnclear)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default function MethodPage() {
  const { dev, final } = loadResults();
  const show = final ?? dev;
  const unaudited = final ? final.labelsUnaudited : true;

  return (
    <>
      <PageHeader>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Method</h1>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        {unaudited && (
          <p className="border-l-2 border-amber-500 bg-amber-500/10 py-2 pl-4 text-sm text-amber-400">
            Labels unaudited — every number on this page comes from AI-labeled
            data that a human has not finished reviewing. Treat them as
            provisional in both directions.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl tracking-tight">How a verdict is reached</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A classifier reads the posting text for sponsorship language
            (engine/textStance.ts, rules — no model). Company records —
            currently the UK Home Office sponsor register — stand behind the
            postings that say nothing. A small scoring table
            (engine/verdict.ts) combines them: blocking text beats everything;
            sponsor text means open; silence plus a record means likely;
            silence plus nothing means unclear.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Company records show past sponsorship, not present ability or
            intent. A licensed sponsor can stop; an unlicensed one can start.
          </p>
        </div>

        {show ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl tracking-tight">Measured accuracy</h2>
              <p className="font-mono text-xs text-muted-foreground">
                engine v{show.engineVersion} · run {show.runAt.slice(0, 10)} · labels{" "}
                {show.labelHashes.natural}/{show.labelHashes.stratified}
              </p>
            </div>
            {show.dev && <MetricTable title="Natural set — dev" r={show.dev} />}
            {show.test && <MetricTable title="Natural set — test (final, once per engine version)" r={show.test} />}
            {show.stratifiedDev && <MetricTable title="Stratified rare-class set — dev" r={show.stratifiedDev} />}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tricky negative cases (boilerplate that must NOT count as a visa
              statement): {show.trickyCases.passed}/{show.trickyCases.total} pass.
              Natural and stratified sets are scored separately and never pooled.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No eval results yet — run <code className="font-mono">npm run eval:dev</code>.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl tracking-tight">Where this is wrong</h2>
          {show?.dev?.worstMistakes?.length ? (
            <ul className="flex flex-col gap-3">
              {show.dev.worstMistakes.slice(0, 5).map((m) => (
                <li key={m.id} className="border-l-2 border-border pl-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.company} — truth {m.trueStance}, engine {m.predictedStance} ({Math.round(m.confidence * 100)}%)
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {m.trueQuote ? `Label evidence: “${m.trueQuote.slice(0, 140)}”` : `Engine read: “${m.quote.slice(0, 140)}”`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No mistakes recorded yet.</p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Known blind spots: postings whose text was never published in full
            are excluded from the board&apos;s verdicts; company records exist
            only for the UK register so far; and postings that say nothing are
            the most common case — the engine says so instead of guessing.
          </p>
        </div>
      </div>
    </>
  );
}
