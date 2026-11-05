# ADR-0001 — Astro with static output; React only when an island earns it

**Status:** Accepted **Date:** 2026-11-05 **Relates:** [ADR-0002](./0002-vercel-static-hosting.md)
(where the static output is served)

## Context

The site is a one-page engineering portfolio: a hero, three project cards, an experience list, a
contact section, a footer. The content changes a few times a year. There is no state, no
personalization, no data fetching, and no authenticated view.

Two audiences read it, and they pull in different directions. A recruiter needs the page to load
immediately on a phone, possibly on a bad connection. An engineer evaluating the repo is reading the
choices themselves — so the stack is itself a claim about judgment.

Two constraints are not negotiable, because the owner's professional claim rests on them:

- **Performance.** Claiming Core Web Vitals expertise on a slow page is self-refuting.
- **Accessibility.** Same, for a WCAG claim.

There is also a real temptation to resist. The owner wants more React practice, and a portfolio
looks like a convenient place to get it. That is a reason to use React _somewhere_; it is not a
reason for this page to need it.

## Decision

**Astro with `output: 'static'` and TypeScript strict.** Plain CSS with custom-property tokens. No
UI framework, no CSS framework, no webfont.

**React is not a dependency of this project.** It is added only alongside the first island that
justifies it, and that justification must name three things in the PR:

1. The concrete interactive behavior, described as something a visitor does.
2. The hydration cost, measured against the byte budget in
   [architecture.md](../architecture.md#performance-budget).
3. The no-JavaScript fallback.

Absent any of the three, the answer is no.

## Alternatives considered

### Plain HTML and CSS, no build step

- **Pros:** the absolute floor for bytes and complexity; nothing to break or update.
- **Cons:** no components, so the shared header and the repeated project card get copy-pasted; no
  typed content, so a malformed project card renders wrong instead of failing the build; no
  incremental path to the case-study pages in M3.
- **Rejected:** the typed content layer is what makes a content edit safe, and that is the edit this
  repo will see most often. Hand-maintained duplication is the thing a reviewing engineer would
  notice first.

### Next.js (App Router, static export)

- **Pros:** the owner's current professional stack, and therefore the most familiar; strong
  ecosystem; the obvious default.
- **Cons:** ships a React runtime and a hydration payload for a page with nothing to hydrate. Static
  export is a constrained mode of a framework built for servers, so a reader has to know which half
  applies. Far more configuration surface than the page warrants.
- **Rejected:** it inverts the default. Next.js starts with JavaScript and asks you to remove it;
  Astro starts with none and asks you to justify adding it. For this page, the second default is the
  correct one — and using the heavier tool on the lighter problem is exactly the judgment an
  engineer reading the repo is assessing. Familiarity is an argument for the author's convenience,
  not for the reader's page weight.

### Astro, but with React installed up front for practice

- **Pros:** the island is there whenever inspiration strikes; no later setup.
- **Cons:** an unused dependency in the tree, plus its config, plus its place in the lockfile and
  the advisory surface — all of it visible to the reader it was meant to impress.
- **Rejected:** "installed for practice" is the over-building failure mode in its most honest form.
  A dependency with no caller is not evidence of skill in it. The practice is better spent on a
  project that genuinely needs React — the owner has one — than on manufacturing a need here.

### A static site generator with a heavier template language (Hugo, Eleventy)

- **Pros:** mature, fast, zero JavaScript by default.
- **Cons:** no TypeScript-native content layer; the component model is weaker; and the repo's value
  as a frontend work sample drops when it is written in a template language the target roles do not
  use.
- **Rejected:** Astro gives the same zero-JavaScript result in TypeScript, which both audiences
  read.

## Consequences

- The index page ships **zero client-side JavaScript**, asserted in CI rather than trusted to
  review. Performance and accessibility stop being aspirations and become build failures.
- A content edit is a change to a typed module. A mistake fails the build.
- Astro's island model means the React decision stays genuinely open, at the cost of a single
  dependency added later — not an architecture change.
- **The owner gets less React practice from this repo.** Accepted deliberately: the site's value to
  its reader comes first, and the practice has a better home.
- Case-study pages in M3 are additional files under `src/pages/`, with no routing library and no
  architectural change.
- No webfont means typography is constrained to the system stack. Accepted: a webfont is the single
  largest easy regression against the byte budget and against LCP.
