/**
 * Sponsorship detection.
 *
 * This is the axis that actually matters for an international student. "Is it
 * remote from Ethiopia" was the wrong question — the people from here who got
 * Bloomberg offers got them by being sponsored, not by working remotely.
 *
 * So a posting that requires relocation is not closed. It is only closed when it
 * says it will not sponsor, or demands authorisation the candidate cannot have.
 */

export type SponsorshipVerdict =
  /** The posting says it sponsors, or invites international applicants. */
  | "offered"
  /** The posting says it will not sponsor, or demands existing authorisation. */
  | "not-offered"
  /** Nothing either way. Common: most internships are simply silent. */
  | "unstated";

export type SponsorshipAssessment = {
  verdict: SponsorshipVerdict;
  /** The phrases that produced the verdict, so it can be inspected. */
  signals: string[];
};

const OFFERED_SIGNALS: Array<[RegExp, string]> = [
  [/\bvisa sponsorship\b/i, "visa sponsorship"],
  [/\bsponsor(s|ing)? (a |the )?(work )?visa\b/i, "sponsors a visa"],
  [/\bwe (do |will )?sponsor\b/i, "we sponsor"],
  [/\bsponsorship (is )?(available|provided|offered)\b/i, "sponsorship available"],
  [/\bwill (be )?(provide|consider|offer)(ing)? sponsorship\b/i, "will consider sponsorship"],
  [/\btier 2 sponsor\b/i, "Tier 2 sponsor"],
  [/\b(skilled worker|tier 2) visa\b/i, "Skilled Worker visa"],
  [/\brelocation (support|assistance|package|bonus|provided)\b/i, "relocation support"],
  [/\binternational (applicants|candidates|students) (are )?(welcome|encouraged|eligible)\b/i, "international applicants welcome"],
  [/\bopen to (all )?(nationalities|international applicants)\b/i, "open to all nationalities"],
  [/\bwe (can |will )?(help|assist) with (your )?(visa|immigration|relocation)\b/i, "visa help"],
  [/\bvisa (support|assistance)\b/i, "visa support"],
];

const NOT_OFFERED_SIGNALS: Array<[RegExp, string]> = [
  [/\bno (visa )?sponsorship\b/i, "no visa sponsorship"],
  [/\bnot (able|available) to sponsor\b/i, "not able to sponsor"],
  [/\bunable to (provide|offer) sponsorship\b/i, "unable to sponsor"],
  [/\bdoes not (offer|provide) sponsorship\b/i, "does not offer sponsorship"],
  [/\bwithout (visa )?sponsorship\b/i, "without sponsorship"],
  [/\bmust (be )?(legally )?authorized to work in\b/i, "must already be authorized to work"],
  [/\bauthoriz(ed|ation) to work in the (us|u\.s\.|uk|united states|united kingdom)\b/i, "existing work authorization"],
  [/\bmust (be )?(currently )?(located|residing|live|based) in\b/i, "must already be located there"],
  [/\b(citizenship|citizen(ship)?) (is )?required\b/i, "citizenship required"],
  [/\bsecurity clearance\b/i, "security clearance"],
  [/\bpermanent (resident|residency)\b/i, "permanent residency required"],
  [/\bright to work\b/i, "existing right to work"],
];

/**
 * @param feedHint A structured value from the feed, when it publishes one.
 *                 Simplify calls this `sponsorship`; its "Other" value is
 *                 meaningless and is filtered out before it reaches here.
 */
export function assessSponsorship(
  text: string | null | undefined,
  feedHint?: string | null
): SponsorshipAssessment {
  const signals: string[] = [];

  if (feedHint) {
    if (/offers sponsorship/i.test(feedHint)) {
      return { verdict: "offered", signals: [`feed: ${feedHint}`] };
    }
    if (/does not offer|c\.?u\.?s\.? citizenship|citizenship is required/i.test(feedHint)) {
      return { verdict: "not-offered", signals: [`feed: ${feedHint}`] };
    }
  }

  const haystack = text ?? "";

  for (const [pattern, label] of NOT_OFFERED_SIGNALS) {
    if (pattern.test(haystack)) signals.push(label);
  }
  if (signals.length > 0) {
    return { verdict: "not-offered", signals };
  }

  for (const [pattern, label] of OFFERED_SIGNALS) {
    if (pattern.test(haystack)) signals.push(label);
  }
  if (signals.length > 0) {
    return { verdict: "offered", signals };
  }

  // Silence is the most common case, and it is not a rejection: most
  // internships do not mention sponsorship at all.
  return { verdict: "unstated", signals: [] };
}
