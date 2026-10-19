# Decision: static site, no backend

**What we chose.** Everything runs in the browser or at build time: scoring
at build (4,000 verdicts emitted to a JSON asset), pasted-text classification
client-side, tracking in localStorage.

**Why.** GitHub Pages hosting is free and cannot leak user data, because
there is no server to leak from. The build step is the only machine that
needs the full posting text, so the served payload stays small.

**What we gave up.** No server means no user accounts, no cross-device sync,
no server-side personalization, and no cron: freshness depends on a data
pipeline run manually (or from CI). It also means the full 11 MB of posting
text cannot ship — the board shows excerpts and links out for the rest.
