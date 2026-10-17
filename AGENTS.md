# Rules

- Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui. Nothing else for UI.
- Never write your own buttons, inputs, tables, dialogs, badges, cards, menus. Import from `@/components/ui/*` and compose those primitives. Do not invent new UI primitives.
- If a shadcn component is missing, install it with `npx shadcn@latest add <name>`. Do not hand-write it.
- Dark theme only. Use theme tokens (bg-background, text-muted-foreground, border), not hardcoded hex colors.
- Fonts: Geist Sans for text, Geist Mono for numbers, dates, deadlines and scores.
- Do not add new dependencies without asking.
- Keep files small. One component per file.

## Look and feel

The target is **Vercel's** look: pure black ground, neutral greys, Geist, tight
radii, no decorative colour.

- **Do not change the typefaces, the colour token values, or the radii.**
- Do not introduce an accent colour, a tinted ground, or a custom palette.
- Status colours (emerald / sky / amber / red for eligibility) are the only
  colour in the UI. Keep them.
- A visual restyle is its own task, not a side effect of another one. If you
  think one is needed, ask first and say what and why. Do not fold it into a bug
  fix, because that is exactly how the fonts and palette got changed once
  already and had to be reverted.

## What this project is

Finds **tech internships and contracts** for a 3rd-year CS student, anywhere in the
world — US, UK, Europe, remote or on-site.

The question it answers is **not** "can I work from Ethiopia". It is:

1. Will this employer take an international applicant?
2. Would I pass the screen, or what am I missing before I apply?

## Scope

- **Tech only**: engineering, data, ML, security, infrastructure, QA. Not sales,
  marketing, design, support, finance.
- **Internships, contracts and junior roles.** Senior/staff/principal is out of scope.
- **On-site abroad is IN scope** when the employer sponsors visas or accepts
  international applicants. Never treat "London" or "New York" as closed on its own —
  the reason people from here get Bloomberg offers is sponsorship, not remoteness.
- Region restrictions still matter, but as a signal about hiring reach, not a hard no.

## Data

- Job data is **not** in this branch. `jobs.json` lives on the orphan `data` branch,
  force-pushed as a single commit so it never grows the history. Curated files
  (`companies.json`, `programs.json`, `facts.json`, `seed.json`) stay on `main`.
- `npm run sync-data` before building. `npm run verify-data` before shipping.
- `lib/data.ts` falls back to `data/seed.json` when `jobs.json` fails validation.
  That is right for a fresh clone and dangerous in CI, which is why verify-data exists.

## Pipeline

```bash
npm run discover      # probe candidate companies for live ATS boards
npm run collect       # fetch all sources, filter, merge, evaluate, store
npm run evaluate      # re-score and print a report
npm run selfcheck     # engine assertions
npm run verify-data   # fail loudly on a missing or malformed snapshot
npm run sync-data     # pull the snapshot from the data branch
npm run publish-data  # push the snapshot back to the data branch
```

- `npm run selfcheck` is the engine's safety net. Run it after touching
  `lib/eligibility.ts`, `lib/regions.ts`, `lib/deadline.ts`, `lib/fit.ts` or
  `lib/requirements.ts`.
- `npm run collect` is the canonical path: it fetches full bodies, scores them, then
  stores an excerpt. `evaluate` refuses to re-score a stored excerpt without `--force`,
  because grading a posting on a fraction of its text silently drifts every score.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent rules: save tokens, save cost

My usage limit is based on cost. Big context = expensive. Follow these rules.

## Reading code

- Never read the whole repo. Use grep/glob to find the exact file first.
- Read only the lines you need (line ranges), not full files.
- Don't re-read a file you already read this session unless it changed.
- Skip: node_modules, dist, build, .git, lockfiles, generated files, large data/log files.

## Commands and output

- Limit long output: pipe to `head`, `tail`, or `grep`.
- Never print full logs, full test output, or full diffs. Show only errors and the relevant lines.
- Don't run installs, builds, or full test suites unless needed. Run the single relevant test.

## Editing

- Make small, targeted edits. Don't rewrite whole files.
- Group related edits together instead of many tiny steps.
- No refactors, renames, or "improvements" I didn't ask for.
- Don't create extra files, docs, or comments unless I ask.

## Responses

- Be short. No long explanations, no restating my request, no summary of what you just did.
- Don't paste code back at me if it's already in the file.
- If something is unclear, ask one short question instead of guessing and redoing work.

## Working style

- For anything bigger than a small change, give a 3-5 line plan first and wait for my OK.
- If a step fails twice, stop and tell me. Don't loop on retries.
- When the task is done, stop. Don't keep checking or polishing.

## Context hygiene

- If the conversation gets long or I switch tasks, tell me to start a new session or compact.
- Use the cheapest model that can do the job. Flag if a task seems to need a stronger one.
