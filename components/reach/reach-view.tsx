"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/lib/types";

type Row = { label: string; count: number };

function topN(map: Map<string, number>, n: number): Row[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

export function ReachView() {
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

  const stats = React.useMemo(() => {
    const total = jobs.length;
    const reachable = jobs.filter(
      (j) => j.evaluation.eligibility?.verdict === "open"
    ).length;
    const relocation = jobs.filter(
      (j) => j.evaluation.eligibility?.verdict === "relocation"
    ).length;
    const locked = jobs.filter(
      (j) => j.evaluation.eligibility?.verdict === "region-locked"
    ).length;
    const worldwide = jobs.filter((j) =>
      (j.evaluation.eligibility?.regions ?? []).includes("worldwide")
    ).length;

    const byCompany = new Map<string, number>();
    for (const j of jobs) {
      if (j.evaluation.eligibility?.verdict !== "open") continue;
      byCompany.set(j.company, (byCompany.get(j.company) ?? 0) + 1);
    }

    const bySource = new Map<string, number>();
    for (const j of jobs) {
      bySource.set(j.source, (bySource.get(j.source) ?? 0) + 1);
    }

    return {
      total,
      reachable,
      relocation,
      locked,
      worldwide,
      topCompanies: topN(byCompany, 12),
      topSources: topN(bySource, 8),
    };
  }, [jobs]);

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading postings…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {stats.total}
            </span>
            <span className="text-xs text-muted-foreground">postings read</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tabular-nums text-emerald-400">
              {stats.reachable}
            </span>
            <span className="text-xs text-muted-foreground">open to you</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tabular-nums text-sky-400">
              {stats.relocation}
            </span>
            <span className="text-xs text-muted-foreground">need relocation</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tabular-nums text-red-400">
              {stats.locked}
            </span>
            <span className="text-xs text-muted-foreground">region locked</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Employers hiring internationally</h2>
          <div className="flex flex-col">
            {stats.topCompanies.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 text-sm"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Postings by source</h2>
          <div className="flex flex-col">
            {stats.topSources.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 text-sm"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        {stats.worldwide} of {stats.total} postings are open worldwide. Aggregated
        from the current snapshot.
      </p>
    </div>
  );
}
