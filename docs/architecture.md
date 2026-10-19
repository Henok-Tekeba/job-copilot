# Architecture: how a posting becomes a verdict

```
 snapshot (data branch)            gov records
 ─────────────────────             ──────────────────────────────
 collect.ts ──► data/fulltext.jsonl      UK sponsor register (CSV)
 full posting text   │                   (US DOL H-1B LCA: blocked, see
                     │                    docs/NEEDS_HUMAN.md)
                     ▼                          │
            engine/textStance.ts                ▼
            sentence-level rules         data-sources/build-lookup.ts
            ──► stance + quote +         normalise names ──► lookup JSON
                confidence                        │
                     │                            ▼
                     │                   engine/companyName.ts
                     │                   exact → alias → strict fuzzy
                     ▼                            │
            engine/verdict.ts  ◄──────────────────┘
            small scoring table
            ──► open | likely | unclear | unlikely
                 + reasons citing quote or record
                     │
        ┌────────────┼─────────────────┐
        ▼            ▼                 ▼
  scripts/       landing paste     eval/run.ts
  emit-verdicts  tool (same        measures both against
  ─► public/     engine, in the    human labels, dev sets
  verdicts.json  browser)          only until eval:final
        │
        ▼
  board, detail page, Method page
  (static export, no server)
```

1. **collect** keeps the complete posting body in `data/fulltext.jsonl`
   (the board snapshot stays light with excerpts; the engine reads the full
   text at build time).
2. **textStance** classifies what the text says about visas. Rules, no ML.
   Boilerplate that merely mentions the words (export-license clauses, EEO
   lists, Visa the payment brand) is filtered before matching.
3. **companyName + records** answer "have they sponsored before?" for
   postings that are silent. Matches carry a confidence; when unsure, no
   match.
4. **verdict** combines them with four readable rules and cites the evidence
   for every reason.
5. The **eval** measures all of it against human-labeled postings, dev sets
   for tuning, test set once per engine version, every metric with n and a
   95% Wilson interval.

## What the records can and cannot tell you

Company records show **past** sponsorship: a UK license today, H-1B filings
last year. They cannot show present ability or intent. "likely" means
history, not a promise — the UI says so wherever a record is used.
