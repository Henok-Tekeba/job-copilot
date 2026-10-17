"use client";

import * as React from "react";

import type { Application, Job, Status } from "@/lib/types";

/**
 * The browser-side database for a static site.
 *
 * Holds the triage state (saved, dismissed), full application records with
 * status history and notes, and per-job notes from the detail page. Persisted
 * to localStorage and synced across tabs.
 *
 * useSyncExternalStore keeps the prerender consistent: the server snapshot is
 * empty, so there is no hydration mismatch, and the real state arrives as soon
 * as the browser reads storage.
 */

const STORAGE_KEY = "job-copilot:tracked-v2";

export type TrackedState = {
  saved: string[];
  dismissed: string[];
  applications: Application[];
  /** Notes written on a job's detail page, keyed by job id. */
  jobNotes: Record<string, string>;
};

const EMPTY: TrackedState = {
  saved: [],
  dismissed: [],
  applications: [],
  jobNotes: {},
};
const EMPTY_JSON = JSON.stringify(EMPTY);

const listeners = new Set<() => void>();
let cached: string | null = null;

function read(): TrackedState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? EMPTY_JSON
    ) as Partial<TrackedState>;
    return {
      saved: parsed.saved ?? [],
      dismissed: parsed.dismissed ?? [],
      applications: parsed.applications ?? [],
      jobNotes: parsed.jobNotes ?? {},
    };
  } catch {
    return EMPTY;
  }
}

function write(next: TrackedState) {
  cached = JSON.stringify(next);
  try {
    localStorage.setItem(STORAGE_KEY, cached);
  } catch {
    // Storage full or unavailable; state still works for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => {
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  if (cached === null) cached = JSON.stringify(read());
  return cached;
}

function getServerSnapshot(): string {
  return EMPTY_JSON;
}

function mutate(fn: (state: TrackedState) => TrackedState) {
  write(fn(read()));
}

function isoDay(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function makeApplication(job: Job): Application {
  const now = new Date().toISOString();
  return {
    id: `app-${job.id}`,
    jobId: job.id,
    snapshot: {
      title: job.title,
      company: job.company,
      url: job.applyUrl || job.sourceUrl,
      source: job.source,
    },
    appliedAt: now.slice(0, 10),
    status: "applied",
    followUpAt: isoDay(7),
    notes: "",
    statusHistory: [{ status: "applied", at: now }],
  };
}

const FOLLOW_UP_DAYS: Record<Status, number> = {
  applied: 7,
  replied: 5,
  interview: 3,
  offer: 7,
  rejected: 0,
  ghosted: 14,
};

export type TrackedJobs = {
  saved: Set<string>;
  dismissed: Set<string>;
  applied: Set<string>;
  applications: Application[];
  /** True once storage has been read. */
  hydrated: boolean;
  jobNotesFor: (jobId: string) => string;
  toggleSaved: (id: string) => void;
  dismiss: (id: string) => void;
  markApplied: (job: Job) => void;
  unmarkApplied: (jobId: string) => void;
  isApplied: (jobId: string) => boolean;
  setStatus: (id: string, status: Status) => void;
  setNotes: (id: string, notes: string) => void;
  setJobNotes: (jobId: string, notes: string) => void;
  addApplication: (input: {
    title: string;
    company: string;
    url: string;
    appliedAt: string;
    notes: string;
  }) => void;
  removeApplication: (id: string) => void;
};

export function useTrackedJobs(): TrackedJobs {
  const raw = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = React.useMemo(() => JSON.parse(raw) as TrackedState, [raw]);

  return React.useMemo(
    () => ({
      saved: new Set(state.saved),
      dismissed: new Set(state.dismissed),
      applied: new Set(
        state.applications
          .map((a) => a.jobId)
          .filter((id): id is string => Boolean(id))
      ),
      applications: state.applications,
      hydrated: cached !== null,
      jobNotesFor: (jobId: string) => state.jobNotes[jobId] ?? "",
      toggleSaved: (id: string) =>
        mutate((s) => ({
          ...s,
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      dismiss: (id: string) =>
        mutate((s) => ({
          ...s,
          saved: s.saved.filter((x) => x !== id),
          dismissed: s.dismissed.includes(id)
            ? s.dismissed
            : [...s.dismissed, id],
        })),
      markApplied: (job: Job) =>
        mutate((s) =>
          s.applications.some((a) => a.jobId === job.id)
            ? s
            : { ...s, applications: [makeApplication(job), ...s.applications] }
        ),
      unmarkApplied: (jobId: string) =>
        mutate((s) => ({
          ...s,
          applications: s.applications.filter((a) => a.jobId !== jobId),
        })),
      isApplied: (jobId: string) =>
        state.applications.some((a) => a.jobId === jobId),
      setStatus: (id: string, status: Status) =>
        mutate((s) => ({
          ...s,
          applications: s.applications.map((a) => {
            if (a.id !== id) return a;
            const at = new Date().toISOString();
            return {
              ...a,
              status,
              followUpAt:
                FOLLOW_UP_DAYS[status] > 0 ? isoDay(FOLLOW_UP_DAYS[status]) : a.followUpAt,
              statusHistory: [...a.statusHistory, { status, at }],
            };
          }),
        })),
      setNotes: (id: string, notes: string) =>
        mutate((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, notes } : a
          ),
        })),
      setJobNotes: (jobId: string, notes: string) =>
        mutate((s) => ({
          ...s,
          jobNotes: { ...s.jobNotes, [jobId]: notes },
        })),
      addApplication: (input) =>
        mutate((s) => {
          const now = new Date().toISOString();
          const record: Application = {
            id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            jobId: null,
            snapshot: {
              title: input.title,
              company: input.company,
              url: input.url,
              source: "manual",
            },
            appliedAt: input.appliedAt,
            status: "applied",
            followUpAt: isoDay(7),
            notes: input.notes,
            statusHistory: [{ status: "applied", at: now }],
          };
          return { ...s, applications: [record, ...s.applications] };
        }),
      removeApplication: (id: string) =>
        mutate((s) => ({
          ...s,
          applications: s.applications.filter((a) => a.id !== id),
        })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from `raw`
    [raw]
  );
}
