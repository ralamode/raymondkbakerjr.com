# Backlog

Milestone ids are referenced by branch names (`feat/m1-2-static-layout`) and commit footers
(`Refs: M1-2`). This file is the single forward-looking view; there is no separate roadmap, because
two documents that must agree eventually disagree.

**Sequencing:** M0 → M1 → _decision_ → M2 (conditional) → M3. M1 is not blocked on an email provider
or a CAPTCHA. Nothing is blocked on React.

## M0 — Repository foundation

Establish the engineering baseline and settle the content decisions, before there is code to argue
about.

| id   | Item                                                                                              | Status |
| ---- | ------------------------------------------------------------------------------------------------- | ------ |
| M0-1 | Public repo with `README`, `AGENTS.md`, `LICENSE` (code/content split)                            | Done   |
| M0-2 | `docs/` and `.github/` structure; PR template; `SECURITY.md`; Dependabot                          | Done   |
| M0-3 | ADRs 0001–0003 (static-first, Vercel, deferred contact)                                           | Done   |
| M0-4 | CI: formatting, documentation links, secret scanning                                              | Done   |
| M0-5 | Agent rules and the `ship-change` / `review-change` procedures                                    | Done   |
| M0-6 | Confirm GitHub and LinkedIn URLs                                                                  | Done   |
| M0-7 | Draft bio and select the 2–3 public-safe projects                                                 | Open   |
| M0-8 | Produce and inspect the public-safe resume variant — see [content-policy.md](./content-policy.md) | Open   |
| M0-9 | Choose typography and a palette meeting WCAG AA contrast                                          | Open   |

**Exit:** the repository reads as deliberately engineered, and nothing private is in the tree or its
history.

## M1 — Static portfolio live

**Ids are stable identifiers, not a sequence.** They are referenced by branch names and commit
footers, so they never get renumbered. The table below is in execution order; read the id column as
a name.

| id    | Item                                                                                                                        | Status      |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| M1-1  | Scaffold Astro + TypeScript strict; add lint, typecheck, build and dependency-audit gates                                   | Done        |
| M1-5a | PR screenshot capture and publishing (Playwright)                                                                           | Open        |
| M1-6a | Vercel project connected to the repo, Astro preset, previews building                                                       | Done        |
| M1-2  | Homepage: name, GitHub, LinkedIn, About. Shared `BaseLayout`                                                                | Done        |
| M1-5b | `scripts/audit-dist.mjs` and the Playwright a11y / keyboard / overflow suite                                                | Done        |
| M1-3  | ~~Typed content in `src/data/`~~ dropped: two hand-written pages need no content layer                                      | Dropped     |
| M1-4  | ~~Contact section + LinkedIn CTA~~ folded into M1-2; the Contact link ships with M2                                         | Dropped     |
| M1-7  | Metadata: title, description and canonical done in M1-2. Open Graph, `robots.txt`, `sitemap.xml` remain                     | Open        |
| M1-6b | Custom domain, TLS, apex/`www` canonicalization, preview `noindex`. www live; apex A record and preview noindex outstanding | In progress |
| M1-2b | `/about`: biography and selected work, from the canonical resume                                                            | Done        |
| M1-8  | Verify on a real phone and with keyboard-only navigation                                                                    | Open        |

Two orderings here are deliberate, and both were wrong in the first draft of this plan:

- **M1-5a comes before the first UI change.** It is the screenshot capture and publishing tooling,
  and it has to exist before M1-2 or the layout PR ships with no visual evidence. It also seeds the
  orphan `screenshots` branch with a Vercel opt-out, which must be in place **before** M1-6a
  connects Vercel: Vercel builds every pushed branch and ignores `[skip ci]`, so without it each
  screenshot upload posts a failed preview deployment.
- **M1-6a comes second, not sixth.** Every change's [Definition of Done](./definition-of-done.md)
  requires that its Vercel preview was opened and checked. Until the project is connected there is
  no preview, so every PR after the scaffold would either fail its own bar or tick that box without
  having done it. Connecting the project is cheap and unblocks the rest; the domain and
  canonicalization are a separate, later job, which is why M1-6 is split.
- **M1-5b comes before the content work, not after it.** It carries the axe-core, keyboard and 320px
  checks. Landing them after the layout and copy means retrofitting the gates onto markup that was
  built without them, which is the wrong way round for a site whose accessibility claim is the
  product rather than a feature of it.

**Exit:** a recruiter reaches GitHub or LinkedIn in ≤2 clicks with JavaScript disabled; every gate
in [AGENTS.md](../AGENTS.md#quality-gates) passes; no private contact detail is disclosed anywhere.

## M2. Contact form (planned)

**Planned, not conditional** _(owner, 2026-11-06)_. This started life as "open M2 only if LinkedIn
proves insufficient"; the owner has since decided a contact form is wanted. The deferral itself is
unchanged: it is not built yet, and nothing is reserved for it in the page, the routes or the
config. See the amendment on [ADR-0003](./decisions/0003-defer-contact-form.md).

When it ships, the homepage navigation becomes **GitHub · LinkedIn · Contact**, with Contact
pointing at a `/contact` page. The form should work without client-side JavaScript.

If it opens, the decision order is load-bearing: choose the email provider and the rate-limiting
mechanism, verify the sender domain, and prove SPF/DKIM/DMARC with a real test send — **all before
any UI work.** Vercel has no built-in request-throttling store, so rate limiting is a real open
choice and a new dependency, not a platform feature to assume.

A form also cannot submit with JavaScript disabled once a CAPTCHA is mandatory, because the
challenge _is_ JavaScript. The requirement is therefore that **the no-JavaScript experience states
the limitation and offers the LinkedIn path**, not that it submits.

## M3 — Depth and polish

| id   | Item                                                                                                                                    | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| M3-1 | 1–2 short engineering case studies with verified outcomes                                                                               | Open   |
| M3-2 | Lighthouse CI on PRs (non-gating on Performance — see [architecture.md](./architecture.md#performance-budget))                          | Open   |
| M3-3 | Manual screen-reader pass                                                                                                               | Open   |
| M3-4 | One React island, only if one is justified — three-part test in [architecture.md](./architecture.md#why-a-react-island-is-not-here-yet) | Open   |
