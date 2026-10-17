"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { REGION_LABELS } from "@/lib/regions";
import { VERDICT_STYLE } from "@/lib/verdict-style";
import type { Eligibility } from "@/lib/types";


/**
 * Shows why a job is or is not reachable from Africa, with the field the
 * verdict came from. Evidence is the point: a verdict the user cannot inspect
 * is not worth trusting.
 */
export function EligibilityPanel({ eligibility }: { eligibility?: Eligibility }) {
  if (!eligibility) return null;

  const { verdict, summary, evidence, timezone, blockedBy } = eligibility;
  // Derived rather than stored: the label list was duplicated bytes in every job.
  const regionLabels = eligibility.regions.map((r) => REGION_LABELS[r]);

  const sponsorship = eligibility.sponsorship;
  const workplace = eligibility.workplace;

  const sponsorshipLabel =
    sponsorship?.verdict === "offered"
      ? "Sponsorship offered"
      : sponsorship?.verdict === "not-offered"
        ? "No sponsorship"
        : null;

  return (
    <Alert className="mx-4 w-auto">
      <AlertTitle className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={VERDICT_STYLE[verdict].badge}>
          {VERDICT_STYLE[verdict].label}
        </Badge>
        {workplace && workplace !== "unknown" && (
          <Badge variant="secondary" className="capitalize">
            {workplace}
          </Badge>
        )}
        {sponsorshipLabel && (
          <Badge
            variant="outline"
            className={
              sponsorship?.verdict === "offered"
                ? VERDICT_STYLE.open.badge
                : VERDICT_STYLE["region-locked"].badge
            }
          >
            {sponsorshipLabel}
          </Badge>
        )}
        {regionLabels.length > 0 && (
          <span className="text-xs font-normal text-muted-foreground">
            {regionLabels.join(" · ")}
          </span>
        )}
      </AlertTitle>

      <AlertDescription className="flex flex-col gap-2">
        <span>{summary}</span>

        {blockedBy && <span className="text-xs text-destructive">{blockedBy}</span>}

        {sponsorship && sponsorship.signals.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Sponsorship evidence: {sponsorship.signals.join(", ")}
          </span>
        )}

        {timezone.required && (
          <span className="text-xs text-muted-foreground">
            Timezone: {timezone.required}
            {timezone.overlapsAfrica === false && " — poor overlap with East Africa"}
            {timezone.overlapsAfrica === true && " — good overlap with East Africa"}
          </span>
        )}

        {evidence.length > 0 && (
          <div className="flex flex-col gap-0.5 border-t border-border pt-2">
            {evidence.map((item, i) => (
              <span key={i} className="text-xs">
                <span className="text-muted-foreground">{item.field}: </span>
                <span className="font-mono">{item.value}</span>
              </span>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
