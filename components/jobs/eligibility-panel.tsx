"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { REGION_LABELS, isUnstatedLocation } from "@/lib/regions";
import { EVIDENCE_FIELD_LABELS, VERDICT_STYLE } from "@/lib/verdict-style";
import { workplaceLabel } from "@/lib/labels";import type { Eligibility } from "@/lib/types";

/**
 * The verdict, as the spine of the posting.
 *
 * Shows why a job is or is not reachable, with the field the verdict came from.
 * Evidence is the point: a verdict the user cannot inspect is not worth
 * trusting. Set as a ruled block rather than an alert, so it reads as the
 * answer to the page's question instead of a warning that happened to appear.
 */
export function EligibilityPanel({ eligibility }: { eligibility?: Eligibility }) {
  if (!eligibility) return null;

  const { verdict, summary, evidence, timezone, blockedBy } = eligibility;
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
    <section className="flex flex-col gap-3 border-l-2 border-[#14141a] py-1 pl-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#14141a]">
          {VERDICT_STYLE[verdict].label}
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {workplace && workplace !== "unknown" && (
          <Badge variant="outline">{workplaceLabel(workplace)}</Badge>
        )}
        {sponsorshipLabel && (
          <Badge variant="outline">{sponsorshipLabel}</Badge>
        )}
        {regionLabels.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {regionLabels.join(" · ")}
          </span>
        )}
      </div>

      {blockedBy && <p className="text-xs text-[#5c5c64]">{blockedBy}</p>}

      {timezone.required && (
        <p className="text-xs text-muted-foreground">
          Timezone: {timezone.required}
          {timezone.overlapsAfrica === false && " — poor overlap with East Africa"}
          {timezone.overlapsAfrica === true && " — good overlap with East Africa"}
        </p>
      )}

      {evidence.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Read from the posting
            </span>
            {evidence.map((item, i) => (
              <span key={i} className="text-xs">
                <span className="text-muted-foreground">
                  {EVIDENCE_FIELD_LABELS[item.field] ?? item.field}:{" "}
                </span>
                {isUnstatedLocation(item.value) ? (
                  <span className="italic text-muted-foreground">not stated</span>
                ) : (
                  <span className="text-[#14141a]">{item.value}</span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
