/**
 * Text stance classifier (Phase 2). Rules, not ML.
 *
 * Reads a posting body and answers one question: what does the TEXT ITSELF
 * say about visa sponsorship and work authorization?
 *
 *   sponsors                  "we sponsor visas"
 *   no_sponsorship            "we are unable to sponsor"
 *   requires_authorization    "must be authorized to work in the US"
 *   citizenship_or_clearance  "US citizenship required", "TS/SCI"
 *   silent                    nothing either way (the common case)
 *
 * Design rules, learned from the labeled dev set:
 *  - Blocking statements beat sponsor statements when both appear: wrongly
 *    telling a student "open" costs more than wrongly saying "blocked".
 *  - Boilerplate that mentions the words but means nothing (export-license
 *    clauses, EEO protected-class lists, Visa the payment network, event
 *    sponsorship, sponsor as a job title) is skipped before matching. See
 *    eval/tricky_cases.jsonl — each case there has a named pre-filter here.
 *  - When unsure: silent, with low confidence. Silence is a valid answer.
 *
 * Runs in Node (eval) and the browser (landing paste tool): no I/O here.
 */

export type Stance =
  | "sponsors"
  | "no_sponsorship"
  | "requires_authorization"
  | "citizenship_or_clearance"
  | "silent";

export type TextStanceResult = {
  stance: Stance;
  /** The exact sentence that triggered the verdict, trimmed. Empty when silent. */
  quote: string;
  /** 0-1. High (0.8+) only for explicit, specific statements. */
  confidence: number;
  /** True when the text does not look like English and was not classified. */
  nonEnglish: boolean;
  /** Which rule fired, for debugging and for the experiment log. */
  matchedRule?: string;
  /**
   * Explicit worldwide / any-country hiring evidence, when the text says it.
   * Per the evidence rule, this qualifies a silent posting for a verdict
   * better than "unclear" — but it is NOT a sponsorship statement, so it
   * never changes the stance.
   */
  worldwide?: { quote: string; confidence: number };
};

const QUOTE_MAX = 240;

/**
 * Sentences that contain trigger words but say nothing about a candidate's
 * visa path. Each entry is a named tricky case from eval/tricky_cases.jsonl.
 */
const BOILERPLATE: Array<[string, RegExp]> = [
  // cloudflare_export_license: "...without sponsorship for an export license."
  ["cloudflare_export_license", /export licen[cs]e|export control/i],
  // eeo_citizenship_list: "...national origin, ancestry, citizenship status, age..."
  ["eeo_citizenship_list", /equal (opportunity|employer)|race,? color|national origin|protected veteran/i],
  // binance_visa_card: "Visa, MasterCard, Apple Pay..."
  ["visa_as_payment_brand", /\bvisa\b[^.]{0,40}(mastercard|master card|amex|apple pay|google pay|debit|credit card|payments?)|card certification/i],
  // substack_product_sponsorship: "...features that help creators take advantage of sponsorship opportunities"
  ["event_or_product_sponsorship", /sponsorship (opportunit|budget|package|prospectus)|sponsoring (events|conferences|creator)/i],
  // synthetic_sponsor_job_title: "Partnership Manager - Corporate Sponsorship"
  ["sponsor_as_job_title", /(corporate|event|partnership[s]?|sponsorship) (sponsor|sponsorship) (manager|officer|lead|executive|role)|sponsorship (manager|lead|officer)/i],
];

/** Common English function words: a text missing nearly all of these is not English. */
const ENGLISH_MARKERS = /\b(the|and|for|with|you|our|will|are|to|of|in|a|is|that|or|as|be|we|on|your|at|by|an|from|have|what|this|work)\b/gi;

/**
 * Rough non-English detection. The eval rubric says: a posting in a language
 * we cannot read gets "silent" with a flag, never a guess. We only declare
 * non-English when the text is long enough to be sure it lacks English
 * markers entirely — short snippets are left as silent without the flag.
 */
export function looksNonEnglish(text: string): boolean {
  const sample = text.slice(0, 2000);
  if (sample.trim().length < 120) return false;
  const markers = sample.match(ENGLISH_MARKERS)?.length ?? 0;
  return markers < 3;
}

type Rule = {
  name: string;
  pattern: RegExp;
  /** Extra context that must also be present, to kill false positives. */
  require?: RegExp;
  confidence: number;
};

/**
 * Blocking rules, checked in order: citizenship/clearance, then refusal, then
 * existing-authorization. All are "the door is closed in the text" signals.
 */
