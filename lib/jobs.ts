import type { Source } from "./types";

export function initials(name: string): string {
  const n = name || "?";
  return n
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function relativeTime(isoDate: string, now: number = 0): string {
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Days from `today` until an ISO date. Negative when already past.
 * Computed in UTC so a deadline never shifts by a day based on where the
 * browser happens to be.
 */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const target = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target)) return Number.NaN;
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return Math.round((target - start) / 86_400_000);
}

/** Short deadline label: "closes today", "closes in 3d", "closed". */
export function deadlineLabel(isoDate: string, today: Date = new Date()): string {
  const days = daysUntil(isoDate, today);
  if (Number.isNaN(days)) return "";
  if (days < 0) return "closed";
  if (days === 0) return "closes today";
  if (days === 1) return "closes tomorrow";
  if (days <= 30) return `closes in ${days}d`;
  return `closes ${isoDate}`;
}

const SOURCE_LABELS: Record<Source, string> = {
  remoteok: "RemoteOK",
  remotive: "Remotive",
  hackernews: "Hacker News",
  jobicy: "Jobicy",
  simplify: "Simplify",
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  manual: "Manual",
};

/** Display name for a feed source. One place, so the UI cannot drift. */
export function sourceLabel(source: Source): string {
  return SOURCE_LABELS[source] ?? source;
}

/** Sources offered in the source filter, in display order. */
export const SOURCE_OPTIONS: Source[] = [
  "simplify",
  "greenhouse",
  "ashby",
  "lever",
  "remoteok",
  "remotive",
  "jobicy",
  "hackernews",
  "manual",
];
