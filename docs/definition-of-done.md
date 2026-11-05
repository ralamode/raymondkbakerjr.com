# Definition of Done

The standing bar every change clears before it counts as done. It is distinct from acceptance
criteria: those vary per task and answer _"did we build the right thing?"_, while this list is the
same every time and answers _"is this finished to our standard?"_. A change is done when **both**
are satisfied.

Tailored once for this project and then reused unchanged. A Definition of Done renegotiated per
change is not one.

## Every change

- [ ] On topic — one concern, nothing unrelated riding along
- [ ] **The diff was read before staging**, against the five questions in
      [AGENTS.md](../AGENTS.md#before-you-commit)
- [ ] **Nothing unpublishable is in the diff** — no secret, no personal phone or email, no private
      address, no employer-confidential detail. This repository's history is permanent and has no
      undo
- [ ] Verified by running it, not by it typechecking
- [ ] `pnpm verify` passes locally
- [ ] Conventional Commit subject; body explains _why_; no personal names
- [ ] PR template filled, including how it was verified and what was deliberately left out
- [ ] CI green
- [ ] No dead code, debug output, or commented-out blocks left behind
- [ ] Documentation updated in the **same change** — `README.md` if setup or operation moved,
      `AGENTS.md` if a rule moved, an ADR if a decision worth preserving was made
- [ ] Docs describe the current state in timeless language, not the history of the change

## Content changes (copy, resume, images, project cards)

- [ ] [content-policy.md](./content-policy.md) satisfied — this is the gate with no undo
- [ ] Every professional claim traceable to already-public source material; no new metric invented
- [ ] Region granularity only; no street address, phone number, or personal email
- [ ] A PDF or image was inspected for metadata and embedded links **before** `git add`
- [ ] External links verified to resolve, and labeled so their destination is obvious

## UI changes

- [ ] Semantic HTML: correct native elements, one `<h1>`, no skipped heading levels, no div-soup
- [ ] Keyboard-usable with a visible focus indicator on every interactive element
- [ ] Tap targets ≥44px; WCAG 2.1 AA contrast verified, not assumed
- [ ] No horizontal overflow at 320px; legible at 200% zoom
- [ ] axe-core clean
- [ ] Still zero client JavaScript on the index page, and still inside the
      [byte budget](./architecture.md#performance-budget)
- [ ] Images carry intrinsic `width`/`height`
- [ ] `pnpm screenshots` run and the images **looked at**, then published with
      `pnpm screenshots:publish --pr <n> --comment` (320/390/1280px, light and dark)
- [ ] No horizontal overflow reported by the capture, which fails rather than warns
- [ ] Vercel preview opened and checked, not assumed from a green build

## If a server endpoint is ever added (M2)

- [ ] All input validated **on the server**: method, `Content-Type`, body size, field lengths
- [ ] Anti-abuse active on the first deploy, not added later
- [ ] Secrets only in production-scoped environment variables; never in a preview
- [ ] No raw message bodies, addresses, or tokens in any log
- [ ] Error responses leak nothing — no stack traces, no internals
- [ ] The no-JavaScript path states its limitation and offers the LinkedIn alternative

## Red flags

- _"It's done, I just haven't run it."_ Unverified work is not done.
- _"CI is green"_ used as a synonym for done while docs or the DoD are skipped.
- A different bar applied because the change feels small or the day is late.
- A follow-up commit treated as a fix for something published to a permanent public history.
