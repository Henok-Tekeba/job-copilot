import { Suspense } from "react";
import type { Metadata } from "next";
import { SkillsPicker } from "@/components/skills/skills-picker";
import { loadJobs } from "@/lib/data";
import { SKILLS } from "@/lib/skills";
import { TRACKS, buildDemand } from "@/lib/skill-catalog";

export const metadata: Metadata = {
  title: "Pick your skills — Shortlist",
  description: "Pick the skills you know and see a personal Match % on every internship.",
};

/**
 * Demand is counted from the live snapshot at request time: the chips show
 * how often the board actually asks for each skill, so picking feels like
 * reading the market, not filling a form.
 */
export default function SkillsPage() {
  const jobs = loadJobs();

  return (
    <Suspense fallback={null}>
      <SkillsPicker
        demand={buildDemand(jobs)}
        tracks={TRACKS}
        canonicalSkills={Object.keys(SKILLS)}
      />
    </Suspense>
  );
}
