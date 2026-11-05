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

| id   | Item                                                                                      | Status |
| ---- | ----------------------------------------------------------------------------------------- | ------ |
| M1-1 | Scaffold Astro + TypeScript strict; add lint, typecheck, build and dependency-audit gates | Open   |
| M1-2 | Semantic responsive layout: header, hero, work, experience, contact, footer               | Open   |
| M1-3 | Typed content in `src/data/`; anchor navigation                                           | Open   |
| M1-4 | Contact section and footer: LinkedIn call to action                                       | Open   |
| M1-5 | `scripts/audit-dist.mjs` and the Playwright a11y / keyboard / 320px suite                 | Open   |
| M1-6 | Vercel project, custom domain, TLS, apex/`www` canonicalization, preview `noindex`        | Open   |
| M1-7 | Metadata: canonical URL, Open Graph image, `robots.txt`, `sitemap.xml`                    | Open   |
| M1-8 | Verify on a real phone and with keyboard-only navigation                                  | Open   |

**Exit:** a recruiter reaches GitHub or LinkedIn in ≤2 clicks with JavaScript disabled; every gate
in [AGENTS.md](../AGENTS.md#quality-gates) passes; no private contact detail is disclosed anywhere.

## M2 — Contact form (conditional)

**Entry condition, evaluated before any work begins:** has LinkedIn proven insufficient in practice?
The default answer is no, and M2 stays closed. Record the evaluation either way.

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
