# Project skills

Two procedures, covering the lifecycle of one change. They exist because the rules in
[AGENTS.md](../../AGENTS.md) describe a standard, and a standard that is not a procedure gets
applied when someone remembers to.

| Skill                                       | Use it when                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`ship-change`](./ship-change/SKILL.md)     | Starting any change, and carrying it through to a merged PR                               |
| [`review-change`](./review-change/SKILL.md) | A diff is ready and needs an adversarial read before it enters a permanent public history |

`ship-change` calls `review-change` at its gate. Invoking `review-change` on its own is the right
move when reviewing someone else's diff, or re-reviewing after a round of fixes.

## Where these came from

Adapted from a larger project's task-lifecycle skills and from a public agent-skills collection,
scaled down hard. The originals assume a monorepo with a database, auth, and parallel work streams;
this is a one-page static site maintained by one person. What was dropped, and why, is recorded in
[AGENTS.md](../../AGENTS.md#what-we-deliberately-did-not-build) — most of it was dropped, and that
section is load-bearing.
