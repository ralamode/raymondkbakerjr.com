# AGENTS.md — how work is done in this repository

Read this before writing code or opening a pull request. It encodes decisions so that neither a
human nor an agent has to guess, and so that the answer does not change depending on who is working.
`CLAUDE.md` is a thin pointer to this file; keep the rules here.

**See also:** [README.md](./README.md) (what this is, and how to run it) ·
[docs/architecture.md](./docs/architecture.md) (system shape) · [docs/plan.md](./docs/plan.md) (the
backlog, and the ids PRs reference) · [docs/definition-of-done.md](./docs/definition-of-done.md)
(the standing bar) · [docs/content-policy.md](./docs/content-policy.md) (**what may and may not be
published** — read before touching copy, the resume, or any asset) ·
[docs/decisions/](./docs/decisions/README.md) (ADRs) · [.github/SECURITY.md](./.github/SECURITY.md).

## The standard

This repository is a work sample. A recruiter reads the site; an engineer reads the repo. The second
audience is a product requirement, not a side effect, so **the repository itself is held to the same
bar as the code in it**: the commit history, the PR descriptions, the directory layout and the
documentation are all part of what is being evaluated.

The bar is: **a Staff engineer could open any part of this repo and find a deliberate decision, not
an accident.** Concretely, every change should be able to answer yes to all five:

1. **Is it on topic?** One concern per change. A formatting sweep does not ride along with a
   feature.
2. **Is it correct?** Verified by running it, not by it compiling.
3. **Does it read well?** Names reveal intent. A reader does not need the diff to understand the
   commit message, or the commit message to understand the code.
4. **Does it belong where it is?** See "File organization" below.
5. **Is it the smallest thing that does the job?** A dependency, an abstraction, or a file added to
   a 60 KB static site needs a reason stated in the PR description.

**Restraint is part of the standard, not an exception to it.** The failure mode for a portfolio repo
is not sloppiness — it is over-engineering, which signals poor judgment just as loudly. "What did we
deliberately not build" below is a standing section, and it is as much a part of this document as
the rules.

## File organization (treat as first-class)

A clean, predictable hierarchy is a primary design concern. Before adding a file, decide where it
_belongs_; never put it in the root or the nearest convenient directory. If a directory starts
collecting unrelated things, **propose a reorganization in the PR** — moving a file is cheap on a
branch and expensive once it has inbound imports and links.

- **Root** holds only `README.md`, `AGENTS.md`, `CLAUDE.md`, `LICENSE`, and tool-mandated config
  that must sit there (`package.json`, `astro.config.mjs`, `tsconfig.json`, `vercel.json`,
  `.prettierrc`, `.editorconfig`, `.nvmrc`, `.gitignore`). No stray notes, scratch files, or loose
  docs.
- **`docs/`** — all project documentation: `architecture.md`, `plan.md`, `definition-of-done.md`,
  `content-policy.md`, `decisions/` (ADRs). One topic per file.
- **`.github/`** — `SECURITY.md`, `PULL_REQUEST_TEMPLATE.md`, `dependabot.yml`, `workflows/`.
- **`src/`** — grouped by responsibility, not by file type: `components/` (`*.astro`; a `react/`
  subdirectory appears only with its first island), `layouts/`, `pages/`, `data/` (the typed content
  edit surface), `styles/`.
- **`public/`** — served verbatim at the site root. Everything here is permanently public the moment
  it is committed; `docs/content-policy.md` governs what is allowed in.
- **`scripts/`** — build and audit tooling, run by CI and by `pnpm verify`.
- **`.claude/`** — `skills/` (the change lifecycle as procedures) and `settings.json`, which is a
  **permissions allowlist only** and holds no secrets, so it is tracked and reviewed like any other
  config. `settings.local.json` is per-machine, can hold an auth token, and is gitignored as a
  secret control — see [`.gitignore`](./.gitignore). The allowlist covers read-only inspection and
  the project's own scripts; `git push`, `gh pr create` and `gh pr merge` are deliberately left at
  **ask** so that nothing reaches the public remote without a prompt, and history-destroying
  commands (`push --force`, `reset --hard`) are **denied** outright, because this repository's
  premise is that its history is permanent. `pnpm dev` is omitted on purpose: it does not exit.
- **`e2e/`** — Playwright specs. Unit tests do **not** live here: a unit test colocates as
  `*.test.ts` next to the code it covers. Only browser tests need a shared home.
- **Naming:** kebab-case for files and directories; PascalCase for components; UPPERCASE for
  root-level and `.github/` meta files.
- **When placement is not obvious, say so in the PR description.** Do not guess and move on.

## Stack (do not deviate without updating this file and adding an ADR)

