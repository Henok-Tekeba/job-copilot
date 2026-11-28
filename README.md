# data

Squashed data branch, force-pushed on every collector run so job data does not
accumulate in the repository history. Do not send pull requests here; the
contents are overwritten.

| File | Purpose |
|---|---|
| `jobs.json` | current snapshot |
| `jobs.previous.json` | previous run, kept for rollback |
| `state.json` | collector rate-limit state |
| `history/` | daily counts |

Curated data (companies, programs, facts, profile) lives on the `main` branch.
