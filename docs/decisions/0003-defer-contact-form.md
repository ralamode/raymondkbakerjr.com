# ADR-0003 — No contact form at launch; LinkedIn is the contact path

**Status:** Accepted. **Amended 2026-11-06:** still not built, but no longer conditional **Date:**
2026-11-05 **Relates:** [ADR-0002](./0002-vercel-static-hosting.md) (what is deployed),
[content-policy.md](../content-policy.md) (why no address is published instead)

> **Amendment, 2026-11-06.** The decision below stands unchanged: there is no contact endpoint, no
> email provider, no CAPTCHA and no secret, and nothing is reserved for one. What changed is the
> expectation. This ADR framed M2 as conditional, opening only if LinkedIn proved insufficient; the
> owner has since decided a contact form is wanted, with the homepage navigation becoming **GitHub ·
> LinkedIn · Contact** and Contact pointing at a `/contact` page. The entry condition in
> [plan.md](../plan.md) M2 is updated to match.
>
> Recorded as an amendment rather than a superseding ADR because the decision is the same one: do
> not build it now. Only the reason for waiting changed, from "probably unnecessary" to "not yet".
> If the _implementation_ approach is ever settled, that is a new ADR, and the alternatives weighed
> below are the starting point for it.

## Context

The site needs a way for a recruiter to make contact. Three properties are required: the owner's
personal email address and phone number stay unpublished
([content-policy.md](../content-policy.md)); the channel works when a third party is down; and it
does not become a spam or cost liability.

The audience arrives from LinkedIn, from a resume that lists a LinkedIn URL, or from search. For
recruiters specifically, **LinkedIn is already the channel they prefer and the one they trust** — it
gives them a profile, a message history, and a reply they can track.

An earlier draft of the spec specified the full form implementation — a Pages Function, a verified
sender, Turnstile with server-side verification, throttling, a honeypot — _and_ listed "after
launch: is LinkedIn sufficient for contact?" as a decision checkpoint. The checkpoint was placed
after the work it was supposed to gate.

## Decision

**No contact endpoint at launch.** The Contact section and the footer carry a clearly labeled
LinkedIn call to action. There is no `/api/*` route, no email provider, no CAPTCHA, and no secret in
any environment.

A form is deferred to M2 and **gated on a post-launch evaluation**: has LinkedIn proven insufficient
in practice? The default answer is no. If it opens, the decision order is binding — choose the email
provider and the rate-limiting mechanism, verify the sender domain, and prove SPF/DKIM/DMARC with a
real test send, all **before** any UI work.

## Alternatives considered

### The full form, as originally specified

- **Pros:** a contact path that does not route through a third party; a self-contained demonstration
  of server-side validation and anti-abuse, which is relevant work-sample material.
- **Cons:** an email provider, a verified sender domain, three DNS record types, a CAPTCHA with
  server-side verification, a rate-limiting store, and a secret in a deployment environment — six
  dependencies and a public POST endpoint, to replicate a channel the audience already uses. It also
  creates the only secret in the project, and with it the whole class of preview-leakage risk that
  [ADR-0002](./0002-vercel-static-hosting.md) currently gets to ignore.
- **Rejected for launch, not forever.** The cost is real and the benefit is speculative until there
  is evidence LinkedIn is failing. Deferring also means the form, if built, gets built against
  observed need rather than imagined need.

### A published `mailto:` link

- **Pros:** zero infrastructure; works with JavaScript disabled; no third party.
- **Cons:** a published address is permanently scrapable, and this one would be the owner's personal
  address. It also opens a channel with no filter in front of it.
- **Rejected:** it violates [content-policy.md](../content-policy.md) directly. An obfuscated or
  JavaScript-revealed address is not a fix — it defeats scrapers roughly never, and it breaks
  without JavaScript, so it fails on both counts at once.

### A third-party form service (Formspree, Tally, and similar)

- **Pros:** no endpoint to own, harden, or monitor; working in minutes.
- **Cons:** a third-party script or origin on a page whose budget is zero third parties and zero
  JavaScript. The visitor's message passes through a vendor the owner has not vetted. And on a
  portfolio for platform and infrastructure roles, outsourcing the one piece of server-side
  engineering on the site is a conspicuous choice.
- **Rejected:** it costs the page's performance and privacy properties to save work that is already
  deferred.

### A form that posts to LinkedIn or opens the LinkedIn message composer

- **Pros:** looks like a form; needs no backend.
- **Cons:** there is no such supported flow. It would be a redirect dressed as a form.
- **Rejected:** a control that looks like it does one thing and does another is worse than the
  honest link.

## Consequences

- **The project has no secrets.** This is the single largest simplification in the repo: no
  production-versus-preview credential scoping, no secret-rotation procedure, no leakage path
  through an untrusted preview build. Reversing this ADR reverses all of that.
- **The contact path depends on LinkedIn being reachable.** Accepted: the audience is already there,
  and LinkedIn's availability is not a risk this site can meaningfully hedge. Notably, the rejected
  alternatives each added _more_ third parties, not fewer.
- Some visitors prefer a form and will not reach out over LinkedIn. That is the measurable cost, and
  it is the evidence the M2 entry condition is waiting for.
- **The no-JavaScript question disappears.** An anchor needs no JavaScript, so the contact path is
  the only one on the site with no degraded mode at all. Worth stating plainly, because the earlier
  draft required both "submits with JavaScript disabled" and "mandatory CAPTCHA verification" — the
  challenge _is_ JavaScript, so those two requirements could never both hold. If M2 ever opens, the
  requirement is that the no-JavaScript experience **states the limitation and offers this path**,
  not that it submits.
- If M2 opens, this ADR is superseded by a new one, not edited.