const BLOCKING_RULES: Rule[] = [
  // --- citizenship_or_clearance ---
  {
    name: "citizenship_required",
    pattern: /\b(citizenship|citizen(ship)? status|u\.?s\.? citizenship)\b[^.]{0,40}\b(required|must|only|is (a|an) requirement)\b|\bmust be (a|an)? ?(u\.?s\.?|us|british|canadian|australian|eu) citizen\b|\bcitizen[s]? of (the )?(united states|us|uk)\b[^.]{0,30}(only|required)/i,
    confidence: 0.92,
  },
  {
    // "applicants for this position must be U.S. citizens", "Requirement: US Citizenship",
    // and requirement bullets like "- US citizen".
    name: "us_citizen_requirement",
    pattern: /\bmust (be|hold)( a| an)? (u\.?s\.?|us|united states) (citizen|citizens|national|nationality)\b|(^|\n)\s*[-•*]?\s*u\.?s\.? (citizen|citizenship)\b|requirement:?\s*u\.?s\.? (citizen|citizenship)/i,
    confidence: 0.9,
  },
  {
    // Weak catch-all for citizenship mentions outside the EEO lists (which the
    // boilerplate filter already removes). Low confidence on purpose.
    name: "us_citizen_mentioned",
    pattern: /\b(u\.?s\.?|us|united states) (citizen|citizens|citizenship|national)\b/i,
    confidence: 0.7,
  },
  {
    name: "security_clearance",
    pattern: /\bsecurity clearance\b|\bts\/sci\b|\bsci clearance\b|\bpublic trust\b[^.]{0,30}(required|eligible|position)/i,
    confidence: 0.9,
  },
  // --- no_sponsorship ---
  {
    name: "unable_to_sponsor",
    pattern: /\b(unable|not able|cannot|can't|will not|won't|does not|doesn't|do not|don't|refuses?)\s+(to\s+)?(provide |offer |support |assist with |give )?(visa\s+|work\s+)?(sponsorship|sponsor)\b/i,
    confidence: 0.9,
  },
  {
    name: "no_sponsorship_available",
    pattern: /\bno (visa\s+)?sponsorship\b(?!\s*(is\s+)?(required|needed))/i,
    confidence: 0.85,
  },
  {
    name: "sponsorship_not_offered",
    pattern: /\bsponsorship\b[^.]{0,30}\b(is )?not (available|offered|provided|sponsored)\b/i,
    confidence: 0.85,
  },
  {
    // Lemon.io: "We do not provide visa assistance..."
    name: "no_visa_assistance",
    pattern: /\bdo(es)? not (provide|offer|include)\s+(visa|immigration|work (permit|visa))\s+(assistance|support|sponsorship)/i,
    confidence: 0.85,
  },
  // --- requires_authorization ---
  {
    name: "authorized_to_work_required",
    pattern: /\b(must|should|will only|only)?\s*(be\s+)?(legally\s+)?(authorized|authorised|entitled|eligible) to work (in|for|within)\b/i,
    confidence: 0.85,
  },
  {
    // Softer statements like OKX's "prioritising applicants who have a current
    // right to work in the UK" — still a statement about authorization, but
    // not phrased as a hard requirement, so lower confidence.
    name: "right_to_work_stated",
    pattern: /\b(current\s+)?(right to work|authorised to work|authorized to work|entitled to work|eligible to work)\b/i,
    confidence: 0.7,
  },
  {
    name: "right_to_work_required",
    pattern: /\b(must|should)\s+(already\s+)?(have|hold)\s+(a\s+|an\s+|the\s+)?(valid\s+)?(right to work|work (permit|visa|authorization)|visa to work)\b|\bright to work\b[^.]{0,40}\b(required|must|in the (us|uk))\b/i,
    confidence: 0.85,
  },
  {
    name: "no_sponsorship_needed_from_candidate",
    // "does not require sponsorship" = the candidate must not need it.
    pattern: /\bdoes not (require|need)(ing)? (visa\s+)?sponsorship\b|\bno (visa\s+)?sponsorship (is )?(required|needed)\b/i,
    confidence: 0.8,
  },
  {
    name: "work_permit_required",
    pattern: /\bwork (permit|authorisation|authorization)\b[^.]{0,40}\b(required|must|is a must|valid)\b/i,
    confidence: 0.8,
  },
  {
    name: "without_sponsorship_requirement",
    pattern: /\bwithout (visa\s+)?sponsorship\b(?! for an export licen[cs]e)/i,
    confidence: 0.75,
  },
];

