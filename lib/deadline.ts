/**
 * Deadline extraction.
 *
 * Internships are deadline-driven: a posting found two days late is worthless.
 * We only extract a date when it sits next to an explicit deadline label, so we
 * never mistake "founded in 2015" for an application cutoff.
 */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Labels that reliably introduce an application cutoff. */
const DEADLINE_LABEL =
  /(application deadline|applications? (close|closes|closed|deadline)|apply by|apply before|last date to apply|closing date|closes on|deadline|expires?( on)?|open until|submit by)/i;

/**
 * Month names. The outer group captures the month; the inner groups must stay
 * non-capturing or they shift the indices of the day/year groups.
 */
const MONTH_NAME =
  "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function monthNumber(name: string): number | undefined {
  const lower = name.toLowerCase();
  return (
    MONTHS[lower] ?? MONTHS[lower.slice(0, 4)] ?? MONTHS[lower.slice(0, 3)]
  );
}

type ParsedDate = [year: number, month: number | undefined, day: number];

const DATE_PATTERNS: Array<{ re: RegExp; parse: (m: RegExpMatchArray) => ParsedDate }> = [
  // December 23, 2025  /  Dec 23 2025   -> m1=month m2=day m3=year
  {
    re: new RegExp(`\\b${MONTH_NAME}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "i"),
    parse: (m) => [Number(m[3]), monthNumber(m[1]!), Number(m[2])],
  },
  // 23 December 2025  /  13 Nov 2026   -> m1=day m2=month m3=year
  {
    re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_NAME},?\\s+(\\d{4})\\b`, "i"),
    parse: (m) => [Number(m[3]), monthNumber(m[2]!), Number(m[1])],
  },
  // 2026-11-13   -> m1=year m2=month m3=day
  {
    re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
    parse: (m) => [Number(m[1]), Number(m[2]), Number(m[3])],
  },
  // 11/13/2026 (US ordering, which is what these feeds use)  -> m1=month m2=day m3=year
  {
    re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
    parse: (m) => [Number(m[3]), Number(m[1]), Number(m[2])],
  },
];

function toIso(year: number, month: number | undefined, day: number): string | null {
  if (!month || month < 1 || month > 12) return null;
  if (!day || day < 1 || day > 31) return null;
  if (year < 2000 || year > 2100) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates like 2026-02-31.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return date.toISOString().slice(0, 10);
}

function findDateIn(chunk: string): { iso: string; raw: string } | null {
  for (const { re, parse } of DATE_PATTERNS) {
    const match = chunk.match(re);
    if (!match) continue;
    const parts = parse(match);
    if (!parts) continue;
    const iso = toIso(parts[0], parts[1], parts[2]);
    if (iso) return { iso, raw: match[0] };
  }
  return null;
}

export type DeadlineResult = {
  /** ISO date (YYYY-MM-DD) or null when nothing confident was found. */
  deadline: string | null;
  /** The text the deadline was read from, for display. */
  evidence: string | null;
  /** True when the deadline is in the past. */
  expired: boolean;
};

/**
 * Extract an application deadline from posting text.
 *
 * @param text   Plain text (HTML already stripped).
 * @param today  Reference date, defaults to now.
 */
export function extractDeadline(
  text: string | null | undefined,
  today: Date = new Date()
): DeadlineResult {
  const empty: DeadlineResult = { deadline: null, evidence: null, expired: false };
  if (!text) return empty;

  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const cutoff = today.toISOString().slice(0, 10);

  // Walk every deadline label and look at the text immediately after it.
  const labelRe = new RegExp(DEADLINE_LABEL.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = labelRe.exec(plain)) !== null) {
    const window = plain.slice(match.index, match.index + 90);
    const found = findDateIn(window);
    if (!found) continue;

    return {
      deadline: found.iso,
      evidence: window.trim().slice(0, 120),
      expired: found.iso < cutoff,
    };
  }

  return empty;
}
