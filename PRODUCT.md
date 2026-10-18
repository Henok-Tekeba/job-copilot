# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a 3rd-year CS student seeking tech internships, contracts, and junior roles worldwide (US, UK, Europe, remote or on-site). They are an international applicant (e.g. based in Ethiopia) who needs to know whether an employer will take them and whether they would pass the screen. Secondary audiences are not confirmed.

## Product Purpose

Job Copilot finds and ranks tech internships, contracts, and junior roles for international applicants. For each posting it answers two questions: (1) will this employer take an international applicant, and (2) would the user pass the screen, or what are they missing before applying. Success means an applicant can decide where to apply and what to learn next, with deadlines not missed.

## Positioning

Aggregates tech internship feeds globally and reads each posting for international-applicant eligibility and skill-gap fit rather than keyword matching alone.

## Operating Context

- Web app (Next.js App Router) with a board of jobs, applications tracker, digest, gaps analysis, reach map, facts/profile, and a paste-a-posting verdict tool on the landing page.
- Data comes from multiple hiring feeds (ATS boards, job boards); curated files (companies, programs, facts, seed) live on main, jobs snapshot on a data branch.
- Pipeline: discover, collect, evaluate, selfcheck, verify-data, sync-data, publish-data.

## Capabilities and Constraints

- Tech roles only (engineering, data, ML, security, infrastructure, QA); internships, contracts, junior roles; senior/staff/principal out of scope.
- On-site abroad is in scope when employer sponsors visas or accepts international applicants; region restrictions are a signal, not a hard no.
- Region restrictions, visa sponsorship, and international-applicant acceptance are core signals.
- Fit scoring against the user's skills/level; named missing skills; deadlines parsed from posting text.
- No confirmed undecided product facts recorded.

## Brand Commitments

No user-stated brand commitments beyond the project's locked Vercel look documented in AGENTS.md: pure black ground, Geist Sans/Mono, tight radii, neutral greys, no accent colour; status colours (emerald/sky/amber/red) are the only colour.

## Evidence on Hand

- Curated files: companies.json, programs.json, facts.json, seed.json on main.
- jobs.json snapshot on the orphan `data` branch (sync via npm run sync-data).
- Selfcheck and verify-data scripts as safety nets.

## Product Principles

1. Answer eligibility and fit, not remoteness.
2. Name missing skills before applying, not after.
3. Keep region/sponsorship as signals, never as hard nos.
4. Stay tech-only and junior-focused; reject scope creep.
5. Preserve the locked Vercel look; status colours are the only colour.

## Accessibility & Inclusion

International applicants with varying connectivity and devices; mobile-first touch targets (44px) already enforced in globals.css. No additional confirmed accessibility standard beyond WCAG-aligned practices in code.