/** Sponsor-positive rules. Checked only if nothing blocked. */
const SPONSOR_RULES: Rule[] = [
  {
    name: "we_sponsor_visas",
    pattern: /\b(we|they|company)\s+(will|can|do)?\s*sponsor\s+(visas?|work (visas?|permits?|authorizations?))\b|\bsponsor(s|ing)?\s+(a\s+|the\s+)?(work\s+)?visa\b/i,
    confidence: 0.9,
  },
  {
    name: "visa_sponsorship_available",
    pattern: /\bvisa sponsorship\b(?![^.]{0,30}(is )?not (available|offered|provided))[^.]{0,30}\b(available|provided|offered)\b|\bsponsorship (is )?available\b/i,
    confidence: 0.85,
  },
  {
    name: "licensed_sponsor",
    pattern: /\b(tier 2|tier 5|skilled worker) (sponsor|licen[cs]e[ds]?)\b|\blicen[cs]ed sponsor\b/i,
    confidence: 0.85,
  },
  {
    name: "international_applicants_welcome",
    pattern: /\binternational (applicants|candidates|students)\b[^.]{0,40}\b(welcome|encouraged|eligible|are invited)\b|\bopen to (all )?nationalities\b/i,
    confidence: 0.8,
  },
  {
    name: "visa_immigration_support",
    pattern: /\b(visa|immigration|work permit) (support|assistance|sponsorship) (is )?(offered|provided|available)\b|\bwe (can |will )?(help|assist) (you )?with (your )?(visa|immigration|work permit)\b/i,
    confidence: 0.8,
  },
];

/**
 * Explicit worldwide / any-country hiring. Deliberately narrow: every rule
 * must anchor on "anywhere / worldwide / globally" (or hiring/working people
 * across a stated number of countries). Customer or market reach ("users in
 * 100+ countries") is NOT hiring, and bare "remote" without an anywhere
 * anchor is location-restricted, not worldwide.
 */
const WORLDWIDE_RULES: Array<[string, RegExp]> = [
  ["remote_worldwide", /\bremote[ -]?\(?(worldwide|global|anywhere)\)?\b/i],
  ["anywhere_hiring", /\bfrom anywhere\b|\banywhere in the world\b|\bwork (from|anywhere)\b(?!.*\b(a |the )?city or country of)/i],
  ["hires_globally", /\b(hire[sd]?|hiring) (globally|worldwide|internationally|from anywhere)\b/i],
  ["people_across_countries", /\b(employees|colleagues|developers|teams?|people|contractors) (working|based|spread|distributed|hiring) (in|across|from) \d{1,}\+? countries\b|\bdevelopers? from (more than )?\d{1,}\+? countries\b/i],
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isBoilerplate(sentence: string): string | null {
  for (const [name, pattern] of BOILERPLATE) {
    if (pattern.test(sentence)) return name;
  }
  return null;
}

function firstMatch(rules: Rule[], sentences: string[]): (Rule & { quote: string }) | null {
  for (const rule of rules) {
    for (const sentence of sentences) {
      if (isBoilerplate(sentence)) continue;
      if (rule.pattern.test(sentence)) {
        return { ...rule, quote: sentence.slice(0, QUOTE_MAX) };
      }
    }
  }
  return null;
}

export function detectTextStance(text: string): TextStanceResult {
  const trimmed = (text ?? "").trim();

  if (looksNonEnglish(trimmed)) {
    return {
      stance: "silent",
      quote: "",
      confidence: 0.2,
      nonEnglish: true,
      matchedRule: "non_english",
    };
  }

  const sentences = splitSentences(trimmed);

  // Blocking statements first: explicit closure in the text always wins.
  const blocked = firstMatch(BLOCKING_RULES, sentences);
  if (blocked) {
    return {
      stance:
        blocked.name === "citizenship_required" || blocked.name === "security_clearance"
          ? "citizenship_or_clearance"
          : blocked.name === "unable_to_sponsor" ||
              blocked.name === "no_sponsorship_available" ||
              blocked.name === "sponsorship_not_offered"
            ? "no_sponsorship"
            : "requires_authorization",
      quote: blocked.quote,
      confidence: blocked.confidence,
      nonEnglish: false,
      matchedRule: blocked.name,
    };
  }

  const sponsored = firstMatch(SPONSOR_RULES, sentences);
  if (sponsored) {
    return {
      stance: "sponsors",
      quote: sponsored.quote,
      confidence: sponsored.confidence,
      nonEnglish: false,
      matchedRule: sponsored.name,
    };
  }

  // Silent, with confidence that reflects how much text we could actually read.
  // A 2,000-word posting with no signal is much stronger evidence than a
  // three-line stub.
  const words = trimmed.split(/\s+/).length;
  const confidence = words >= 150 ? 0.85 : words >= 40 ? 0.65 : 0.4;

  // Worldwide-hiring evidence rides along on a silent stance: it can lift the
  // verdict later (verdict.ts), but it is never a sponsorship statement.
  for (const [name, pattern] of WORLDWIDE_RULES) {
    for (const sentence of sentences) {
      if (isBoilerplate(sentence)) continue;
      if (pattern.test(sentence)) {
        return {
          stance: "silent",
          quote: "",
          confidence,
          nonEnglish: false,
          matchedRule: `no_match+${name}`,
          worldwide: { quote: sentence.slice(0, QUOTE_MAX), confidence: 0.8 },
        };
      }
    }
  }

  return { stance: "silent", quote: "", confidence, nonEnglish: false, matchedRule: "no_match" };
}
