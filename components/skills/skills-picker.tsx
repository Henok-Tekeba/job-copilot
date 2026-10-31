"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckIcon, SearchIcon } from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteLabel } from "@/components/site/site-label";
import { SiteShell } from "@/components/site/site-shell";
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
          "inline-flex h-9 items-center gap-1.5 border px-3 text-[12.5px] font-medium transition-colors",
          active
            ? "border-[#548bff] bg-[#548bff] text-white"
            : "border-[#e2e2e2] bg-white text-[#3a3a3a] hover:border-[#bdbdbd] hover:text-[#0b0b0d]",
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
    <main className="sl-landing min-h-dvh bg-white text-[#0b0b0d]">
      <SiteHeader cta={{ href: "/jobs", label: "Browse jobs" }} />

      <SiteShell>
        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] pt-[clamp(28px,3.6vw,52px)] pb-[clamp(26px,3.4vw,48px)]">
          <SiteLabel>Your skills</SiteLabel>
          <div className="mt-[clamp(18px,2.4vw,34px)] grid items-end gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <h1 className="sl-display-sm max-w-[18ch]">
              Pick what you know.{" "}
              <span className="text-[#548bff]">See what fits.</span>
            </h1>
            <p className="max-w-[25rem] text-[clamp(12px,1.03vw,15px)] leading-[1.65] text-[#9a9a9a] md:justify-self-end">
              Every internship on the board is re-graded against what you pick,
              so each row carries a personal Match %. Everything stays in this
              browser.
            </p>
          </div>
        </section>

        <section className="border-t border-[#ececec] px-[clamp(18px,2.75vw,40px)] py-[clamp(28px,4vw,58px)]">
          <div className="grid gap-[clamp(24px,4vw,56px)] lg:grid-cols-[190px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-6">
                <SiteLabel>Profile</SiteLabel>
                <p className="mt-5 font-satoshi text-[clamp(2.6rem,3.6vw,3.6rem)] leading-none font-medium tracking-[-0.05em] tabular-nums">
                  {selected.size}
                </p>
                <p className="sl-label mt-3">skills selected</p>
                <p className="mt-4 text-[12px] leading-[1.6] text-[#9a9a9a]">
                  Stored on this device only. No account, no sign-up.
                </p>
                {selected.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="sl-text-link mt-5"
                  >
                    Clear all
                  </button>
                ) : null}
                <p className="mt-8 border-t border-[#ececec] pt-4 text-[11px] leading-[1.6] text-[#9a9a9a]">
                  You can change this any time from the board&apos;s “Your
                  skills” link.
                </p>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="border-t border-[#14141a]">
                <div className="border-b border-[#ececec] py-[clamp(22px,2.6vw,34px)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-[#548bff]">
                        01
                      </span>
                      <h2 className="font-satoshi text-[clamp(16px,1.4vw,19px)] leading-[1.2] font-medium tracking-[-0.02em]">
                        Start with a track
                      </h2>
                    </div>
                    <p className="hidden max-w-[18rem] text-[12px] leading-[1.55] text-[#9a9a9a] md:block">
                      Pick one or more. The board has roles across all of them.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
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
                            "inline-flex h-10 items-center border px-4 text-[12.5px] font-medium transition-colors",
                            active
                              ? "border-[#548bff] bg-[#548bff] text-white"
                              : "border-[#e2e2e2] bg-white text-[#3a3a3a] hover:border-[#bdbdbd] hover:text-[#0b0b0d]",
                          )}
                        >
                          {track.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-b border-[#ececec] py-[clamp(22px,2.6vw,34px)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-[#548bff]">
                        02
                      </span>
                      <h2 className="font-satoshi text-[clamp(16px,1.4vw,19px)] leading-[1.2] font-medium tracking-[-0.02em]">
                        {demandLabel}
                      </h2>
                    </div>
                    <p className="hidden max-w-[18rem] text-[12px] leading-[1.55] text-[#9a9a9a] md:block">
                      Ranked by how often the board asks for each skill.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {demanded.map((skill) => chip(skill))}
                  </div>

                  {trackSkills.length > 0 ? (
                    <div className="mt-7 border-t border-dashed border-[#e2e2e2] pt-5">
                      <p className="sl-label mb-3">From your tracks</p>
                      <div className="flex flex-wrap gap-2">
                        {trackSkills.map((skill) => chip(skill))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-b border-[#ececec] py-[clamp(22px,2.6vw,34px)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-[#548bff]">
                        03
                      </span>
                      <h2 className="font-satoshi text-[clamp(16px,1.4vw,19px)] leading-[1.2] font-medium tracking-[-0.02em]">
                        Add anything else
                      </h2>
                    </div>
                    <p className="hidden max-w-[18rem] text-[12px] leading-[1.55] text-[#9a9a9a] md:block">
                      A tool, a language, or something the dictionary missed.
                    </p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <div className="flex h-11 min-w-0 flex-1 items-center border border-[#e2e2e2] bg-white px-3">
                      <SearchIcon className="size-3.5 shrink-0 text-[#77777d]" />
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
                        className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[#0b0b0d] outline-none placeholder:text-[#9a9a9a]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addFreeText}
                      disabled={!query.trim()}
                      className="inline-flex h-11 shrink-0 items-center border border-[#e2e2e2] bg-white px-4 font-mono text-[10px] tracking-[0.06em] uppercase transition-colors hover:border-[#bdbdbd] disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {searchResults.map((skill) => chip(skill))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-[#14141a] pt-6">
                <div>
                  <p className="sl-label">Selected</p>
                  <p className="mt-2 font-satoshi text-[clamp(1.5rem,2.2vw,2rem)] leading-none font-medium tracking-[-0.04em] tabular-nums">
                    {selected.size} skills
                  </p>
                  {selected.size > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className="sl-text-link mt-3 inline-block lg:hidden"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/jobs" className="sl-text-link">
                    Skip for now
                  </Link>
                  <button
                    type="button"
                    onClick={save}
                    className="sl-primary-btn h-[clamp(38px,3.2vw,46px)] min-h-11"
                  >
                    <CheckIcon className="size-[1.05em]" />
                    Save & see matches
                    <ArrowRight className="size-[1.05em]" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </SiteShell>
    </main>
  );
}

