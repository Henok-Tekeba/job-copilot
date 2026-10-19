# Needs a human

## Resolved by the audit (2026-10-19, see eval/results/label_audit.json)

The four label conflicts and the export-control rule conflict below were
settled by the audit pass. Every changed label is stamped
`source: "human_reviewed"` with a before-image in `eval/audit-results.jsonl`:

1. ~~Contentful / Fortanix / Luminate label stance~~ — corrected.
2. ~~Relocation-only postings labeled `sponsors`~~ — rejected per the
   evidence rule (relocation without visa context is not a sponsorship
   statement), verdicts moved to `unclear` with the old value kept in
   `verdict_ai_prior`.
3. ~~Export-control language (Datadog, Cloudflare, Shield AI)~~ — rejected as
   a visa statement; the tricky cases hold.

## Still open

- **US DOL H-1B LCA disclosure data cannot be downloaded programmatically.**
  The files exist and are public domain — verified on
  https://www.dol.gov/agencies/eta/foreign-labor/performance (e.g.
  `LCA_Appendix_A_FY2025_Q4.xlsx`) — but dol.gov's Akamai edge returns HTTP
  403 to every programmatic client tried (curl and python urllib, with
  browser user agents). A browser download by a person, or a proxy/VPN egress
  that Akamai tolerates, would fix it; the lookup schema already has a slot
  (`us-dol-lca`). Until then, "likely" verdicts rest on the UK register
  alone, which under-covers US-heavy boards.

- **Data freshness**: the UK register was captured 2026-10-16 and the job
  snapshot refreshes on its own schedule (collect.yml runs every 8 hours).
  The company lookup does not refresh automatically — re-run
  `data-sources/build-lookup.ts` when the register updates.
