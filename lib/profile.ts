import type { Job, Level } from "./types";
import { computeFit } from "./fit";
import { SKILLS } from "./skills";

export type Profile = {
  skills: string[];
  /** null means "use the default profile baked into the snapshot." */
  active: boolean;
};

export const PROFILE_STORAGE_KEY = "job-copilot:profile";

export const DEFAULT_PROFILE: Profile = { skills: [], active: false };

export function isDefaultProfile(p: Profile): boolean {
  return !p.active || p.skills.length === 0;
}

type JobSkills = {
  requiredSkills: string[];
  niceToHaveSkills: string[];
  detectedSkills: string[];
};

function jobSkills(job: Job): JobSkills {
  const j = job as unknown as {
    evaluation: {
      requiredSkills?: string[];
      niceToHaveSkills?: string[];
      detectedSkills?: string[];
    };
  };
  return {
    requiredSkills: j.evaluation.requiredSkills ?? [],
    niceToHaveSkills: j.evaluation.niceToHaveSkills ?? [],
    detectedSkills: j.evaluation.detectedSkills ?? [],
  };
}

/**
 * Recompute a posting's fit for a given skill set, keeping the posting's own
 * level and eligibility verdict (those describe the role, not the candidate).
 */
export function applyProfile(job: Job, skills: string[]): Job {
  const { requiredSkills, niceToHaveSkills, detectedSkills } = jobSkills(job);
  const verdict = job.evaluation.eligibility?.verdict ?? "unknown";
  const level = job.evaluation.level;

  const fit = computeFit({
    requiredSkills,
    niceSkills: niceToHaveSkills,
    detectedSkills,
    knownSkills: new Set(skills),
    level,
    verdict,
    sectionsDetected: requiredSkills.length > 0,
  });

  const matched = detectedSkills.filter((s) => skills.includes(s));
  const missing = detectedSkills.filter((s) => !skills.includes(s));

  return {
    ...job,
    evaluation: {
      ...job.evaluation,
      fit,
      fitScore: fit.score,
      matched,
      missing,
    },
  };
}

/** All canonical skill names, for the picker. */
export const ALL_SKILLS: string[] = Object.keys(SKILLS).sort((a, b) =>
  a.localeCompare(b)
);

export type { Level };
