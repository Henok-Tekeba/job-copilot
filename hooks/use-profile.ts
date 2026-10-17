"use client";

import * as React from "react";
import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY, type Profile } from "@/lib/profile";

const EMPTY_JSON = JSON.stringify(DEFAULT_PROFILE);

const listeners = new Set<() => void>();
let cached: string | null = null;

function read(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      active: Boolean(parsed.active),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function write(next: Profile) {
  cached = JSON.stringify(next);
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, cached);
  } catch {
    // Storage full or unavailable; state still works for this session.
  }
  listeners.forEach((l) => l());
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

export type ProfileApi = {
  profile: Profile;
  setSkills: (skills: string[]) => void;
  toggleSkill: (skill: string) => void;
  setActive: (active: boolean) => void;
  clear: () => void;
  hydrated: boolean;
};

export function useProfile(): ProfileApi {
  const raw = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const profile = React.useMemo(() => JSON.parse(raw) as Profile, [raw]);

  return React.useMemo(
    () => ({
      profile,
      setSkills: (skills: string[]) => write({ ...profile, skills }),
      toggleSkill: (skill: string) =>
        write({
          ...profile,
          skills: profile.skills.includes(skill)
            ? profile.skills.filter((s) => s !== skill)
            : [...profile.skills, skill],
        }),
      setActive: (active: boolean) => write({ ...profile, active }),
      clear: () => write(DEFAULT_PROFILE),
      hydrated: cached !== null,
    }),
    [profile]
  );
}
