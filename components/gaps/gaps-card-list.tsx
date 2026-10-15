"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Job } from "@/lib/types";

type SkillRow = {
  skill: string;
  count: number;
  jobs: Job[];
  hasSkill: boolean;
};

type GapsCardListProps = {
  rows: SkillRow[];
  totalJobs: number;
  onSelect: (skill: string) => void;
};

export function GapsCardList({ rows, totalJobs, onSelect }: GapsCardListProps) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No missing skills — you have them all.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {rows.map((row) => {
        const pct = Math.round((row.count / totalJobs) * 100);
        return (
          <Card
            key={row.skill}
            size="sm"
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => onSelect(row.skill)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(row.skill);
              }
            }}
          >
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {row.skill}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {row.hasSkill && (
                    <Badge variant="secondary">You have it</Badge>
                  )}
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {row.count} jobs · {pct}%
                  </span>
                </div>
              </div>
              <Progress value={pct} className="w-full" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