- **Site:** Astro, static output, TypeScript strict. Plain CSS with custom-property tokens.
- **No UI framework. No webfont.** React is **not installed** until an island justifies it
  ([ADR-0001](./docs/decisions/0001-astro-static-first.md)).
- **Host:** Vercel, static build, no SSR adapter
  ([ADR-0002](./docs/decisions/0002-vercel-static-hosting.md)).
- **No contact endpoint, no secrets, no server** today
  ([ADR-0003](./docs/decisions/0003-defer-contact-form.md)).
- **Package manager:** pnpm, version pinned by `packageManager`. Node version pinned by `.nvmrc`; CI
  reads the same file, so there is no "works on my machine" gap.

### The "don't" list

- No client-side JavaScript on the index page. This is asserted in CI, not trusted to review.
- No `mailto:` with a personal address, no phone number, no street address, anywhere.
- No analytics, tracking pixel, or third-party script.
- No webfont, no icon font, no CSS framework, no animation library, no state manager, no router.
- No SSR adapter. If an endpoint is ever needed it is a standalone Vercel Function.
- No `set:html` with content this repo did not author.
- No dependency added without a justification in the PR description.

## This is a public repository, and its history is permanent

A value committed anywhere in this tree is published, and **deleting it in a later commit does not
unpublish it** — the blob stays reachable by hash, in clones, and in forks. GitHub's own copy may
survive the branch entirely.

- A secret, a personal phone number, a personal email address, or a private contact address
  committed here is a **P0**: it requires a history rewrite and rotation of whatever leaked, not a
  follow-up commit. Treat `git add` as the point of no return.
- The controlling safeguard is therefore **inspection before staging**, not a CI check after.
  `gitleaks` in CI and the resume check are the backstop, not the control.
- `.gitignore` carries two rules that are secret controls rather than tidiness —
  `.claude/settings.local.json` and the owner's product spec. Both are commented where they sit. Do
  not remove either.
- Before adding anything to `public/`, read [docs/content-policy.md](./docs/content-policy.md). PDFs
  are the common trap: they carry author metadata, embedded links, and revision history that the
  rendered page does not show.

## Git workflow

- **Trunk-based.** `main` is always deployable and always matches production. All work goes through
  a pull request; do not push to `main`.
- One short-lived branch = one PR = one concern. Target under ~300 lines of diff; split anything
  over ~1000.
- **Branch naming:** `<type>/<id>-<slug>` where type is one of
  `feat|fix|chore|docs|refactor|perf|test|ci` and `<id>` is the backlog id from
  [docs/plan.md](./docs/plan.md) — for example `feat/m1-2-static-layout`, `docs/m0-3-adrs`.
- **Merge is a squash**, so one PR becomes one commit on `main`. Delete the branch on merge.
- Every PR gets a Vercel preview and must have green CI before merge.

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/). The subject says _what changed_; the
body says _why_, because the diff already says what.

```
feat(contact): add LinkedIn call to action and footer link

The contact section ships without a form (ADR-0003): a form costs an email
provider, DNS records, a CAPTCHA and a public POST endpoint to replicate a
channel the audience already uses. LinkedIn is the path until there is
evidence it is insufficient.

Refs: M1-4
```

- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `ci`.
- Subject in the imperative, lower case, no trailing period, under ~72 characters.
- `BREAKING CHANGE:` footer for anything that changes a public URL or a published asset path.
- **No personal names** in commit messages, PR descriptions, or ADRs. Write the role — _the owner_,
  _a reviewer_ — and attribute decisions by role and date: `_(owner, 2026-11-05)_`. This repo is
  public and a name is personal data.
- Never describe work that is not in the diff. A commit message is a claim about history; an
  inaccurate one is worse than a terse one.

### Pull request descriptions

Fill [the template](./.github/PULL_REQUEST_TEMPLATE.md). A PR description is read by a stranger
evaluating the author's engineering, so it earns real effort:

- **Lead with why.** What problem, what constraint, what alternative was rejected and on what
  grounds. If the reasoning is durable, it belongs in an ADR and the PR links to it.
- **State how it was verified** — the command that was run and what it showed, not "tested locally".
- **Name what you chose not to do**, and why, when a reviewer would reasonably expect it.
- **Screenshots for any visual change**, at mobile (~390px) and desktop (~1280px) widths.
- A PR that advances a milestone names it and says what it unblocks.

## Before you commit

**Review your own diff before it enters history.** This is a required step, not a courtesy. Run it
against `git diff --staged` — reading the diff, not recalling the intent — and answer:

1. **On topic?** Is everything here part of the one concern this change is about? Debug statements,
   commented-out blocks, an unrelated rename, a reformatted file, a `.DS_Store`, an editor config —
   all out. Stage them away or split them into their own change.
