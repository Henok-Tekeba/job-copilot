# Decision: return "unclear" instead of guessing

**What we chose.** When the posting is silent and there is no company record,
the verdict is "unclear" with a confidence score, and the UI says what is
missing instead of pretending.

**Why.** About 9 in 10 postings say nothing about visas. Forcing every one
into "yes" or "no" would fabricate certainty at scale — and every wrong
"no" tells a student not to apply. Honest silence is the difference between
a tool and a horoscope.

**What we gave up.** A single-label board where every row is green or red
looks decisive and is more satisfying to scan. "Unclear" also makes accuracy
harder to brag about: the honest number (81.5% on dev) is below the naive
always-unclear score on some sets. We keep it because the failure mode of
the alternative — confidently wrong verdicts — is worse.
