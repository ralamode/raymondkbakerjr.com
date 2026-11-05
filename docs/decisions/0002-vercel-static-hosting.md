# ADR-0002 — Vercel static hosting, no SSR adapter

**Status:** Accepted **Date:** 2026-11-05 **Supersedes:** the working spec's v1.0 choice of
Cloudflare Pages, which was replaced before any code was written **Relates:**
[ADR-0001](./0001-astro-static-first.md) (what is being served),
[ADR-0003](./0003-defer-contact-form.md) (why nothing dynamic is deployed)

## Context

The site is a static build (`dist/`) behind a custom domain, `raymondkbakerjr.com`. It needs HTTPS,
a CDN, per-PR preview deployments, and deploy-on-merge from a public GitHub repository. It needs no
server, no database, and no secret.

Two things shape the decision:

- **The owner already uses Vercel** for another project, with GitHub Actions and Playwright
  alongside it. Operational familiarity is worth real money here, because the maintenance budget for
  a portfolio is a few hours a year and a host whose failure modes are already understood is a host
  that does not consume it.
- **An earlier draft of the spec had chosen Cloudflare Pages** and specified a Pages Function for
  the contact form. That draft's own reference list noted that Astro's Cloudflare deployment guide
  now steers new projects toward Workers rather than Pages — so the foundation was drifting before
  anything was built on it.

## Decision

**Vercel, with the Astro framework preset, serving fully static output. No SSR adapter.**

- `main` deploys to production; every pull request gets a preview deployment.
- Preview deployments carry `X-Robots-Tag: noindex` via `vercel.json`, plus Vercel's preview
  protection where the plan allows it.
- Apex and `www` are both configured, one canonical and the other redirecting.
- **If a server endpoint is ever needed, it is a standalone Vercel Function under `api/`** — never
  an SSR adapter over the whole site. The static frontend and any dynamic endpoint stay decoupled.

## Alternatives considered

### Cloudflare Pages with a Pages Function

- **Pros:** excellent CDN; Turnstile and a WAF in the same account, which would have given CAPTCHA
  and rate limiting without a third vendor.
- **Cons:** Cloudflare's own tooling now points new projects at Workers instead of Pages, so the
  pattern was headed for a migration. The integrated Turnstile and WAF story only pays off for a
  contact endpoint, which [ADR-0003](./0003-defer-contact-form.md) does not build. Unfamiliar
  operationally.
- **Rejected:** its main advantage served a feature that is not being built, and its deployment
  pattern was already being deprecated out from under it.

### Cloudflare Workers (static assets)

- **Pros:** the direction Cloudflare is actually steering toward; genuinely good.
- **Cons:** same unfamiliarity, and no remaining advantage once the contact endpoint is deferred.
- **Rejected:** no reason to learn a second platform's failure modes for a static one-pager.

### GitHub Pages

- **Pros:** free; already where the repository lives; nothing new to connect.
- **Cons:** **no per-PR preview deployments**, which the review workflow in
  [AGENTS.md](../../AGENTS.md) depends on. No edge functions, so a future endpoint would need a
  second host.
- **Rejected:** losing previews would mean reviewing UI changes from a green build and a screenshot.
  For a site whose entire quality claim is visual and interactive, that is the wrong thing to give
  up for free hosting.

### Netlify

- **Pros:** functionally equivalent for this use — static hosting, previews, functions.
- **Cons:** nothing substantive against it; simply a third platform to keep current with.
- **Rejected:** a coin-flip resolved by existing familiarity. Recorded so the next reader knows it
  was considered and not overlooked.

## Consequences

- **Rollback is instant and stateless:** promote the previous deployment. No migration, no cache
  warm, no state to reconcile. This is a direct dividend of the static choice.
- The build has no secrets, so a preview built from an untrusted branch cannot leak one. If
  [ADR-0003](./0003-defer-contact-form.md) is ever reversed, this property disappears and production
  scoping of environment variables becomes load-bearing.
- **A vendor dependency on Vercel for domain, TLS, and CDN.** Mitigated by the output being plain
  static files: any static host can serve `dist/`, so migration cost is DNS plus a config file, not
  a rewrite. This is the main reason to refuse an SSR adapter even if one were convenient.
- Preview URLs must be kept out of search indexes; that is a `vercel.json` responsibility and a
  verification step, not something the platform does by default.