2. **Correct?** Was it _run_, not just typechecked? What did you observe? For a visual change, at
   what viewport widths?
3. **Publishable?** Does the diff contain a secret, a personal phone number or email, a private
   address, an internal or employer-confidential detail, or a claim that cannot be traced to
   already-public source material? See "This is a public repository" above — this is the gate with
   no undo.
4. **Accurate?** Does the commit message describe what the diff actually does, including anything
   surprising in it?
5. **Complete?** Is every applicable box in [the Definition of Done](./docs/definition-of-done.md)
   checked, or explicitly deferred with a reason?

The [`review-change`](./.claude/skills/review-change/SKILL.md) skill runs this as a procedure with
adversarial lenses. The [`ship-change`](./.claude/skills/ship-change/SKILL.md) skill carries the
whole branch-to-merge sequence.

## Quality gates

`pnpm verify` runs everything CI runs. **Run it before opening a PR.** It is the one list of what is
checked; other docs point here rather than restating it.

| Gate                                                                                | Command                                | Status                                   |
| ----------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| Formatting                                                                          | `pnpm format:check`                    | Active                                   |
| Relative doc links resolve (existence, case, `#fragment`)                           | `pnpm docs:links`                      | Active                                   |
| Secret scanning                                                                     | `gitleaks` (CI only)                   | Active                                   |
| Lint                                                                                | `pnpm lint`                            | **Lands with the Astro scaffold (M1-1)** |
| Typecheck                                                                           | `pnpm typecheck`                       | **Lands with M1-1**                      |
| Production build                                                                    | `pnpm build`                           | **Lands with M1-1**                      |
| Build-output assertions (zero JS, byte budget, image dimensions, no leaked address) | `pnpm audit:dist`                      | **Lands with M1-5**                      |
| Accessibility (axe-core), keyboard traversal, 320px overflow                        | `pnpm e2e`                             | **Lands with M1-5**                      |
| Production dependency advisories                                                    | `pnpm audit --prod --audit-level=high` | **Lands with M1-1**                      |

The gates marked as landing later are listed because **a gate that exists only in someone's head is
not a gate**. They are backlog items in [docs/plan.md](./docs/plan.md), not aspirations, and CI
today runs exactly the rows marked Active — no more, and nothing that pretends.

### Accessibility and performance are first-class

The site claims accessibility and performance expertise. A violation is therefore a credibility
failure, not a cosmetic bug, and it is treated as such in review.

- **Semantic HTML is required.** The correct native element for the job: `button` (never a clickable
  `div`), `a` for navigation, `nav`/`main`/`header`/`footer`/`section` landmarks, `ul`/`ol`/`li` for
  lists, `label` for every input, one `<h1>` per page with no skipped heading levels.
- Keyboard-usable with a visible focus indicator on every interactive element; tap targets ≥44px;
  WCAG 2.1 AA contrast.
- **Works from 320px up.** Do the width math; do not trust flex-wrap. A layout that only holds on a
  wide viewport is a defect.
- Zero client JavaScript on the index page; images carry intrinsic `width`/`height`; the index stays
  within the byte budget in [docs/architecture.md](./docs/architecture.md).

## Architecture decisions

Anything expensive to reverse gets an ADR in [docs/decisions/](./docs/decisions/README.md) — a
framework or host choice, a decision to defer a whole feature, a dependency that shapes the build.
Record the alternatives and why they lost; that is the part a reader cannot reconstruct. ADRs are
never deleted or edited into a different decision: a change of mind is a new ADR that supersedes the
old one.

## What we deliberately did not build

This repo borrows its practices from a much larger project. Most of that machinery was left behind
on purpose, and the reasoning is recorded here so it is not re-litigated — or quietly added back.

| Not adopted                                     | Why                                                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Changelog fragments (one file per change)       | The squashed commit history and the ADRs already carry it. A changelog directory for a one-page site is filing for its own sake. |
| Per-feature guide documents                     | There is one page. `docs/architecture.md` covers it.                                                                             |
| Committed per-PR implementation plans           | Proportionate for a multi-PR migration, not for a <300-line change to a static page. The PR description carries the reasoning.   |
| A status/roadmap document alongside the backlog | `docs/plan.md` is both. Two documents that must agree will eventually disagree.                                                  |
| Git worktree-per-task workflow                  | Solo repo, one change at a time. Branches are enough.                                                                            |
| Pre-commit and pre-push hooks                   | `pnpm verify` plus CI covers it. Hooks that duplicate CI mostly teach people `--no-verify`.                                      |
| A test runner at M0                             | There is nothing to unit test yet. It arrives with the code that needs it (M1-1).                                                |

**Adding any of these back requires a reason in the PR description.** Process is a cost paid on
every change; it earns its place or it comes out.
