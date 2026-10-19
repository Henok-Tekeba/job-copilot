# Decision: public government records as evidence

**What we chose.** For postings that say nothing, evidence comes from public
registers: the UK Home Office licensed-sponsor register (Open Government
Licence v3.0) now, US DOL H-1B LCA disclosures (public domain) as soon as the
download is solvable.

**Why.** The claim "this employer has sponsored before" must be checkable. A
government register is: the URL, license, download date and data year are
stored inside the lookup and shown in the UI. It is also cheap — no API keys.

**What we gave up.** Records show history, not intent: a licensed sponsor may
never sponsor this role; an unlicensed one may sponsor happily via a US
entity we cannot see. Matching names across systems is lossy, so we tune for
precision (wrong matches are worse than misses) and accept a lower recall.
The US LCA data, the single best source for the US postings that dominate the
board, currently blocks programmatic download (docs/NEEDS_HUMAN.md).
