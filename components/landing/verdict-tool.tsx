"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { detectTextStance } from "@/engine/textStance";
import { combineVerdict, type Verdict } from "@/engine/verdict";
import { normaliseCompanyName } from "@/engine/companyName";
import { ENGINE_STYLE } from "@/lib/verdict-style";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __companyRecords?: Record<string, unknown>;
    __companyRecordsSource?: { name: string; dataYear: string };
  }
}

/**
 * The landing demo: paste a posting, watch the same engine that scores the
 * board read it in the browser. No account, no upload — the text never
 * leaves the page. An optional company name lets the engine check company
 * records for postings that are silent.
 */

const NEXT_STEP: Record<Verdict["status"], string> = {
  open: "Apply — and say plainly in your first line that you would need sponsorship.",
  likely: "Apply — the record is your evidence. Mention their sponsorship history when you write.",
  unclear: "Nothing in the posting says either way. That is common. Apply anyway, or ask the recruiter one direct question.",
  unlikely: "Skip this one unless you already have the right to work there. Spend the time where the door is open.",
};

export function VerdictTool() {
  const [text, setText] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [verdict, setVerdict] = React.useState<Verdict | null>(null);

  const run = React.useCallback(() => {
    if (!text.trim()) return;
    const stance = detectTextStance(text);
    // In the browser the records lookup is fetched once and cached; a miss
    // simply means the verdict rests on the text alone.
    const record = company
      ? (window.__companyRecords?.[normaliseCompanyName(company)] as Record<string, unknown> | undefined)
      : undefined;
    setVerdict(
      combineVerdict({
        textStance: stance,
        company,
        record,
        recordMatchConfidence: record ? 1 : 0,
        provenance: window.__companyRecordsSource,
      })
    );
  }, [text, company]);

  React.useEffect(() => {
    // Load the company records lookup lazily, on first use.
    if (window.__companyRecords) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${basePath}/company-records.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        window.__companyRecords = data.records;
        const source = data.meta?.sources?.[0];
        if (source) {
          window.__companyRecordsSource = { name: "UK Home Office sponsor register", dataYear: source.dataYear };
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a job posting…"
        aria-label="Paste a job posting"
        className="min-h-40 border-border bg-card font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={!text.trim()} size="sm">
          Read it
        </Button>
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          aria-label="Company name, optional"
          className="h-8 w-48 border-border bg-card text-xs"
        />
      </div>

      <div aria-live="polite">
        {verdict ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", ENGINE_STYLE[verdict.status].text)}>
                {ENGINE_STYLE[verdict.status].label}
              </span>
              <span
                className="inline-flex items-center gap-0.5"
                aria-label={`Confidence ${Math.round(verdict.confidence * 100)}%`}
                title={`Confidence ${Math.round(verdict.confidence * 100)}%`}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-1 rounded-full",
                      i < Math.min(3, Math.max(1, Math.round(verdict.confidence * 3)))
                        ? cn("bg-current", ENGINE_STYLE[verdict.status].text)
                        : "bg-current opacity-25"
                    )}
                  />
                ))}
              </span>
            </div>

            {verdict.reasons.map((reason, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm leading-relaxed text-muted-foreground">{reason.summary}</p>
                {reason.quote && (
                  <p className={cn("border-l-2 pl-3 font-mono text-xs leading-relaxed", ENGINE_STYLE[verdict.status].text)}>
                    “{reason.quote}”
                  </p>
                )}
                {reason.record && (
                  <p className="text-xs text-muted-foreground">
                    {reason.record.detail} — {reason.record.source}, {reason.record.dataYear}
                  </p>
                )}
              </div>
            ))}

            <p className="text-sm text-foreground">{NEXT_STEP[verdict.status]}</p>
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            The verdict, its evidence, and what to do next appear here.
          </p>
        )}
      </div>
    </div>
  );
}
