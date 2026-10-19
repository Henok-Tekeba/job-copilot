# Needs a human

Nothing here was fixed by hand — labels are read-only for the agent. These are
conflicts found by the eval that only the audit (or you, directly) can settle.
`npm run audit` shows each of these with its posting text; press `w` and give
the label you believe, or `a` to accept as-is.

## Label conflicts (label vs the written rubric)

1. **Contentful** (`ashby:contentful`, in dev) — text: "Applicants must be
   authorized to work without the need for visa sponsorship by the start
   date". Labeled `silent` by both passes. The rubric says that is
   `requires_authorization` (or `no_sponsorship`). The engine says
   `requires_authorization` and is being scored as a false positive because of
   this label.
2. **Fortanix** (`remoteok:1137463`, dev) — text: "Location in the Washington
   DC area and an active security clearance are highly desired." Labeled
   `silent`. The rubric says any clearance statement is
   `citizenship_or_clearance`.
3. **Luminate** (stratified dev) — "applicants must be authorized to work for
   any employer in the UK" labeled `no_sponsorship`; the rubric maps that
   phrasing to `requires_authorization` (you must already have the right).
4. **OpenAI** (`ashby:openai:05223b5a…`, dev, labeled `sponsors` with quote
   "We offer relocation assistance.") and **Doctolib ×2** and **Mercier**
   (labeled `sponsors`, quote is a relocation package). The tricky-case rule
   you set says relocation without visa context is NOT a sponsorship
   statement. If these stay `sponsors`, the engine needs a rule that treats
   relocation support as sponsor-positive — but then the
   `openai_relocation_assistance` tricky case (expect `silent`) must change
   too. The two cannot both hold.

## Rule conflict baked into the eval

5. **Export-control language** — Datadog ("eligible for any required
   authorizations from the US government" → labeled
   `citizenship_or_clearance`), Shield AI ("export controlled data" →
   `citizenship_or_clearance`), Cloudflare ("offer… conditioned on your
   authorization to receive software… without sponsorship for an export
   license" → `requires_authorization`). Your tricky-case instruction says
   export-control boilerplate must NOT count as a visa statement. The engine
   follows the tricky case (silent). If export-control conditions should
   actually block (they do effectively require US-person status), the tricky
   cases need updating to expect a blocking stance — say the word and the
   engine follows.

## Decisions I made without you (all reversible)

- The engine treats "no sponsorship required" (candidate need not need it) as
  `requires_authorization`, per the labeling rubric.
- Blocking statements beat sponsor statements when a posting contains both
  (precision over recall — a wrong "open" costs a student more).
- Stratified split is 33% test, dev-heavy, same seed family as the natural
  set, because the set is tiny (n=32).
- `data/fulltext.jsonl` is gitignored (your call in the pre-audit commit);
  eval scripts expect it at `data/fulltext.jsonl` locally or from the data
  branch.
