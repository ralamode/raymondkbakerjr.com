# raymondkbakerjr.com

Source for my engineering portfolio: a one-page static site.

**Status:** pre-launch. The site is not built yet — this repository currently holds its engineering
foundation and its decisions. `raymondkbakerjr.com` goes live at M1; see
[docs/plan.md](./docs/plan.md). It is deliberately not linked until it resolves.

## What this is

A deliberately small site, built to be read by two audiences at once. A recruiter should understand
who I am and reach my GitHub or LinkedIn within two clicks. An engineer should be able to open this
repository and find decisions rather than accidents — which is why the repo is public, why the
reasoning is written down, and why the quality gates run in CI instead of living in my head.

The constraints I set, and why they are the interesting part:

| Constraint                                          | Why                                                                                                                                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zero client-side JavaScript** on the page         | Asserted in CI, not trusted to review. A portfolio claiming Core Web Vitals work has no business shipping an idle framework.                                                                                                           |
| **≤ 60 KB** of HTML + CSS + fonts                   | A structural budget catches regressions that a Lighthouse score on a static page cannot — it reports 100 regardless.                                                                                                                   |
| **No webfont, no third-party origin, no analytics** | The largest easy regressions, and the only ones a one-page site can really suffer. No tracking is a deliberate trade: it means there is no field performance data, and that is accepted rather than overlooked.                        |
| **No contact form, no server, no secrets**          | LinkedIn is the contact path. A form costs six dependencies and a public POST endpoint to replicate a channel this audience already prefers. [ADR-0003](./docs/decisions/0003-defer-contact-form.md)                                   |
| **React is not installed**                          | It arrives with the first island that earns it, against a three-part test. A framework added to demonstrate familiarity, on a page that needs none, demonstrates the opposite. [ADR-0001](./docs/decisions/0001-astro-static-first.md) |

The accessibility and performance claims on this site are claims about my work, so a violation here
is a credibility failure rather than a cosmetic bug. axe-core, keyboard traversal, and a 320px
overflow check are therefore scheduled to gate the build from the first public release (M1-5) rather
than arriving later as polish. [`AGENTS.md`](./AGENTS.md#quality-gates) is the one list of which
gates are active today and which land with the code they check — a gate that exists only in a plan
is marked as such there.

## Stack

[Astro](https://astro.build) with static output · TypeScript strict · plain CSS with custom-property
tokens · [Vercel](https://vercel.com) · GitHub Actions · Playwright

No UI framework, CSS framework, router, state manager, or animation library. The reasoning for each
is in [docs/decisions/](./docs/decisions/README.md) — including the alternatives considered and the
grounds on which they lost, since that is the part a reader cannot reconstruct from the code.

## Getting started

Requires [pnpm](https://pnpm.io) and the Node version in [`.nvmrc`](./.nvmrc) (CI reads the same
file, so there is no "works on my machine" gap).

```bash
pnpm install
pnpm verify      # everything CI runs — run this before opening a PR
```

Once the site is scaffolded (M1-1), `pnpm dev` will serve it locally and `pnpm build` will produce
`dist/`.

### Editing content

Content lives in typed modules under `src/data/`. It is typed so that a malformed project card fails
the build instead of rendering wrong — content edits are the change this repo sees most often, so
that is where the safety belongs.

Before editing copy, the resume, or anything under `public/`, read
[docs/content-policy.md](./docs/content-policy.md). This repository's history is permanent, so that
gate has no undo.

## Repository map

| Path                                                         | Contents                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)                                   | How work is done here: the standard, file organization, git workflow, quality gates. `CLAUDE.md` points at it |
| [`docs/architecture.md`](./docs/architecture.md)             | System shape, layers, performance budget                                                                      |
| [`docs/plan.md`](./docs/plan.md)                             | The backlog, and the milestone ids that branches and commits reference                                        |
| [`docs/definition-of-done.md`](./docs/definition-of-done.md) | The standing bar every change clears                                                                          |
| [`docs/content-policy.md`](./docs/content-policy.md)         | What may and may not be published                                                                             |
| [`docs/decisions/`](./docs/decisions/README.md)              | ADRs — the decisions, and the alternatives that lost                                                          |
| [`.github/`](./.github/SECURITY.md)                          | Security posture, PR template, CI, Dependabot                                                                 |
| `scripts/`                                                   | Build and audit tooling, run by `pnpm verify` and CI                                                          |
| [`.claude/skills/`](./.claude/skills/README.md)              | The change lifecycle as runnable procedures                                                                   |

## Deployment

`main` deploys to production on Vercel. Every pull request gets a preview deployment, carrying
`noindex`. Rollback is promoting the previous deployment — instant, with no migration and no state
to reconcile, which is a direct dividend of the static choice.

## License

[MIT](./LICENSE) for the **code** — take it, learn from it, reuse it. The **content** (biographical
copy, project descriptions, the resume, images) is all rights reserved. Building your own portfolio
from this structure is welcome; republishing someone else's professional history is not.
