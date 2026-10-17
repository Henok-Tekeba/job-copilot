/**
 * Self-check for the evaluation engine.
 *
 * Run with `npm run selfcheck`. No test framework: assertion failures throw and
 * exit non-zero, which is enough for CI and keeps the dependency list clean.
 */

import { assessEligibility, verdictToEligible } from "../lib/eligibility";
import { parseRegions } from "../lib/regions";
import { extractDeadline } from "../lib/deadline";
import { detectSkills, segmentText } from "../lib/requirements";
import { computeFit } from "../lib/fit";
import { NON_TECH_TITLE_PATTERN } from "../lib/skills";

let passed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failures.push(`${name}\n    expected ${e}\n    actual   ${a}`);
  }
}

// --- region parsing -------------------------------------------------------

check(
  "worldwide is open",
  assessEligibility({ requiredLocation: "Worldwide" }).verdict,
  "open"
);

check(
  "the real Remotive string locks Africa out",
  assessEligibility({
    requiredLocation: "Northern America, LATAM, Europe, APAC",
  }).verdict,
  "region-locked"
);

check(
  "EMEA counts as reachable",
  assessEligibility({ requiredLocation: "EMEA" }).verdict,
  "open"
);

check(
  "Ethiopia is reachable",
  assessEligibility({ requiredLocation: "Addis Ababa, Ethiopia" }).verdict,
  "open"
);

check(
  "'Remote' alone is unknown, not open",
  assessEligibility({ requiredLocation: "Remote" }).verdict,
  "unknown"
);

check(
  "US timezone band is detected",
  assessEligibility({ requiredLocation: "USA, Canada, USA timezones" }).timezone
    .band,
  "americas"
);

check(
  "Europe overlaps East Africa",
  assessEligibility({ requiredLocation: "Europe" }).timezone.overlapsAfrica,
  true
);

// Word-boundary traps: "us" must not match inside "australia" or "belarus".
check(
  "Australia maps to APAC, not North America",
  parseRegions("Australia").regions,
  ["apac"]
);

check(
  "Belarus maps to CIS, not North America",
  parseRegions("Belarus").regions,
  ["cis"]
);

check(
  "'Global (Remote)' is worldwide",
  assessEligibility({ requiredLocation: "Remote (Global)" }).verdict,
  "open"
);

// --- hard blockers --------------------------------------------------------

check(
  "US work authorisation locks a role out",
  assessEligibility({
    requiredLocation: "Remote",
    description: "You must be authorized to work in the US.",
  }).verdict,
  "region-locked"
);

check(
  "feed/body disagreement is a conflict, not an open",
  assessEligibility({
    requiredLocation: "Worldwide",
    description: "US citizenship is required for this role.",
  }).verdict,
  "conflict"
);

check(
  "security clearance locks a role out",
  assessEligibility({
    requiredLocation: "Remote",
    description: "Active security clearance required.",
  }).verdict,
  "region-locked"
);

check(
  "verdict maps onto the legacy tri-state",
  [
    verdictToEligible("open"),
    verdictToEligible("region-locked"),
    verdictToEligible("conflict"),
  ],
  ["yes", "no", "unclear"]
);

// --- deadlines ------------------------------------------------------------

check(
  "labelled deadline is parsed",
  extractDeadline("Deadline: December 23, 2025. Apply early.", new Date("2025-06-01"))
    .deadline,
  "2025-12-23"
);

check(
  "day-first deadline is parsed",
  extractDeadline("Applications close 13 Nov 2026", new Date("2026-01-01")).deadline,
  "2026-11-13"
);

check(
  "ISO deadline is parsed",
  extractDeadline("Apply by 2026-11-13", new Date("2026-01-01")).deadline,
  "2026-11-13"
);

check(
  "stray dates are ignored",
  extractDeadline("Founded in 2015, we are a team of 40.", new Date()).deadline,
  null
);

check(
  "past deadlines are flagged expired",
  extractDeadline("Deadline: December 23, 2025", new Date("2026-06-01")).expired,
  true
);

// --- requirements ---------------------------------------------------------

check(
  "nice-to-have section is separated",
  segmentText("Requirements:\nReact\nTypeScript\n\nNice to have:\nRust").niceText
    .trim(),
  "Rust"
);

check(
  "C++ is detectable, which the old detector missed",
  detectSkills("We use C++ and C# daily.").includes("C++"),
  true
);

check(
  "'ts' does not match inside other words",
  detectSkills("Artifacts and bits").includes("TypeScript"),
  false
);

// --- fit scoring ----------------------------------------------------------

const known = new Set(["React", "TypeScript"]);

const strong = computeFit({
  requiredSkills: ["React", "TypeScript"],
  niceSkills: [],
  detectedSkills: ["React", "TypeScript"],
  knownSkills: known,
  level: "intern",
  verdict: "open",
  sectionsDetected: true,
});

check("full required coverage scores 100", strong.score, 100);
check("open intern role keeps priority 100", strong.priority, 100);

const locked = computeFit({
  requiredSkills: ["React", "TypeScript"],
  niceSkills: [],
  detectedSkills: ["React", "TypeScript"],
  knownSkills: known,
  level: "intern",
  verdict: "region-locked",
  sectionsDetected: true,
});

