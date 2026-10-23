"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY } from "@/lib/profile";

/**
 * Conversion CTA with the same first-touch rule as the hero search: no
 * profile yet → the skill picker; profile exists → straight to the board.
 */
export function CtaLink({ children = "Find my internships" }: { children?: string }) {
  const router = useRouter();

  const go = () => {
    let target = "/jobs";
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = raw ? (JSON.parse(raw) as typeof DEFAULT_PROFILE) : DEFAULT_PROFILE;
      if (!profile.active || profile.skills.length === 0) target = "/skills";
    } catch {
      target = "/skills";
    }
    router.push(target);
  };

  return (
    <button
      type="button"
      onClick={go}
      className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#2b4bf2] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#2340e0]"
    >
      {children}
      <ArrowRight className="size-4" />
    </button>
  );
}
