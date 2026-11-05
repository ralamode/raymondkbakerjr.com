# Security

## Reporting a vulnerability

Report privately: open the repository's **Security** tab and use **Report a vulnerability**, or
message via the LinkedIn profile linked from the site. Please do not open a public issue for a
vulnerability.

(Deliberately not a hyperlink: a `../../security/advisories/new` path only resolves on github.com
and breaks if the repository is renamed.)

This is a personal static site with no users, no accounts, and no data, so there is no formal SLA.
Reports are read and acknowledged.

## What this project is, from a security standpoint

A static HTML, CSS, and image bundle served from a CDN. **No server, no database, no session, no
authentication, no user input, and no secrets**
([ADR-0003](../docs/decisions/0003-defer-contact-form.md)).

That is the posture, and it is deliberate. Most of what would otherwise need hardening does not
exist. The remaining real risks are about the repository and the supply chain, not the runtime.

## The actual threat model

| Threat                                                                                             | Control                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Private data committed to a permanent public history** — a phone number, a personal email, a key | Inspection **before** staging is the control ([content-policy.md](../docs/content-policy.md)); `gitleaks` in CI and GitHub secret scanning are the backstop. A leak is a P0: history rewrite plus rotation, never a follow-up commit |
| Metadata leakage from a published PDF or image — author name, file paths, GPS coordinates          | Mandatory pre-staging inspection of extracted text, document metadata, and embedded links                                                                                                                                            |
| Compromised or typosquatted dependency                                                             | Minimal dependency surface; `pnpm audit --prod --audit-level=high` in CI; Dependabot PRs reviewed, never merged unexamined; frozen lockfile                                                                                          |
| Compromised GitHub Action or CI tool                                                               | See **Supply chain** below                                                                                                                                                                                                           |
| Workflow privilege misuse from a fork PR                                                           | Default read-only `permissions` at the workflow level, raised per job only where needed. No secrets are exposed to PR builds                                                                                                         |
| Preview deployment indexed by a search engine                                                      | `X-Robots-Tag: noindex` on previews via `vercel.json`; Vercel preview protection where the plan allows                                                                                                                               |
| Injection through content                                                                          | No `set:html` with content this repo did not author. There is no user input to inject                                                                                                                                                |
| Account takeover of the repository or host                                                         | 2FA on GitHub and Vercel; a hostile push would be visible in the deployment history                                                                                                                                                  |

**Not in scope:** preventing anyone from reading publicly displayed content, and verifying the
identity of anyone who makes contact.

## Supply chain

CI runs third-party code on every push, so what it is allowed to run is pinned by content, not by
name.

- **Every GitHub Action is pinned to a full commit SHA**, with the version in a trailing comment. A
  tag is mutable: `@v4` is a promise the action's author can rewrite at any time, including after
  review. Dependabot updates the SHA and the comment together.
- **Anything downloaded into CI is version-pinned and SHA256-verified before it executes.** Today
  that is the `gitleaks` binary, whose checksum is asserted in [`ci.yml`](./workflows/ci.yml)
  against the published release checksum.
- `gitleaks` is run as the upstream **MIT-licensed binary** rather than through `gitleaks-action`,
  which has been under a proprietary EULA since v2.0.0 and requires a license key for
  organization-owned repositories. Taking the binary avoids both a proprietary dependency in a
  public repository's CI and a failure mode that would surface only if this repository moved to an
  organization.
- **Least privilege:** the workflow's default `permissions` is `contents: read`, raised per job only
  where something needs more. No secret is exposed to a pull-request build — and there are no
  secrets to expose ([ADR-0003](../docs/decisions/0003-defer-contact-form.md)).
- `pnpm install --frozen-lockfile` in CI, so a build cannot silently resolve a different dependency
  tree than the one that was reviewed.
- The dependency surface is kept deliberately small, and `pnpm audit --prod --audit-level=high`
  gates production dependencies. Dependabot pull requests are reviewed, never merged unexamined.

## If a contact endpoint is ever added

[ADR-0003](../docs/decisions/0003-defer-contact-form.md) defers it, and the no-secrets property
above is the largest single simplification in this repository. Reversing it reverses that, so the
requirements become binding rather than advisory:

- Validate every input **on the server** — method, `Content-Type`, body size, field lengths, syntax.
  Neither CORS nor a honeypot is authentication.
- Anti-abuse live on the **first** deploy: challenge verified server-side (success, hostname,
  action, expiry, replay), request throttling, honeypot.
- Secrets in **production-scoped** environment variables only. A preview builds from an untrusted
  branch and gets none.
- Strip CR/LF from any value reaching a mail header. Never render visitor-supplied HTML.
- Log no message bodies, addresses, or tokens. Persist no submissions.
- Return no stack traces or internals. Never report success before the provider accepts.
