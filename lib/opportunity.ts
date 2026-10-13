export type Opportunity = "internship" | "contract" | "junior" | "program" | "fulltime";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text: string, phrase: string): boolean {
  const escaped = escapeRegex(phrase).replace(/\\ /g, "\\s+");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function detectOpportunity(
  title: string,
  header: string,
  tags: string[],
  jobType?: string
): Opportunity {
  if (/\bsenior\b/i.test(title)) return "fulltime";

  const haystack = [title, header, tags.join(" "), jobType ?? ""]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  const contractPhrases = [
    "contract",
    "contractor",
    "freelance",
    "part time",
    "consulting",
    "per project",
    "short term",
    "gig",
    "bounty",
  ];
  if (contractPhrases.some((p) => hasPhrase(haystack, p))) return "contract";

  if (
    hasPhrase(haystack, "internship") ||
    hasPhrase(haystack, "intern") ||
    hasPhrase(haystack, "trainee")
  ) {
    return "internship";
  }

  if (
    hasPhrase(haystack, "junior") ||
    hasPhrase(haystack, "entry level") ||
    hasPhrase(haystack, "graduate") ||
    hasPhrase(haystack, "new grad") ||
    hasPhrase(haystack, "associate")
  ) {
    return "junior";
  }

  return "fulltime";
}