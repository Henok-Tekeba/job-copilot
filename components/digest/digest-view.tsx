"use client";

import * as React from "react";
import { CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/jobs/deadline-badge";
import { useProfile } from "@/hooks/use-profile";
import { isDefaultProfile, applyProfile } from "@/lib/profile";
import { daysUntil } from "@/lib/jobs";
import type { Job } from "@/lib/types";

function buildDigest(jobs: Job[], profileSkills: string[]) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const scored = jobs.map((j) =>
    isDefaultProfile({ skills: profileSkills, active: profileSkills.length > 0 })
      ? j
      : applyProfile(j, profileSkills)
  );

  const newThisWeek = scored
    .filter((j) => {
      if (!j.postedAt) return false;
      const d = Date.parse(j.postedAt);
      return !Number.isNaN(d) && d >= weekAgo.getTime();
    })
    .sort((a, b) => (b.evaluation.fit?.priority ?? 0) - (a.evaluation.fit?.priority ?? 0))
    .slice(0, 12);

  const closingSoon = scored
    .filter((j) => {
      if (!j.deadline) return false;
      const days = daysUntil(j.deadline, now);
      return !Number.isNaN(days) && days >= 0 && days <= 14;
    })
    .sort((a, b) => {
      const da = daysUntil(a.deadline!, now);
      const db = daysUntil(b.deadline!, now);
      return da - db;
    })
    .slice(0, 8);

  return { newThisWeek, closingSoon };
}

export function DigestView() {
  const { profile } = useProfile();
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

  const { newThisWeek, closingSoon } = React.useMemo(() => {
    const skills = profile.active ? profile.skills : [];
    return buildDigest(jobs, skills);
  }, [jobs, profile.active, profile.skills]);

  const digestText = React.useMemo(() => {
    const lines: string[] = [];
    lines.push("Job Copilot — weekly digest");
    lines.push("");
    if (newThisWeek.length > 0) {
      lines.push("New this week");
      for (const j of newThisWeek) {
        lines.push(
          `- ${j.title} · ${j.company} · priority ${j.evaluation.fit?.priority ?? "—"}`
        );
      }
      lines.push("");
    }
    if (closingSoon.length > 0) {
      lines.push("Closing soon");
      for (const j of closingSoon) {
        lines.push(`- ${j.title} · ${j.company} · closes ${j.deadline}`);
      }
      lines.push("");
    }
    if (newThisWeek.length === 0 && closingSoon.length === 0) {
      lines.push("Nothing new this week. Check back soon.");
    }
    return lines.join("\n");
  }, [newThisWeek, closingSoon]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(digestText);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {profile.active
            ? `Scored for your ${profile.skills.length} skills.`
            : "Scored for the default profile. Add your skills on the board for a personal digest."}
        </p>
        <Button variant="outline" size="sm" onClick={copy}>
          <CopyIcon />
          Copy as text
        </Button>
      </div>

      {!loaded ? (
        <p className="text-sm text-muted-foreground">Loading postings…</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-base font-semibold tracking-tight">New this week</h2>
            {newThisWeek.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No new postings in the last 7 days.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {newThisWeek.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-baseline justify-between gap-3 border-b border-border py-2"
                  >
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium">{job.title}</span>
                      <span className="ml-2 truncate text-xs text-muted-foreground">
                        {job.company}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {job.evaluation.fit?.priority ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-base font-semibold tracking-tight">Closing soon</h2>
            {closingSoon.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nothing closing in the next 14 days.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {closingSoon.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-baseline justify-between gap-3 border-b border-border py-2"
                  >
                    <div className="min-w-0">
                      <span className="truncate text-sm font-medium">{job.title}</span>
                      <span className="ml-2 truncate text-xs text-muted-foreground">
                        {job.company}
                      </span>
                    </div>
                    <DeadlineBadge deadline={job.deadline} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Sending this by email needs a backend.
              </span>
              <p className="text-xs text-muted-foreground">
                This page previews the digest content. Wiring an actual send
                (Resend/Postmark + a cron) is a separate decision — flag it
                when you want it.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
