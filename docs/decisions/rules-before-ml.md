# Decision: rules before machine learning

**What we chose.** The text classifier is an ordered list of hand-written
sentence patterns with a boilerplate pre-filter, not a trained model.

**Why.** With ~30 labeled examples of explicit statements (and 5 of one rare
class), a model would memorize the dev set and lie on the test set. Rules are
also inspectable: when a verdict is wrong, we print the exact sentence and the
rule that fired. And the same file runs in the browser with zero download.

**What we gave up.** Recall on phrasings we did not anticipate ("we do not
provide visa assistance" was invisible until we read our own mistakes). A
model with a few thousand labels would probably beat the rules. The plan is
to earn that model with the audit, not to fake it now.
