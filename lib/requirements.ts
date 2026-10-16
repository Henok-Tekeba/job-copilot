/**
 * Requirement segmentation and skill detection.
 *
 * Two jobs:
 *  1. Split a posting into "must have" and "nice to have" text, so a fit score
 *     can weigh them differently. A job listing Rust under "bonus" is not the
 *     same as one listing it under "requirements".
 *  2. Detect skills, with a word-boundary rule that actually works for aliases
 *     ending in symbols ("c++", "c#", ".net").
 */

import { SKILLS } from "./skills";

const NICE_HEADING =
  /\b(nice to have|nice-to-have|bonus|preferred|preferably|good to have|desirable|optional|a plus|would be (a )?plus|extra credit|not required|advantageous)\b/i;

const REQUIRED_HEADING =
  /\b(requirements?|qualifications?|must[- ]haves?|what you.?ll need|what we.?re looking for|you have|you bring|your (background|experience|skills)|about you|who you are|minimum|basic qualifications|required|skills?|experience|tech stack|we.?re looking for)\b/i;

export type SegmentedText = {
  requiredText: string;
  niceText: string;
  /** False when no headings were found, so everything landed in `required`. */
  sectionsDetected: boolean;
};

/**
 * A heading is a short line that names a requirement bucket. Requiring brevity
 * stops ordinary sentences that merely mention "experience" from splitting the
 * posting.
 */
function classifyHeading(line: string): "required" | "nice" | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return null;

  // Check "nice" first: "nice to have" also contains "have".
  if (NICE_HEADING.test(trimmed)) return "nice";
  if (REQUIRED_HEADING.test(trimmed)) return "required";
  return null;
}

export function segmentText(description: string): SegmentedText {
  const lines = description.split(/\n+/);

  let bucket: "required" | "nice" = "required";
  let sectionsDetected = false;
  const required: string[] = [];
  const nice: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = classifyHeading(line);
    if (heading) {
      sectionsDetected = true;
      bucket = heading;
      // Keep any inline content after the heading colon.
      const colon = line.indexOf(":");
      const inline = colon >= 0 ? line.slice(colon + 1).trim() : "";
      if (inline) (bucket === "nice" ? nice : required).push(inline);
      continue;
    }

    (bucket === "nice" ? nice : required).push(line);
  }

  return {
    requiredText: required.join("\n"),
    niceText: nice.join("\n"),
    sectionsDetected,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a matcher that respects word boundaries even when the alias ends in a
 * symbol. The naive `\bc\+\+\b` never matches, which is why "C++" was invisible
 * to the old detector.
 */
function aliasRegex(alias: string): RegExp {
  const escaped = escapeRegex(alias);
  const startsWithWord = /^[a-z0-9]/i.test(alias);
  const endsWithWord = /[a-z0-9]$/i.test(alias);
  const pre = startsWithWord ? "(^|[^a-z0-9])" : "(^|[^a-z0-9])";
  const post = endsWithWord ? "([^a-z0-9]|$)" : "([^a-z0-9]|$)";
  return new RegExp(`${pre}${escaped}${post}`, "i");
}

/** Detect which skills from the dictionary appear in `text`. */
export function detectSkills(
  text: string,
  dictionary: Record<string, string[]> = SKILLS
): string[] {
  const found = new Set<string>();

  for (const [skill, aliases] of Object.entries(dictionary)) {
    for (const alias of aliases) {
      if (aliasRegex(alias).test(text)) {
        found.add(skill);
        break;
      }
    }
  }

  return [...found];
}
