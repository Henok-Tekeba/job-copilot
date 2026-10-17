"use client";

import * as React from "react";

/**
 * Per-job triage state, persisted in localStorage.
 *
 * The site is a static export, so "track my applications" has to live in the
 * browser. This is the skeleton of that: saved, applied and dismissed are three
 * independent marks, written to localStorage and synced across tabs.
 *
 * useSyncExternalStore keeps the first paint consistent with the prerender:
 * the server snapshot is always empty, so there is no hydration mismatch, and
 * the real state arrives as soon as the browser reads storage.
 */

const STORAGE_KEY = "job-copilot:tracked";

export type TrackedState = {
  saved: string[];
  applied: string[];
  dismissed: string[];
};

const EMPTY: TrackedState = { saved: [], applied: [], dismissed: [] };
const EMPTY_JSON = JSON.stringify(EMPTY);

const listeners = new Set<() => void>();
let cached: string | null = null;

function read(): TrackedState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? EMPTY_JSON) as TrackedState;
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

export type TrackedJobs = {
  saved: Set<string>;
  applied: Set<string>;
  dismissed: Set<string>;
  /** True once storage has been read, so the UI can defer until then. */
  hydrated: boolean;
  toggleSaved: (id: string) => void;
  markApplied: (id: string) => void;
  unmarkApplied: (id: string) => void;
  dismiss: (id: string) => void;
  undismiss: (id: string) => void;
  clear: () => void;
};

export function useTrackedJobs(): TrackedJobs {
  const raw = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = React.useMemo(() => JSON.parse(raw) as TrackedState, [raw]);

  return React.useMemo(
    () => ({
      saved: new Set(state.saved),
      applied: new Set(state.applied),
      dismissed: new Set(state.dismissed),
      hydrated: raw !== EMPTY_JSON || cached !== null,
      toggleSaved: (id: string) =>
        mutate((s) => ({
          ...s,
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      markApplied: (id: string) =>
        mutate((s) => ({
          ...s,
          applied: s.applied.includes(id) ? s.applied : [...s.applied, id],
        })),
      unmarkApplied: (id: string) =>
        mutate((s) => ({
          ...s,
          applied: s.applied.filter((x) => x !== id),
        })),
      dismiss: (id: string) =>
        mutate((s) => ({
          ...s,
          saved: s.saved.filter((x) => x !== id),
          dismissed: s.dismissed.includes(id)
            ? s.dismissed
            : [...s.dismissed, id],
        })),
      undismiss: (id: string) =>
        mutate((s) => ({
          ...s,
          dismissed: s.dismissed.filter((x) => x !== id),
        })),
      clear: () => write(EMPTY),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from `raw`
    [raw]
  );
}
