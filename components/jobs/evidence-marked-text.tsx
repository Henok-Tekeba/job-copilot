"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type EvidenceMark = {
  phrase: string;
  /** Tailwind text color class for the underline, e.g. "text-emerald-400". */
  colorClass: string;
  /** Short note shown on hover, e.g. "Requires US work authorization → Unlikely". */
  note: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders plain text with Evidence Marks: phrases that drive a verdict get a
 * 2px colored underline plus a hover note. The visual identity of the product.
 */
export function EvidenceMarkedText({
  text,
  marks,
  className,
}: {
  text: string;
  marks: EvidenceMark[];
  className?: string;
}) {
  // Deduplicate and drop empty/short phrases.
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return marks
      .filter((m) => m.phrase && m.phrase.trim().length >= 4)
      .filter((m) => {
        const key = m.phrase.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.phrase.length - a.phrase.length);
  }, [marks]);

  const parts = React.useMemo(() => {
    if (unique.length === 0) return [{ text, mark: null as EvidenceMark | null }];
    const pattern = new RegExp(
      `(${unique.map((m) => escapeRegex(m.phrase)).join("|")})`,
      "gi"
    );
    const result: { text: string; mark: EvidenceMark | null }[] = [];
    let lastIndex = 0;
    // We need to map matched substring back to a mark (case-insensitive).
    const lowerToMark = new Map(unique.map((m) => [m.phrase.toLowerCase(), m]));
    text.replace(pattern, (match, _g, offset) => {
      if (offset > lastIndex) {
        result.push({ text: text.slice(lastIndex, offset), mark: null });
      }
      const mark = lowerToMark.get(match.toLowerCase()) ?? unique.find((m) => m.phrase.toLowerCase() === match.toLowerCase()) ?? null;
      result.push({ text: match, mark });
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), mark: null });
    }
    if (result.length === 0) result.push({ text, mark: null });
    return result;
  }, [text, unique]);

  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", className)}>
      {parts.map((part, i) =>
        part.mark ? (
          <span
            key={i}
            title={part.mark.note}
            className={cn(
              "underline decoration-2 underline-offset-4",
              part.mark.colorClass
            )}
          >
            {part.text}
          </span>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </p>
  );
}