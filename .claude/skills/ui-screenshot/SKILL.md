---
name: ui-screenshot
description:
  Capture and publish pull request screenshots for any visual change in this repo. Use when a change
  touches markup, styles or anything a reviewer would need to see, and before marking such a PR
  ready. Captures a width and colour-scheme matrix with Playwright and publishes the images so they
  render inside the PR.
---

# Screenshot a UI change

`AGENTS.md` and the [Definition of Done](../../../docs/definition-of-done.md) require screenshots on
any visual change. This is how that requirement is actually met, rather than claimed.

## Capture

```bash
pnpm build
pnpm screenshots
```

Writes six PNGs to the gitignored `.screenshots/`: 320px, 390px and 1280px, each in light and dark.
All three widths are obligations rather than taste. 320px is where layouts break and is the width
`AGENTS.md` asks you to do the math for, while 390px and 1280px are the mobile and desktop the
Definition of Done names. Both colour schemes, because the site has a dark mode and a screenshot of
one scheme is evidence about one scheme.

The script serves `dist/` itself and shuts the server down afterwards, so there is nothing to start
or stop. It also reports horizontal overflow at every width and **exits non-zero if it finds any**,
so a 320px overflow stops you before you publish rather than during review.

Useful flags:

```bash
pnpm screenshots --route /                        # a specific route
pnpm screenshots --widths 390,1280 --themes light # a subset
pnpm screenshots --base-url http://localhost:4321 # something already running
```

## Look at them

Open the PNGs before publishing. The capture proves the page rendered; it does not prove the page is
right. Check the things the matrix exists to surface: does anything clip or overflow at 320px, does
the dark scheme have real contrast rather than inherited defaults, do tap targets still look like
44px at 390px.

## Publish

```bash
pnpm screenshots:publish --pr <n> --comment
```

Uploads to the orphan `screenshots` branch and posts one comment with the images collapsed under
their names. **Never commit the PNGs to your branch.** `scripts/publish-screenshots.mjs` explains at
length why hosting is unavoidable, the short version being that `gh` has no image upload path and
GitHub strips base64 `data:` URIs.

On a re-post, `--note` is required and the script refuses without it:

```bash
pnpm screenshots:publish --pr <n> --comment --note 'Links wrap at 320px now'
```

A PR carrying several screenshot comments is unreadable without it, and a reviewer should not have
to diff two images by eye to work out what moved. Round 1 renders expanded, later rounds collapse,
so superseded images do not bury the current ones.

Images are deleted automatically when the PR closes
([`prune-screenshots.yml`](../../../.github/workflows/prune-screenshots.yml)).

## Once Vercel is connected

The preview deployment is the better tool for _exploring_ a change: a reviewer can open it at any
width and actually interact. Screenshots stay required anyway, for two reasons a preview does not
cover. They are a durable record in the PR, where a preview URL is ephemeral and the PR outlives it.
And they are **evidence the width and colour-scheme checks were actually run**, which the Definition
of Done currently has to take on trust.

Put the preview link in the PR description and the screenshots in a comment. They answer different
questions.

## Red flags

- Publishing without opening the images first.
- Committing PNGs to a feature branch. They belong on the orphan branch.
- A re-post with a vague note. "Fixed styling" tells a reviewer nothing.
- Capturing one width because the change "only affects desktop". It is one command for all six.
