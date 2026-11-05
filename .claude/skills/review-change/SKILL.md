---
name: review-change
description:
  Adversarially review a diff before it enters this repository's permanent public history. Use when
  a change is staged or a pull request is open, before committing or merging. Applies six
  independent lenses — publishability, scope, correctness, legibility, restraint, and
  accessibility/performance — and is deliberately prompted to find flaws rather than to approve.
---

# Review a change

**You are prompted to find flaws, not to approve.** A review that returns "looks good" without
having tried to break the change has not happened. If you find nothing after genuinely applying
every lens, say so explicitly and name what you checked — that is a result, but it must be earned.

**Read the diff, not your memory of the intent.** The two diverge, and the gap is where defects
live.

```bash
git diff --staged        # before committing
gh pr diff <n>           # reviewing a PR
```

## Scale the depth, never the existence

A one-line config change gets lens 1 and lens 2. A new section, a dependency, or anything touching
content or `public/` gets all six. Lens 1 is **never** skipped, at any size.

---

## Lens 1 — Publishability (the one with no undo)

This repository is public and its history is permanent. A value committed here is published, and
**deleting it in a later commit does not unpublish it** — the blob stays reachable by hash, in every
clone, and in every fork.

Scan the diff for:

- A secret, token, API key, or connection string — including one that looks like an example.
- **A personal phone number or email address.** The owner's working resume contains both. Any resume
  or `mailto:` in this diff is a stop-and-verify.
- A street address, or location finer than "Northeastern Pennsylvania".
- Employer-confidential material: internal code, internal design assets, nonpublic metrics,
  unreleased product details, internal system or document names.
- Another person's name.
- A binary or PDF added without evidence its metadata was inspected — `Author`, `Title`, `Producer`,
  embedded links, EXIF GPS.

Check [docs/content-policy.md](../../../docs/content-policy.md) for the full rules.

**Any finding here blocks the change.** Not a comment — a block. Escalate as a P0 if it has already
been pushed: history rewrite plus rotation of whatever leaked.

## Lens 2 — Scope

- Is everything in this diff part of the **one concern** the change is about?
- Debug output, `console.log`, commented-out blocks, a stray `.DS_Store`, an editor config, an
  unrelated rename, a reformatted file that nothing else in the diff touches — all out.
- Is a refactor riding along with a feature? Split them.
- Does the diff do **less** than the message claims, or more?

## Lens 3 — Correctness

- Was it **run**, or only typechecked? What was observed? If the answer is not in the PR
  description, that is the finding.
- Walk the error and empty paths, not just the happy one. What happens with no projects in the data
  file? A missing image? A long string in a card?
- For content: is every claim traceable to already-public source material? Is a number invented,
  rounded up, or re-derived? Are the two experience facts — 18 years in the field, 13 years at
  LinkedIn — still stated separately and in the past tense?
- Do external links resolve, and does each label make its destination obvious?

## Lens 4 — Legibility

- Can a stranger read the commit message and then the diff, and have the diff hold no surprises?
- Do names reveal intent, so a comment explaining _what_ the code does is unnecessary?
- Is there a comment explaining _why_ something non-obvious is the way it is — and if the reasoning
  is durable, does it belong in an ADR instead?
- **Does every file belong where it is?**
  [AGENTS.md → File organization](../../../AGENTS.md#file-organization-treat-as-first-class). A new
  file in the root, or in the nearest convenient directory, is a finding.
- Is documentation written in timeless language describing the current state, rather than narrating
  the change?

## Lens 5 — Restraint

The failure mode for this repository is over-engineering, which signals poor judgment as loudly as
sloppiness. Argue the other side on purpose:

- Is there a **smaller** version that does the same job?
- Does a new dependency carry its weight? What does it weigh, and what would doing without it cost?
  Is the justification in the PR description?
- Is a new abstraction earning its indirection, or is it one caller pretending to be a pattern?
- Does a new process step, document, or check pay for itself on **every** future change? Was it
  already decided against in
  [AGENTS.md → What we deliberately did not build](../../../AGENTS.md#what-we-deliberately-did-not-build)?
- Is React, a webfont, an animation, or a third-party script creeping in? Each has a standing no and
  a named test to pass.

## Lens 6 — Accessibility and performance

The site claims expertise in both, so a violation is a credibility failure rather than a cosmetic
bug. Ground every critique in the real constraint: **a recruiter on a phone, possibly on a bad
connection, sometimes using a keyboard or a screen reader.**

- **Semantic HTML:** the correct native element. `button` not a clickable `div`, `a` for navigation,
  `nav`/`main`/`header`/`footer` landmarks, `ul`/`li` for lists, a `label` for every input, one
  `<h1>` and no skipped heading levels.
- Keyboard-reachable with a **visible** focus indicator on every interactive element. Tab through
  it.
- WCAG 2.1 AA contrast **verified**, not eyeballed.
- **Do the width math at 320px** — do not trust flex-wrap to save a fixed-width child.
- Tap targets ≥44px.
- Still **zero client JavaScript** on the index page? Still inside the
  [byte budget](../../../docs/architecture.md#performance-budget)?
- Every image carries intrinsic `width`/`height`?

---

## Report

Group findings by lens, most severe first. For each one: **what is wrong, where, and why it matters
here.** Separate what blocks from what is a suggestion — a review that files everything at the same
severity gets read as noise and skipped.

Then state the verdict plainly:

- **Block** — a Lens 1 finding, or a correctness defect.
- **Changes requested** — fix before merge.
- **Approve** — and name what you actually checked, so the approval carries information.

Speculation about code you have not opened is not a finding. Say you did not check it.
