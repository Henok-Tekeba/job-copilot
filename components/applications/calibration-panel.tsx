"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Application } from "@/lib/types";
import type { Job } from "@/lib/types";

type CalibrationPanelProps = {
  applications: Application[];
};

/**
 * Calibration: were the verdicts right?
 *
 * Correlates the verdict the engine gave each posting with the outcome the
 * user recorded. This is the feedback loop that makes the engine's accuracy
 * measurable instead of assumed.
 */
export function CalibrationPanel({ applications }: CalibrationPanelProps) {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/jobs.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        setJobs(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const jobById = React.useMemo(() => {
    const m = new Map<string, Job>();
    for (const j of jobs) m.set(j.id, j);
    return m;
  }, [jobs]);

  const applied = applications.filter((a) => a.jobId);
  const withVerdict = applied
    .map((a) => ({ app: a, job: jobById.get(a.jobId!) }))
    .filter((x): x is { app: Application; job: Job } => Boolean(x.job));

  // Group by verdict -> outcome counts.
  const groups = new Map<
    string,
    { total: number; interview: number; offer: number; rejected: number; ghosted: number }
  >();
  for (const { app, job } of withVerdict) {
    const verdict = job.evaluation.eligibility?.verdict ?? "unknown";
    const g = groups.get(verdict) ?? {
      total: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
    };
    g.total += 1;
    if (app.status === "interview") g.interview += 1;
    if (app.status === "offer") g.offer += 1;
    if (app.status === "rejected") g.rejected += 1;
    if (app.status === "ghosted") g.ghosted += 1;
    groups.set(verdict, g);
  }

  const interviews = applied.filter(
    (a) => a.status === "interview" || a.status === "offer"
  ).length;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Calibration</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {applications.length} tracked · {interviews} interview
            {interviews === 1 ? "" : "s"}
          </span>
        </div>

        {!loaded ? (
          <p className="text-xs text-muted-foreground">Loading postings…</p>
        ) : withVerdict.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Mark postings as applied to see whether the verdicts were right.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...groups.entries()].map(([verdict, g]) => {
              const style =
                VERDICT_STYLE[verdict as keyof typeof VERDICT_STYLE];
              const rate =
                g.total > 0
                  ? Math.round(((g.interview + g.offer) / g.total) * 100)
                  : 0;
              return (
                <div
                  key={verdict}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className={style?.text ?? "text-foreground"}>
                    {style?.label ?? verdict}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {g.total} applied · {rate}% interview
                  </span>
                </div>
              );
            })}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Update a status (replied / interview / offer / rejected / ghosted)
              on an application to feed this. The verdict predicts reach, not
              outcome — but a low interview rate on “open to you” postings is
              a signal the engine is over-optimistic.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
