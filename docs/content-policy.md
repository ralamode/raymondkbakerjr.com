# Content policy

What may and may not be published here. Read this before touching copy, the resume, an image, or
anything under `public/`.

This is not a style guide. It exists because a portfolio sits on an awkward seam: it has to say
enough to be persuasive, while being a permanently public artifact authored by someone with a career
history that is partly confidential and contact details that are private. Getting that seam wrong
has no undo.

## The permanence rule

Every file committed here is published the moment it lands, and **a later commit does not unpublish
it.** The blob remains reachable by hash, in every clone, and in every fork; GitHub's copy can
outlive the branch. Nothing in this document is enforced by a check that runs _after_ `git add` —
inspection before staging is the control, and CI is only the backstop.

A phone number, a personal email address, a private contact address, or a secret committed here is a
**P0**: history rewrite, plus rotation of whatever leaked. Not a follow-up commit.

## Never published

- A phone number, of any kind.
- A personal email address. **No `mailto:` anywhere on the site** — a published address is
  permanently scrapable, and the contact path is LinkedIn
  ([ADR-0003](./decisions/0003-defer-contact-form.md)).
- A street address, or location finer than region. **"Northeastern Pennsylvania"** is the
  granularity; the specific town is not published.
- Employer-confidential material: internal source code, internal design assets, nonpublic metrics,
  unreleased product details, internal document or system names, or anything learned under an
  expectation of confidence.
- Any other person's name — a colleague, a manager, a reviewer. Write the role.
- A credential, token, or API key, including an expired or example-looking one.

## Claims must be traceable

The site's one job is credibility, so an unverifiable claim costs more than the impression it buys.
A recruiter who catches one discounts everything beside it.

- **Every professional claim traces to already-public source material** — the owner's circulated
  resume, a public repository, or a public talk or post. If a number does not appear in that
  material, it does not appear on the site. Do not derive, round up, or re-estimate one.
- **Do not claim a live demo, a public repo, or a capability that does not exist.** Link only to
  something a reader can open right now.
- **State experience as two separate facts: 18 years in the field, and 13 years at LinkedIn
  (2013–2026).** Collapsing them into one phrase invites a recruiter to misread tenure, on the one
  page where being misread is the whole risk. The LinkedIn tenure has ended; write it in the past
  tense and do not imply current employment.
- Use accurate, recruiter-readable titles. No invented seniority, no gimmicky labels.
- Describe side projects honestly, including when they are in progress. "Still in progress" costs
  nothing; an overstated side project costs the reader's trust in the rest of the page.

## The public resume is a separate artifact

The owner's working resume **contains a phone number and a personal email address.** It must never
be the file published here.

The published resume is a **derived variant** with both removed, its contact line reduced to the
LinkedIn URL and the site's domain.

Before it is ever staged:

1. Extract and read the text. Confirm no phone number and no personal email.
2. Read the document metadata — `Author`, `Title`, `Subject`, `Keywords`, `Producer`. Authoring
   tools write a real name and sometimes a file path into these, and the rendered page does not show
   them.
3. List the embedded hyperlinks. Confirm each one is intended and public.
4. Confirm no revision history or tracked changes survived the export.
5. Only then `git add`.

Replacing the resume is a reviewed change like any other, not a file swap. Each replacement repeats
all five steps, because the risk is in the new file, not the old one.

## Assets under `public/`

- Inspect image EXIF before committing. Phone photos carry GPS coordinates and device identifiers.
- No employer logo or trademark implying endorsement, and no recreation of an employer's design
  assets.
- Favicon and icons are original or clearly licensed for the use; record the license in the PR.
- Content here is **all rights reserved**, not covered by the repository's MIT grant. See
  [LICENSE](../LICENSE).

## When it is a judgment call

Ask: _would a former employer's communications team, reading this on the public internet, consider
it theirs?_ If the answer is anything but a clear no, leave it out or describe the work at one level
of abstraction higher — the engineering problem and the approach, without the internal specifics.

The abstraction almost always reads better anyway. A reader who matters is evaluating judgment, and
discretion about a previous employer _is_ the evaluation.
