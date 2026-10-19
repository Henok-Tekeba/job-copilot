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

## Phase 3 — company records and matcher

Sources verified live (not from memory):
- UK Home Office register of licensed sponsors (2026-10-16 CSV, 10.5 MB,
  126,482 unique organisations, OGL v3.0). Downloaded, parsed, lookup built.
- US DOL OFLC LCA disclosure data exists (verified file list:
  LCA_Appendix_A_FY2025_Q4.xlsx, public domain) but dol.gov's Akamai edge
  returns 403 to every programmatic client tried (curl, python urllib).
  Documented in docs/NEEDS_HUMAN.md; schema has a slot for it.

Matcher tuning (tune for precision — a wrong match is worse than a miss):
- e3a: token-subset fuzzy allowed a 2-token query to match a 4-token record
  ("Wise Consulting Limited" → a sole trader "food joy wise consulting";
  "Salad Bar Group" → a person's name). Precision 85.7% (n=21). FIXED by
  requiring token counts within 1 of each other.
- e3b: precision 100% (n=18), all 30 near-misses rejected. Recall 100% on the
  18 of 30 true pairs whose record actually exists in the register (the other
  12 were invented test names, correctly absent — a miss there is correct).

## Phase 4 — combined verdict

Scoring table (engine/verdict.ts): blocking text → unlikely; sponsor text →
open; silent + worldwide-hiring text → open; silent + real company record →
likely; silent + nothing → unclear. Every reason cites its quote or record.

- v1 (records only): verdict accuracy 80.0% vs 79.5% always-unclear baseline —
  no better than the baseline. Reason: the README evidence rule says explicit
  worldwide/any-country hiring qualifies for a non-unclear verdict, and 23 dev
  labels use it ("REMOTE (Worldwide)"), but the engine ignored it. open
  recall was 17.4%.
- v2 worldwide rules v1, loose: accuracy FELL to 67.5% (below baseline).
  Diagnosis: the patterns matched customer reach ("users in 100+ countries",
  "sold in 200 countries") and partial-remote perks ("25 days to work from a
  country of your choice"). open precision 23.7%. REVERTED.
- v3 worldwide rules v2 (tight: anywhere/worldwide anchors, hiring-subject
  country counts): verdict accuracy 81.5% (above the 79.5% baseline); open
  P 63.6% / R 60.9%; unclear P 90.3% / R 87.4%. KEPT.
- v4 STOP: verdict "likely" scores 0% precision (12 predicted, none labeled
  likely) because the label cleanup correctly reduced company-prior "likely"
  to "unclear", leaving only 5 dev labels for the class, and the engine's
  record-backed likely predictions cannot match them by construction. This is
  the known weakness of evaluating verdicts on unaudited labels: the audit
  must decide whether record-backed "likely" is right. Not fixable without
  touching labels.

Verdict accuracy is NOT in the CI gate (baseline.json) while labels are
unaudited — a gate on a metric this noisy would block honest work. It enters
the gate after label_audit.json exists.

## Process note, recorded because it happened

The final test run for engine 0.1.0 executed twice (the second time only to
print the numbers). No code or label changed between the two runs, and no
test-set information fed back into tuning — but the log records both, and a
mechanical guard now refuses a second `--final` for the same engine version
(pass `--repeat-final` to reprint deliberately). The once-per-version rule is
enforced from that commit on.
