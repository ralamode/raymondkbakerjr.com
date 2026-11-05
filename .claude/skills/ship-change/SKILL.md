---
name: ship-change
description:
  The full lifecycle for one change in this repository — branch, build, self-review, commit, PR,
  merge. Use when starting any change to this repo, and when preparing to commit or open a pull
  request. Enforces the AGENTS.md standard, the Definition of Done, and the pre-staging review that
  a permanent public history requires.
---

# Ship a change

One concern, one branch, one PR, one squashed commit. This is the whole sequence; do not skip the
gate in step 4.

**Read first:** [AGENTS.md](../../../AGENTS.md). If the change touches copy, the resume, or anything
under `public/`, also read [docs/content-policy.md](../../../docs/content-policy.md) **before**
writing anything — that gate has no undo.

## 1. Scope it

Name the one concern in a sentence. If the sentence needs an "and", it is two changes — split them.

Find its backlog id in [docs/plan.md](../../../docs/plan.md). If there is no id, decide whether the
work belongs on the plan (add a row in this change) or is genuinely standalone (a typo, a config
one-liner). Do not invent an id.

**Check for an over-engineering smell before writing code.** Does this add a dependency, a file, an
abstraction, or a process step? If so, state in the PR description why the simpler version does not
work.
[AGENTS.md → What we deliberately did not build](../../../AGENTS.md#what-we-deliberately-did-not-build)
lists things that were already decided against; adding one back needs a reason, not an oversight.

## 2. Branch

```bash
git fetch origin && git switch -c <type>/<id>-<slug> origin/main
```

`<type>` is `feat|fix|chore|docs|refactor|perf|test|ci`. Cut from a freshly fetched `origin/main`,
never from a stale local one. Never work on `main`.

## 3. Build it

- Smallest thing that does the job. Target under ~300 lines of diff.
- Run it. For a visual change, look at it at 390px and 1280px — and at 320px, which is where layouts
  actually break.
- Update documentation **in this change**, not in a follow-up: `README.md` if setup or operation
  moved, `AGENTS.md` if a rule moved, an ADR if a decision worth preserving was made.
- Add the test that would have caught the bug, where there is something to test. Do not manufacture
  a unit test for Astro markup.

## 4. The gate — self-review before staging

```bash
pnpm verify
git add -p          # stage deliberately; -p forces you to look at each hunk
git diff --staged   # then read the whole thing
```

**Run the [`review-change`](../review-change/SKILL.md) skill against the staged diff.** Read the
diff, do not recall the intent — the two diverge, which is the entire reason this step exists.

Then confirm every applicable box in
[docs/definition-of-done.md](../../../docs/definition-of-done.md).

**Do not proceed with an unresolved finding from the publishability lens.** A secret, a phone
number, a personal email address, or a confidential detail staged here is published the moment it is
pushed, and a later commit does not take it back. This is the one step in the sequence with no undo.

## 5. Commit

Conventional Commits. Subject says what; body says why.

```
<type>(<scope>): <imperative subject, lower case, no period, ~72 chars>

<Why. The constraint, the alternative rejected and on what grounds. Wrap at 72.>

Refs: <ID>
```

Rules that are easy to get wrong:

- **No personal names.** Write the role — _the owner_, _a reviewer_ — and attribute decisions by
  role and date: `_(owner, 2026-11-05)_`. This repo is public and a name is personal data.
- **Never describe work that is not in the diff.** A commit message is a claim about history, and an
  inaccurate one is worse than a terse one.
- `BREAKING CHANGE:` footer if a public URL or published asset path changes.

## 6. Open the PR

```bash
git push -u origin HEAD
gh pr create --fill-first   # then edit the body against the template
```

The PR title is a Conventional Commit — it becomes the squashed commit message on `main`.

Fill [the template](../../../.github/PULL_REQUEST_TEMPLATE.md) properly. **A stranger evaluating the
author's engineering reads this**, which is the actual reason it earns effort:

- Lead with **why**, not what.
- **How it was verified**: the command and what it showed. "Tested locally" is not an answer.
- **What you deliberately did not do**, where a reviewer would expect it.
- Screenshots at ~390px and ~1280px for any visual change.
- A justification for every new dependency.

## 7. Land it

- CI green. Not "green except".
- **Open the Vercel preview and look at it.** A green build is not a verified page.
- Squash merge. Delete the branch.

```bash
git switch main && git pull --ff-only origin main && git branch -d <branch>
```

## Red flags

- _"I'll fix the commit message later."_ The history is permanent and public.
- _"It's a small change, so the checklist doesn't apply."_ The bar does not move with the size of
  the diff, only the depth of the review does.
- Staging with `git add -A` without reading the result. That is how a `.DS_Store`, a debug
  statement, or a credential lands.
- A green CI treated as a substitute for having run the thing.
