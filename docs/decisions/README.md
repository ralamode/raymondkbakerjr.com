# Architecture Decision Records

An ADR records _why_ a decision was made — the context, the constraints, the alternatives, and the
grounds on which they lost. The code already shows what was built; the reasoning is the part a
reader six months later cannot reconstruct, and the part that keeps a settled question from being
reopened every time someone new reads the repo.

## When to write one

- Choosing a framework, a host, or a dependency that shapes the build
- Deciding to **defer or not build** something a reader would expect to see
- Any decision that would be expensive to reverse

Not for: a naming preference, a one-line config change, or anything the code states plainly.

## Format

`NNNN-kebab-case-slug.md`, numbered sequentially. Sections: **Status · Date · Context · Decision ·
Alternatives considered · Consequences**. Alternatives are not optional — an ADR without them is a
press release.

## Lifecycle

```
Proposed → Accepted → (Superseded by ADR-NNNN | Deprecated)
```

**ADRs are never deleted, and never edited into a different decision.** A change of mind is a new
ADR that supersedes the old one, and the old one's Status line is updated to point at it. The
historical record is the point. Correcting a typo or adding a cross-link is fine; changing what was
decided is not.

## Index

| ADR                                     | Decision                                                     | Status   |
| --------------------------------------- | ------------------------------------------------------------ | -------- |
| [0001](./0001-astro-static-first.md)    | Astro with static output; React only when an island earns it | Accepted |
| [0002](./0002-vercel-static-hosting.md) | Vercel static hosting, no SSR adapter                        | Accepted |
| [0003](./0003-defer-contact-form.md)    | No contact form at launch; LinkedIn is the contact path      | Accepted |
