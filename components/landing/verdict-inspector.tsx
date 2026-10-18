"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DeadlineBadge } from "@/components/jobs/deadline-badge";
import { isUnstatedLocation, type Workplace } from "@/lib/regions";
import { EVIDENCE_FIELD_LABELS, VERDICT_STYLE } from "@/lib/verdict-style";
import { cn } from "@/lib/utils";
import type { EligibilityVerdict } from "@/lib/types";

/** One posting from the snapshot, reduced to what the inspector shows. */
export type LandingSample = {
  id: string;
  company: string;
  title: string;
  location: string;
  verdict: EligibilityVerdict;
  workplace?: Workplace;
  summary: string;
  evidence: Array<{ field: string; value: string }>;
  missing: string[];
  deadline: string | null;
};

/**
 * The landing page's one loud element: real postings carrying real verdicts.
 * The list is the choice; the panel is the read the board gives that posting —
 * verdict, reason, gap, and the field it all came from.
 */
export function VerdictInspector({ samples }: { samples: LandingSample[] }) {
  const [selectedId, setSelectedId] = React.useState(samples[0]?.id ?? "");
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[0];

  if (!selected) return null;

  return (
    <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-[minmax(0,17rem)_1fr]">
      <ToggleGroup
        orientation="vertical"
        value={[selected.id]}
        onValueChange={(value) => {
          const next = value[0];
          if (next) setSelectedId(next);
        }}
        spacing={0}
        className="w-full divide-y divide-border border-b border-border sm:border-b-0 sm:border-r"
      >
        {samples.map((sample) => (
          <ToggleGroupItem
            key={sample.id}
            value={sample.id}
            className="h-auto w-full items-start justify-start gap-3 rounded-none px-4 py-3 text-left whitespace-normal text-muted-foreground aria-pressed:text-foreground data-[pressed]:text-foreground"
          >
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                VERDICT_STYLE[sample.verdict].dot
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {sample.company}
              </span>
              <span className="block truncate text-xs">{sample.title}</span>
            </span>
            <span className="sr-only">
              {VERDICT_STYLE[sample.verdict].label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div
        key={selected.id}
        className="flex animate-in flex-col gap-4 p-4 fade-in slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none motion-reduce:transition-none sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={VERDICT_STYLE[selected.verdict].badge}
          >
            {VERDICT_STYLE[selected.verdict].label}
          </Badge>
          {selected.workplace && selected.workplace !== "unknown" && (
            <Badge variant="secondary" className="capitalize">
              {selected.workplace}
            </Badge>
          )}
          <DeadlineBadge deadline={selected.deadline} />
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{selected.title}</p>
          <p className="text-xs text-muted-foreground">
            {[
              selected.company,
              isUnstatedLocation(selected.location) ? "" : selected.location,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        <p className="text-sm leading-relaxed">{selected.summary}</p>

        {selected.missing.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Required — you lack
            </span>
            <div className="flex flex-wrap gap-1">
              {selected.missing.map((skill) => (
                <Badge key={skill} variant="outline" className="border-dashed">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {selected.evidence.length > 0 && (
          <div className="flex flex-col gap-0.5 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Read from the posting
            </span>
            {selected.evidence.map((item, i) => (
              <span key={i} className="text-xs">
                <span className="text-muted-foreground">
                  {EVIDENCE_FIELD_LABELS[item.field] ?? item.field}:{" "}
                </span>
                {isUnstatedLocation(item.value) ? (
                  <span className="italic text-muted-foreground">
                    not stated
                  </span>
                ) : (
                  <span className="font-mono">{item.value}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
