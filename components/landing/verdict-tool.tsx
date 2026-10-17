"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { assessEligibility } from "@/lib/eligibility";
import { extractDeadline } from "@/lib/deadline";
import { computeFit } from "@/lib/fit";
import { segmentText, detectSkills } from "@/lib/requirements";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import { useProfile } from "@/hooks/use-profile";
import { isDefaultProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Result = {
  verdict: string;
  summary: string;
  sponsorship: string | null;
  deadline: string | null;
  deadlineEvidence: string | null;
  priority: number | null;
  score: number | null;
  requiredMissing: string[];
  niceMissing: string[];
  matched: string[];
  detected: number;
};

function analyze(text: string, location: string, skills: string[]): Result {
  const eligibility = assessEligibility({
    location,
    description: text,
  });
  const { requiredText, niceText, sectionsDetected } = segmentText(text);
  const requiredSkills = detectSkills(requiredText);
  const niceToHaveSkills = detectSkills(niceText).filter(
    (s) => !requiredSkills.includes(s)
  );
  const detectedSkills = detectSkills(
    `${text}`
  );
  const deadline = extractDeadline(text);

  const fit = computeFit({
    requiredSkills,
    niceSkills: niceToHaveSkills,
    detectedSkills,
    knownSkills: new Set(skills),
    level: "intern",
    verdict: eligibility.verdict,
    sectionsDetected,
  });

  const sponsorship =
    eligibility.sponsorship?.verdict === "offered"
      ? "Sponsorship offered"
      : eligibility.sponsorship?.verdict === "not-offered"
        ? "No sponsorship"
        : null;

  return {
    verdict: eligibility.verdict,
    summary: eligibility.summary,
    sponsorship,
    deadline: deadline.deadline,
    deadlineEvidence: deadline.evidence,
    priority: fit.priority,
    score: fit.score,
    requiredMissing: fit.requiredMissing,
    niceMissing: fit.niceMissing,
    matched: fit.requiredMatched.concat(fit.niceMatched),
    detected: detectedSkills.length,
  };
}

/**
 * Paste a posting, get a verdict.
 *
 * This is the demo a YC partner actually uses: it runs the same engine that
 * scores the board, on text the visitor supplies. No account, no data, just
 * the read.
 */
export function VerdictTool() {
  const { profile } = useProfile();
  const [text, setText] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [result, setResult] = React.useState<Result | null>(null);

  const skills =
    !isDefaultProfile(profile) && profile.skills.length > 0
      ? profile.skills
      : [];

  const run = () => {
    if (!text.trim()) return;
    setResult(analyze(text, location, skills));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="verdict-text">
            Paste a posting
          </label>
          <Textarea
            id="verdict-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full job description here…"
            className="min-h-48 font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="verdict-loc">
            Location (optional)
          </label>
          <Input
            id="verdict-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Remote, EMEA"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={!text.trim()}>
            <SearchIcon />
            Read this posting
          </Button>
          {skills.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Set your skills on the board for a personal fit.
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!result ? (
          <div className="flex h-full min-h-40 items-center justify-center border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            The verdict, the missing skills, and the deadline appear here.
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
              <span
                className={cn(
                  "text-lg font-medium",
                  VERDICT_STYLE[result.verdict as keyof typeof VERDICT_STYLE]?.text ??
                    "text-foreground"
                )}
              >
                {VERDICT_STYLE[result.verdict as keyof typeof VERDICT_STYLE]
                  ?.label ?? result.verdict}
              </span>
              {result.sponsorship && (
                <span className="text-xs text-muted-foreground">
                  {result.sponsorship}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.summary}
            </p>

            <div className="flex items-baseline gap-3 border-b border-border pb-3">
              <span className="font-mono text-3xl leading-none font-semibold tabular-nums">
                {result.priority ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                priority
                {result.score !== null ? ` · ${result.score} skill fit` : ""}
              </span>
            </div>

            {result.requiredMissing.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  You lack
                </span>
                <div className="flex flex-wrap gap-1">
                  {result.requiredMissing.map((s) => (
                    <Badge key={s} variant="outline" className="border-dashed">
                      {s}
                    </Badge>
                  ))}
                  {result.niceMissing.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.requiredMissing.length === 0 &&
              result.detected > 0 &&
              result.matched.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  You meet every detected requirement.
                </p>
              )}

            {result.deadline && (
              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Deadline
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {result.deadline}
                </span>
                {result.deadlineEvidence && (
                  <span className="text-xs text-muted-foreground">
                    {result.deadlineEvidence}
                  </span>
                )}
              </div>
            )}

            <Separator />
            <span className="text-xs text-muted-foreground">
              {result.matched.length} of {result.detected} detected skills matched.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
