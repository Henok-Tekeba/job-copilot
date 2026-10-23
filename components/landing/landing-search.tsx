"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY } from "@/lib/profile";

/**
 * The landing hero search. First touch lands on the skill picker (no profile
 * yet); returning visitors with skills go straight to the board. The query
 * rides along either way.
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
    <form onSubmit={submit} className="mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row">
      <input
        name="search"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Backend intern, security engineer…"
        aria-label="Internship or keyword"
        className="h-12 min-w-0 flex-1 rounded-xl bg-[#f4f4f6] px-4 text-[14px] text-[#14141a] outline-none placeholder:text-[#9c9ca4] focus-visible:ring-2 focus-visible:ring-[#2b4bf2]/35"
      />
      <select
        name="country"
        aria-label="Region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="h-12 rounded-xl bg-[#f4f4f6] px-4 text-[14px] text-[#14141a] outline-none focus-visible:ring-2 focus-visible:ring-[#2b4bf2]/35 sm:w-44"
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
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2b4bf2] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#2340e0]"
      >
        Find internships
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
