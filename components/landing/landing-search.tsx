"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY } from "@/lib/profile";

/**
 * The hero's one interaction: a single white pill, engineered like the board's
 * search — field, region, one blue action. First touch lands on the skill
 * picker (no profile yet); returning visitors go straight to the board. The
 * query rides along either way.
 */
export function LandingSearch() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState("any");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = "/jobs";
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = raw ? (JSON.parse(raw) as typeof DEFAULT_PROFILE) : DEFAULT_PROFILE;
      if (!profile.active || profile.skills.length === 0) target = "/skills";
    } catch {
      // No stored profile — first touch.
    }

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (region !== "any") params.set("country", region);
    const qs = params.toString();
    router.push(qs ? `${target}?${qs}` : target);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className="mx-auto mt-10 flex h-16 w-full max-w-[680px] items-center rounded-full border border-[#e9e9ee] bg-white p-2 shadow-[0_24px_60px_-30px_rgba(15,15,30,0.25)]"
    >
      <Search className="ml-4 hidden size-4 shrink-0 text-[#6f6f78] sm:block" />
      <input
        name="search"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Backend intern, security engineer…"
        aria-label="Internship or keyword"
        className="h-full min-w-0 flex-1 rounded-full bg-transparent px-4 text-[14.5px] text-[#14141a] outline-none placeholder:text-[#9c9ca4]"
      />
      <span aria-hidden="true" className="mx-1 hidden h-8 w-px shrink-0 bg-[#e9e9ee] sm:block" />
      <select
        name="country"
        aria-label="Region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="hidden h-full w-40 shrink-0 appearance-none bg-transparent px-3 text-[13.5px] text-[#5c5c64] outline-none sm:block"
      >
        <option value="any">Anywhere</option>
        <option value="remote">Remote only</option>
        <option value="europe">Europe</option>
        <option value="north-america">North America</option>
        <option value="middle-east">Middle East</option>
        <option value="africa">Africa</option>
        <option value="asia">Asia</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#2b4bf2] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2340e0]"
      >
        Search
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
