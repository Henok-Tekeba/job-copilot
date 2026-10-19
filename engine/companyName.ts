/**
 * Company name normalisation and matching (Phase 3).
 *
 * The hard part of company records: "Stripe, Inc." in a posting must match
 * "STRIPE INC" in a government file, while "Stripe Consulting" must NOT.
 *
 * Approach, tuned for precision (a wrong match is worse than a missed one):
 *  1. normalise (lowercase, strip punctuation and legal suffixes)
 *  2. exact match on the normalised name
 *  3. manual alias file (data-sources/aliases.json) for parents/subsidiaries
 *  4. strict fuzzy: all significant tokens must match, or the edit distance
 *     must be tiny on a long name
 *  5. when unsure: NO MATCH. Never a guess.
 *
 * Every match returns a confidence. Pure functions, browser-safe.
 */

export type CompanyMatch = {
  matched: boolean;
  /** The normalised key that matched, when matched. */
  key?: string;
  confidence: number;
  method: "exact" | "alias" | "fuzzy" | "none";
};

/** Legal suffixes and noise tokens stripped before comparing. */
const SUFFIXES = [
  "inc", "incorporated", "corp", "corporation", "co", "company", "llc", "llp",
  "ltd", "limited", "plc", "gmbh", "ag", "ab", "asa", "oy", "oyj", "bv", "b.v",
  "nv", "sa", "s.a", "srl", "srls", "spa", "apS", "pty", "pvt", "pte", "kk",
  "gk", "ug", "mbh", "sarl", "sl", "sro", "as", "a/s", "hf", "ehf", "zrt",
  "kft", "sp", "z.o.o", "zoo", "doo", "srl", "sas", "scs", "sca", "group",
  "holdings", "holding", "international", "global", "technologies", "technology",
  "labs", "lab", "software", "solutions", "systems", "ventures",
];

const NOISE_TOKENS = new Set(["the", "and", "of", "for"]);

export function normaliseCompanyName(name: string): string {
  let s = (name ?? "").toLowerCase().trim();
  // Canonical punctuation: everything non-alphanumeric becomes a space.
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  // Strip legal suffixes (possibly repeated: "asics b.v." → "asics").
  let tokens = s.split(/\s+/).filter(Boolean);
  let changed = true;
  while (changed && tokens.length > 1) {
    const last = tokens[tokens.length - 1]!;
    if (SUFFIXES.includes(last)) {
      tokens = tokens.slice(0, -1);
    } else {
      changed = false;
    }
  }
  tokens = tokens.filter((t) => !NOISE_TOKENS.has(t));
  return tokens.join(" ");
}

function tokenise(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return Infinity;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]!;
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const temp = dp[i]!;
      dp[i] = Math.min(
        dp[i]! + 1,
        dp[i - 1]! + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = temp;
    }
  }
  return dp[b.length]!;
}

export type LookupMeta = {
  sources: Array<{ name: string; url: string; license: string; downloadedAt: string; dataYear: string }>;
  counts?: Record<string, number>;
};

export type CompanyRecord = Record<string, unknown> & { uk?: boolean; n?: number };

/**
 * Match a posting's company name against the records lookup.
 *
 * @param name     Company name as it appears in the posting.
 * @param records  The lookup's `records` map (normalised key -> record).
 * @param aliases  Manual overrides: alias normalised -> canonical normalised.
 */
export function matchCompany(
  name: string,
  records: Record<string, CompanyRecord>,
  aliases: Record<string, string> = {}
): CompanyMatch {
  const key = normaliseCompanyName(name);
  if (!key) return { matched: false, confidence: 0, method: "none" };

  if (records[key]) return { matched: true, key, confidence: 1, method: "exact" };

  const aliasTarget = aliases[key];
  if (aliasTarget && records[aliasTarget]) {
    return { matched: true, key: aliasTarget, confidence: 0.95, method: "alias" };
  }

  const tokens = tokenise(key);
  // Fuzzy, strict: every significant token must appear in the record key, or
  // the whole strings must be a tiny edit apart on a long-enough name.
  if (tokens.length > 0) {
    for (const candidate of Object.keys(records)) {
      const candidateTokens = new Set(tokenise(candidate));
      const allTokens = tokens.every((t) => candidateTokens.has(t));
      if (allTokens) {
        // Token-subset match only when the two names are close in size —
        // allowing a 2-token query to match a 4-token record key is how a
        // consultancy name ends up matching an unrelated sole trader whose
        // registered name happens to end in the same words.
        if (Math.abs(tokens.length - candidateTokens.size) <= 1) {
          return { matched: true, key: candidate, confidence: 0.75, method: "fuzzy" };
        }
        return { matched: false, confidence: 0.3, method: "none" };
      }
    }
    for (const candidate of Object.keys(records)) {
      if (candidate.length >= 8 && levenshtein(candidate, key) <= 1) {
        return { matched: true, key: candidate, confidence: 0.7, method: "fuzzy" };
      }
    }
  }

  return { matched: false, confidence: 0, method: "none" };
}
