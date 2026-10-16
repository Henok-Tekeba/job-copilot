"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Eligibility } from "@/lib/types";

const VERDICT_LABEL: Record<Eligibility["verdict"], string> = {
  open: "Open to you",
  "region-locked": "Region locked",
  conflict: "Conflicting signals",
  unknown: "Unknown",
};

const VERDICT_CLASS: Record<Eligibility["verdict"], string> = {
  open: "border-emerald-500/40 text-emerald-400",
  "region-locked": "border-red-500/40 text-red-400",
  conflict: "border-amber-500/40 text-amber-400",
  unknown: "border-amber-500/40 text-amber-400",
};

/**
 * Shows why a job is or is not reachable from Africa, with the field the
 * verdict came from. Evidence is the point: a verdict the user cannot inspect
 * is not worth trusting.
 */
export function EligibilityPanel({ eligibility }: { eligibility?: Eligibility }) {
  if (!eligibility) return null;

  const { verdict, summary, evidence, timezone, blockedBy, regionLabels } =
    eligibility;

  return (
    <Alert className="mx-4 w-auto">
      <AlertTitle className="flex items-center gap-2">
        <Badge variant="outline" className={VERDICT_CLASS[verdict]}>
          {VERDICT_LABEL[verdict]}
        </Badge>
        {regionLabels.length > 0 && (
          <span className="text-xs font-normal text-muted-foreground">
            {regionLabels.join(" · ")}
          </span>
        )}
      </AlertTitle>

      <AlertDescription className="flex flex-col gap-2">
        <span>{summary}</span>

        {blockedBy && (
          <span className="text-xs text-red-400">{blockedBy}</span>
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
