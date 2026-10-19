# Experiment log

Every rule change, the dev numbers before and after, and whether it was kept.
Tuning happens on the dev sets only (natural dev n=200, stratified dev n=21).
The test sets are never touched during iteration.

Baselines to beat: always-silent 89.5% (179/200) stance accuracy on natural-dev;
a "silent for everything" engine would score exactly that.

## e0 — baseline rules (engine 0.1.0, first cut)

Sentence-split, boilerplate pre-filters (export license, EEO lists, Visa-the-
payment-brand, event sponsorship, sponsor-as-job-title), ordered blocking
rules (citizenship/clearance → refusal → existing-authorization) → sponsor
rules → silent. Confidence 0.75–0.92 on matches.

- natural-dev: statement detection P 92.9% (n=14) / R 61.9% (n=21); blocked
  P 90.0% / R 69.2%; sponsors P 100% (n=4) / R 50% (n=8); overall 95.5%
  (vs 89.5% baseline).
- stratified-dev: blocked P 100% (n=15) / R 71.4% (n=21).
- tricky cases: 7/7.
- KEPT.

## e1 — refusal phrasing "We do not provide visa assistance"

Lemon.io said "We do not provide visa assistance", which the refusal rule
missed because it only matched the word "sponsorship". Added `no_visa_assistance`.

- natural-dev: statement R 61.9% → 66.7%; blocked R 69.2% → 76.9%. Overall
  unchanged (95.5%).
- KEPT.

## e2 — "do not sponsor visas" word order, US-citizen requirement bullets, soft right-to-work

- `unable_to_sponsor` now matches "do not sponsor visas" (verb before object),
  which fixes PlanetScale ("We do not sponsor visas" was in the text but the
  engine matched "Authorized to work in the US without sponsorship" first).
- New `us_citizen_requirement` (0.9): "must be U.S. citizens", "Requirement:
  US Citizenship", "- US citizen" bullets. Plus a weak `us_citizen_mentioned`
  (0.7) catch-all behind the EEO filter.
- New `right_to_work_stated` (0.7) for soft phrasing ("prioritising applicants
  who have a current right to work in the UK") — OKX ×3.
- stratified-dev: blocked R 71.4% → 95.2% (20/21). stance-accuracy-among-
  detected 86.7% → 90.0%.
- natural-dev: recall unchanged (66.7%), but precision 93.3% → 87.5%. The new
  "false positive" is Contentful — "Applicants must be authorized to work
  without the need for visa sponsorship" — labeled `silent` by both label
  passes. The engine is right per the rubric; the label looks wrong. See
  docs/NEEDS_HUMAN.md. The rules stay; the numbers are honest about it.
- KEPT (overall dev accuracy 95.5% → 95.0%, within noise; stratified blocked
  recall +23.8 points is real).

## e3 — STOP: plateau

Remaining dev mistakes are all label conflicts, not rule gaps:

1. Relocation-only statements (Doctolib ×2, OpenAI, Mercier) labeled
   `sponsors`. Your own tricky-case instruction says relocation without visa
   context is NOT a sponsorship statement. The engine follows the tricky case
   and returns silent. 4 of 8 dev sponsor misses are this.
2. Export-control language (Datadog, Shield AI, Cloudflare) labeled
   citizenship_or_clearance / requires_authorization. Same conflict with the
   tricky-case instruction (export-control boilerplate → silent).
3. Fortanix "an active security clearance are highly desired" labeled
   `silent` — the rubric says any clearance statement is
   citizenship_or_clearance.
4. Contentful (above) and Luminate ("must be authorized to work for any
   employer" → labeled no_sponsorship, rubric says requires_authorization).

"Fixing" any of these would mean editing labels, which the integrity rules
forbid. Dev gains have plateaued at overall 95.0% (n=200) against an 89.5%
baseline; the CI on the small-n detection metrics is wide and will tighten
only when the audit resolves the conflicts above.

## Leakage checks

Statement-detection precision/recall stayed under the 95% alarm threshold on
dev (87.5% / 66.7%), so no leakage investigation was triggered. Re-checked by
hand anyway: the engine reads only the posting text — no label fields, no ids,
no company records, no source field — and every tricky-case snippet is
classified by rule, not by memorized posting.
