"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, SearchIcon } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { useProfile } from "@/hooks/use-profile";
import { canonicalizeSkill, type Track } from "@/lib/skill-catalog";
import { cn } from "cn";

type Demand = Array<[string, number]>;

/**
 * The skill picker: one raised card on the white stage. Pick a track to
 * reveal its chips, tap the skills you know (ranked by what the board
 * actually demands), or type your own. Saving writes the browser-local
 * profile; the board then shows a personal Match % on every row.
 */
export function SkillsPicker({
  demand,
  tracks,
  canonicalSkills,
}: {
  demand: Demand;
  tracks: Track[];
  canonicalSkills: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setSkills, setActive } = useProfile();

  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(profile.active ? profile.skills : []),
  );
  const [activeTracks, setActiveTracks] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");

  const demandMap = React.useMemo(() => new Map(demand), [demand]);
  const canonicalSet = React.useMemo(() => new Set(canonicalSkills), [canonicalSkills]);

  const trackSkills = React.useMemo(() => {
    if (activeTracks.size === 0) return [];
    return tracks
      .filter((t) => activeTracks.has(t.id))
      .flatMap((t) => t.skills)
      .filter((s, i, all) => all.indexOf(s) === i);
  }, [activeTracks, tracks]);

  // With tracks picked, "most in demand" means within those tracks — sorted by
  // how often the board asks for each.
  const demanded = React.useMemo(() => {
    if (activeTracks.size === 0) {
      return demand.filter(([s]) => canonicalSet.has(s)).slice(0, 18).map(([s]) => s);
    }
    return trackSkills
      .filter((s) => demandMap.has(s))
      .sort((a, b) => (demandMap.get(b) ?? 0) - (demandMap.get(a) ?? 0))
      .slice(0, 18);
  }, [activeTracks.size, demand, canonicalSet, trackSkills, demandMap]);

  const demandLabel =
    activeTracks.size === 0
      ? "Most in demand on the board"
      : "Most in demand for your tracks";

  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return canonicalSkills.filter((s) => s.toLowerCase().includes(q)).slice(0, 12);
  }, [query, canonicalSkills]);

  const toggle = (skill: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });

  const addFreeText = () => {
    const canonical = canonicalizeSkill(query);
    if (canonical) {
      toggle(canonical);
    } else if (query.trim().length >= 2) {
      toggle(query.trim());
    }
    setQuery("");
  };

  const save = () => {
    const skills = [...selected];
    setSkills(skills);
    setActive(skills.length > 0);
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    const country = searchParams.get("country");
    if (search) params.set("search", search);
    if (country) params.set("country", country);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  };

  const chip = (skill: string) => {
    const active = selected.has(skill);
    const count = demandMap.get(skill);
    return (
      <button
        key={skill}
        type="button"
        onClick={() => toggle(skill)}
        aria-pressed={active}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium transition-colors",
          active
            ? "border-[#2b4bf2] bg-[#2b4bf2] text-white"
            : "border-[#e9e9ee] bg-white text-[#5c5c64] hover:border-[#c9c9cf] hover:text-[#14141a]",
        )}
      >
        {skill}
        {count ? (
          <span
            className={cn(
              "font-mono text-[10.5px] tabular-nums",
              active ? "text-white/70" : "text-[#6f6f78]",
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <main className="flex min-h-dvh flex-col bg-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex h-10 w-full max-w-[900px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#2b4bf2] text-white">
            <LogoMark className="size-4.5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#14141a]">
            shortlist
          </span>
        </Link>
        <Link
          href="/jobs"
          className="text-[13px] font-medium text-[#5c5c64] transition-colors hover:text-[#14141a]"
        >
          Board
        </Link>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[900px] rounded-[28px] border border-[#ececf0] bg-white px-6 py-8 shadow-[0_24px_64px_-28px_rgba(15,15,30,0.25)] sm:px-10 sm:py-10">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.02em] text-[#14141a]">
          Pick your skills
        </h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#6f6f78]">
          Every internship on the board is re-graded against what you pick —
          you will see a personal Match % on every row. Everything stays in this
          browser.
        </p>

        {/* Tracks */}
        <div className="mt-8">
          <p className="text-[13px] font-semibold text-[#14141a]">
            Start with a track
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tracks.map((track) => {
              const active = activeTracks.has(track.id);
              return (
                <button
                  key={track.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setActiveTracks((prev) => {
                      const next = new Set(prev);
                      if (next.has(track.id)) next.delete(track.id);
                      else next.add(track.id);
                      return next;
                    })
                  }
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-5 text-[14px] font-medium transition-colors",
                    active
                      ? "border-[#14141a] bg-[#14141a] text-white"
                      : "border-[#e9e9ee] bg-white text-[#5c5c64] hover:border-[#c9c9cf] hover:text-[#14141a]",
                  )}
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Most in demand */}
        <div className="mt-8">
          <p className="text-[13px] font-semibold text-[#14141a]">
            {demandLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">{demanded.map((s) => chip(s))}</div>
        </div>

        {/* Track skills */}
        {trackSkills.length > 0 && (
          <div className="mt-8">
            <p className="text-[13px] font-semibold text-[#14141a]">
              Your tracks
            </p>
            <div className="mt-3 flex flex-wrap gap-2">{trackSkills.map((s) => chip(s))}</div>
          </div>
        )}

        {/* Free text */}
        <div className="mt-8">
          <p className="text-[13px] font-semibold text-[#14141a]">
            Add anything else
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg border border-[#e9e9ee] bg-white px-3">
              <SearchIcon className="size-3.5 shrink-0 text-[#6f6f78]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFreeText();
                  }
                }}
                placeholder="e.g. GraphQL, Kubernetes, Figma…"
                aria-label="Add a skill"
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13.5px] text-[#14141a] outline-none placeholder:text-[#9c9ca4]"
              />
            </div>
            <button
              type="button"
              onClick={addFreeText}
              disabled={!query.trim()}
              className="inline-flex h-10 shrink-0 items-center rounded-lg bg-[#f4f4f6] px-4 text-[13px] font-medium text-[#14141a] transition-colors hover:bg-[#ececee] disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">{searchResults.map((s) => chip(s))}</div>
          )}
        </div>

        {/* Save bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#e9e9ee] pt-6">
          <p className="text-[13px] text-[#5c5c64]">
            <span className="font-semibold text-[#14141a]">
              {selected.size} selected
            </span>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-3 text-[#6f6f78] hover:underline"
              >
                Clear all
              </button>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="text-[13px] font-medium text-[#6f6f78] transition-colors hover:text-[#14141a]"
            >
              Skip
            </Link>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2b4bf2] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2340e0]"
            >
              <CheckIcon className="size-4" />
              Save & see matches
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[900px] flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <p className="text-[11px] text-[#6f6f78]">
          You can change this any time from the board&apos;s “Your skills” link.
        </p>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/privacy" className="text-[11px] text-[#5c5c64] hover:text-[#14141a]">Privacy</Link>
          <Link href="/terms" className="text-[11px] text-[#5c5c64] hover:text-[#14141a]">Terms</Link>
          <Link href="/cookies" className="text-[11px] text-[#5c5c64] hover:text-[#14141a]">Cookies</Link>
        </div>
      </div>
    </main>
  );
}

