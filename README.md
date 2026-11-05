# screenshots

Pull request screenshots, hosted so they render inside GitHub PR comments.

**This is an ORPHAN branch.** It shares no history with `main`, is never merged, and is not
part of a normal checkout. Do not branch from it or merge it anywhere.

Written by `pnpm screenshots:publish`. One directory per PR (`pr-<n>/`), so a closed PR's
images can be pruned by deleting its directory. See `.github/workflows/prune-screenshots.yml`.

`vercel.json` here opts the branch out of Vercel deployments. Vercel builds every pushed
branch and ignores `[skip ci]`, so without it each upload posts a failed preview.