check("same skills, but region-locked drops priority", locked.priority, 40);

const senior = computeFit({
  requiredSkills: ["React", "TypeScript"],
  niceSkills: [],
  detectedSkills: ["React", "TypeScript"],
  knownSkills: known,
  level: "senior",
  verdict: "open",
  sectionsDetected: true,
});

check("seniority reduces priority", senior.priority, 75);

const partial = computeFit({
  requiredSkills: ["React", "TypeScript", "PostgreSQL", "AWS"],
  niceSkills: ["Rust"],
  detectedSkills: ["React", "TypeScript", "PostgreSQL", "AWS", "Rust"],
  knownSkills: known,
  level: "junior",
  verdict: "open",
  sectionsDetected: true,
});

check("partial coverage is measured against requirements", partial.score, 50);
check("nice-to-have gaps are counted separately", partial.niceMissing, ["Rust"]);

// --- country-level precision ----------------------------------------------

check(
  "a Kenya-only on-site role is a relocation, not remote work",
  assessEligibility({ requiredLocation: "Kenya" }).verdict,
  "relocation"
);

check(
  "a Kenya-only remote role is closed — nobody sponsors a remote visa",
  assessEligibility({ requiredLocation: "Remote in Kenya" }).verdict,
  "region-locked"
);

check(
  "a multi-country African restriction needs relocation",
  assessEligibility({ requiredLocation: "Kenya, Nigeria, South Africa" }).verdict,
  "relocation"
);

check(
  "a job open to Ethiopia is open",
  assessEligibility({ requiredLocation: "Ethiopia" }).verdict,
  "open"
);

check(
  "a job open to Addis Ababa is open",
  assessEligibility({ requiredLocation: "Addis Ababa" }).verdict,
  "open"
);

check(
  "the region 'Africa' is open, unlike a country inside it",
  assessEligibility({ requiredLocation: "Africa" }).verdict,
  "open"
);

check(
  "structured country arrays collapse to a region",
  parseRegions("United States").regions,
  ["north-america"]
);

// --- sponsorship, the axis that actually matters --------------------------

check(
  "an on-site London internship is reachable, not closed",
  assessEligibility({ requiredLocation: "London, UK" }).verdict,
  "relocation"
);

check(
  "an on-site London internship says sponsorship is unstated",
  assessEligibility({ requiredLocation: "London, UK" }).summary,
  "Based in London, United Kingdom. Sponsorship not stated — check the posting."
);

check(
  "hybrid in London is reported as hybrid",
  assessEligibility({ requiredLocation: "Hybrid - London" }).summary,
  "Hybrid in London. Sponsorship not stated — check the posting."
);

check(
  "an explicit sponsorship offer is detected",
  assessEligibility({
    requiredLocation: "London, UK",
    description: "We provide visa sponsorship and relocation support.",
  }).sponsorship.verdict,
  "offered"
);

check(
  "an explicit refusal closes the role",
  assessEligibility({
    requiredLocation: "London, UK",
    description: "Unfortunately we are unable to provide sponsorship.",
  }).verdict,
  "region-locked"
);

check(
  "a remote role tied to the US is closed, not a relocation",
  assessEligibility({ requiredLocation: "Remote in USA" }).verdict,
  "region-locked"
);

check(
  "existing work authorization closes a role",
  assessEligibility({
    requiredLocation: "New York, NY",
    description: "Candidates must be authorized to work in the United States.",
  }).verdict,
  "region-locked"
);

check(
  "a feed that says worldwide while the body demands citizenship is a conflict",
  assessEligibility({
    requiredLocation: "Worldwide",
    description: "US citizenship is required for this role.",
  }).verdict,
  "conflict"
);

check(
  "the feed's sponsorship value is trusted when it has one",
  assessEligibility({
    requiredLocation: "London, UK",
    sponsorshipHint: "Offers Sponsorship",
  }).summary,
  "Based in London, United Kingdom. Sponsorship offered."
);

check(
  "relocation counts as reachable, which is the point of the change",
  verdictToEligible("relocation"),
  "yes"
);

check(
  "silence about sponsorship is not a rejection",
  assessEligibility({ requiredLocation: "Berlin, Germany" }).sponsorship.verdict,
  "unstated"
);

// --- report ---------------------------------------------------------------

check(
  "a Business Developer is not a software role despite the word 'developer'",
  NON_TECH_TITLE_PATTERN.test("Junior Business Developer - Belgian Market"),
  true
);

check(
  "'Business Development Manager' is excluded",
  NON_TECH_TITLE_PATTERN.test("Business Development Manager"),
  true
);

check(
  "a Lead Developer is a software role",
  NON_TECH_TITLE_PATTERN.test("Lead Developer / Architect Web3"),
  false
);

check(
  "a Backend Engineer is a software role",
  NON_TECH_TITLE_PATTERN.test("Backend Engineer"),
  false
);

// --- report ---------------------------------------------------------------

console.log(`\n${passed} checks passed, ${failures.length} failed\n`);
if (failures.length > 0) {
  for (const f of failures) console.log(`  FAIL  ${f}\n`);
  process.exit(1);
}
