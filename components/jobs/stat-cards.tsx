"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/lib/types";

export function StatCards({ jobs }: { jobs: Job[] }) {
  const softwareCount = jobs.filter((j) => j.relevance === "software").length;
  const openCount = jobs.filter(
    (j) => j.evaluation.eligible === "yes"
  ).length;
  const unclearCount = jobs.filter(
    (j) => j.evaluation.eligible === "unclear"
  ).length;
  const fitScores = jobs
    .map((j) => j.evaluation.fitScore)
    .filter((s): s is number => s !== null);
  const avgFit =
    fitScores.length === 0
      ? 0
      : Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length);

  const stats = [
    { label: "Software jobs", value: softwareCount },
    { label: "Open to me", value: openCount },
    { label: "Unclear", value: unclearCount },
    { label: "Average fit", value: avgFit },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
