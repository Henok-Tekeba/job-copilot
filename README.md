# Job Copilot

Reads the eligibility terms of every remote posting and tells an African
developer the few they can actually be hired and paid for, the skills that
unlock the most of the rest, and when to apply before the deadline closes.

## Why this exists

The global remote job market states "Africa not eligible" in a structured field
that candidates never see, and almost never lists Africa at all. Measured from
live feeds:

```
Remotive `candidate_required_location` (live sample):
  'Worldwide'                                     6
  'Northern America, LATAM, Europe, APAC'         3
  'Americas, Europe, Israel'                      2
  mentions of Africa / Ethiopia / Nigeria / Kenya: 0

Jobicy `jobGeo` (100 live postings):
  'USA'        51
  'Europe'      8
  'Anywhere'    2
  'Africa':     0
```

So the default answer is "no", the reason is buried in prose, and no tool
computes what it would take to change that answer. That is the whole product.

## What it does

**Eligibility with evidence.** Structured feed fields are parsed into a region
set rather than regex-matched against a location string. Every verdict carries
the field it came from, so it can be inspected and argued with:

```
North America, Europe, Asia-Pacific
Restricted to Europe — Africa is not listed.
candidate_required_location: Europe, USA, Canada, APAC
```

**A fit score that means something.** Measured against *stated requirements*
split from nice-to-haves, then adjusted for seniority and eligibility:

```
priority = skill coverage x level weight x eligibility weight
```

**Deadlines.** Extracted only when a date sits beside an explicit deadline
label, so "founded in 2015" is never mistaken for a cutoff.

**Red flags.** Unpaid, commission-only, and fee-requesting postings are
surfaced before someone spends an evening applying.

## Sources

| Source | Endpoint | Notes |
|---|---|---|
| RemoteOK | `remoteok.com/api` | no structured region field |
| Remotive | `remotive.com/api/remote-jobs` | `candidate_required_location` |
| Jobicy | `jobicy.com/api/v2/remote-jobs` | `jobGeo`, `jobType` |
| Hacker News | HN Algolia API | "Who is hiring" thread |

Structured region fields are preserved through the pipeline
(`requiredLocation`) because the free-text form loses the list.

## Scripts

```bash
npm run collect      # fetch feeds, merge, dedupe, then evaluate
npm run evaluate     # score every job and print a report
npm run selfcheck    # 28 assertions over the engine
npm run dev          # local app
```

`npm run selfcheck` is the safety net for the engine. Run it after touching
anything in `lib/eligibility.ts`, `lib/deadline.ts` or `lib/fit.ts`.

## Layout

```
lib/regions.ts       region vocabulary, parsing, timezone bands
lib/eligibility.ts   verdict + evidence, structured fields first
lib/deadline.ts      labelled-date extraction
lib/requirements.ts  required vs nice-to-have, skill detection
lib/fit.ts           coverage, weights, priority
lib/legitimacy.ts    red-flag detection
lib/skills.ts        skill dictionary + core-engineering filter
scripts/adapters/    one file per source
scripts/evaluate.ts  the pipeline
```

## Known gaps

- **Deadline coverage is 0 across current sources.** The extractor is tested and
  works; these feeds simply do not publish cutoffs. Needs deadline-bearing
  sources (program pages, curation) to be useful.
- **All current sources are Western-centric**, so only ~10 of 221 software roles
  come out open. Africa-relevant sourcing is the next milestone.
- Eligibility inference can be wrong. Evidence display is the mitigation.

## Deployment

Static export to GitHub Pages on push to `main`
(`.github/workflows/pages.yml`), plus a scheduled collector that commits fresh
data every 8 hours.
