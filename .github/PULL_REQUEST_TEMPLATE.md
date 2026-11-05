<!-- PR title must be a Conventional Commit, e.g. feat(hero): add region and role summary -->

## What and why

<!-- Lead with WHY. What problem, what constraint, what alternative was rejected and on what grounds.
     The diff already shows what changed. Reference the backlog id from docs/plan.md (e.g. M1-2).
     If the reasoning is durable, put it in docs/decisions/ and link it here. -->

## How this was verified

<!-- The command you ran and what it showed. "Tested locally" is not an answer.
     - `pnpm verify` output
     - For a visual change: which viewport widths you checked, and on what
     - For content: that docs/content-policy.md was satisfied, and what you inspected -->

## What I deliberately did not do

<!-- Name anything a reviewer would reasonably expect and not find, and why it is out of scope.
     Delete this section only if there is genuinely nothing. "Restraint is part of the standard" —
     AGENTS.md. -->

## Screenshots

<!-- REQUIRED for any visual change: mobile (~390px) and desktop (~1280px). Before/after where a
     comparison helps. Delete the section for a non-visual change. -->

## New dependencies

<!-- Every dependency needs a reason here. What it does, what it weighs, what it would have cost to
     do without it. Delete the section if there are none — which is the usual case. -->

---

## Checklist

See [the Definition of Done](../docs/definition-of-done.md) for the full bar; these are the items
with no undo.

- [ ] I read the diff before staging it (AGENTS.md → "Before you commit")
- [ ] One concern — nothing unrelated riding along
- [ ] **Nothing unpublishable in the diff**: no secret, no personal phone or email, no private
      address, no employer-confidential detail. This history is permanent
- [ ] Every professional claim traces to already-public source material
- [ ] `pnpm verify` passes locally; CI green
- [ ] Docs updated in this same PR if a rule, decision, or setup step moved
- [ ] Vercel preview opened and checked (not assumed from a green build)
