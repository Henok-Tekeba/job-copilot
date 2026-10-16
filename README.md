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

| Source | How | Notes |
|---|---|---|
| **98 company ATS boards** | Greenhouse, Ashby, Lever public APIs | First-hand postings, verified by `npm run discover` |
| Jobicy | `jobicy.com/api/v2/remote-jobs` | `jobGeo`, `jobType` |
| Remotive | `remotive.com/api/remote-jobs` | `candidate_required_location` |
| Hacker News | HN Algolia API | "Who is hiring" thread |
| RemoteOK | `remoteok.com/api` | no structured region field |

Structured region fields are preserved through the pipeline
(`requiredLocation`) because the free-text form loses the list.

### Board discovery

We cannot guess which ATS a company uses or what token it sits behind, and a
guessed list is worthless. `npm run discover` probes a candidate list against
all three platforms and keeps only boards that return live jobs:

```
Probing 162 candidates against 3 ATS platforms...
Found 98 boards with live jobs.
  greenhouse: 44   ashby: 48   lever: 6
```

Re-run it when the candidate list changes or a company migrates. Every entry in
`data/companies.json` has been checked against the live API.

### Why this matters

Before ATS sourcing, across 380 postings:

```
open to me: 10      open AND internship/contract/junior/program: 1
```

After, across 1,454:

```
open to me: 40      open AND internship/contract/junior/program: 5
real deadlines found: 3
```

## Scripts

```bash
npm run discover     # probe candidate companies for live ATS boards
npm run collect      # fetch all sources, filter, merge, then evaluate
npm run evaluate     # score every job and print a report
npm run verify-data  # fail loudly if the snapshot is missing or malformed
npm run sync-data    # pull the snapshot from the data branch
npm run selfcheck    # 28 assertions over the engine
npm run dev          # local app
```

`npm run collect` is the canonical path: it fetches full posting bodies, scores
them, then truncates to a stored excerpt.

## Where the data lives

Job data is **not** in this branch.

`jobs.json` is ~5 MB and is rewritten in full on every collector run, so
committing it to `main` added roughly 15 MB of repository history per day. It now
lives on an orphan **`data` branch** that is force-pushed as a single commit, so
its history stays at exactly one commit no matter how often it is written.

```
main                                  data (1 commit, force-pushed)
├── lib/ scripts/ app/                ├── jobs.json           current snapshot
└── data/                             ├── jobs.previous.json  rollback copy
    ├── companies.json                ├── state.json          rate-limit state
    ├── company-candidates.json       └── history/            daily counts
    ├── programs.json
    ├── facts.json
    └── seed.json                     ← fallback for a fresh clone
```

Curated files stay on `main` because they are edited by hand and worth diffing.
The churning files do not, because a diff of a 5 MB rewrite is noise.

```bash
npm run sync-data      # bring the snapshot down (CI does this before building)
```

**Rollback.** Force-pushing discards history, so the branch keeps the previous
snapshot as `jobs.previous.json`:

```bash
cp data/jobs.previous.json data/jobs.json
npm run publish-data -- <remote-url>
```

`npm run verify-data` runs before the build in CI. It exists because
`lib/data.ts` falls back to `seed.json` when `jobs.json` fails validation —
correct for a fresh clone, dangerous in CI, where it would deploy a
healthy-looking site full of the wrong data.

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

- **`data/companies.json` is only 98 companies** and skews heavily to US-based
  remote-first employers, so `region-locked` still dominates. Widening the
  candidate list is the highest-leverage next step.
- **Deadline coverage is thin (3 postings).** The extractor is tested and works;
  the feeds rarely publish cutoffs. Programs with announced dates live in
  `data/programs.json`, which is hand-maintained and deliberately leaves
  unannounced dates null rather than guessing them.
- Eligibility inference can be wrong. Evidence display is the mitigation.
- Force-pushing the `data` branch leaves unreachable objects on GitHub until it
  garbage-collects them, so the repository size will drift up between GC runs
  rather than staying perfectly flat.

## Deployment

Static export to GitHub Pages on push to `main`
(`.github/workflows/pages.yml`). The collector runs every 8 hours
(`.github/workflows/collect.yml`), publishes a fresh snapshot to the `data`
branch, and triggers a redeploy. Both workflows sync and verify the snapshot
before building.
