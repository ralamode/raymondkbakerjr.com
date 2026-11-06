#!/usr/bin/env node
/**
 * Publish `.screenshots/*.png` so they RENDER inside a GitHub pull request comment.
 *
 * ── Why this script exists ─────────────────────────────────────────────────────────────────────
 * AGENTS.md and the Definition of Done both require screenshots on any visual change, and there is
 * no way to honour that by hand: `gh` has no image-upload path, so without this the requirement is
 * aspirational. Three routes were checked before settling on this one.
 *
 *   1. GitHub's attachment hosting. There is no public asset-upload API, and the endpoint the web
 *      UI uses needs a browser session cookie and CSRF token. Not reachable from automation.
 *   2. Inline base64 `data:` URIs, which would need no hosting at all. GitHub strips them server
 *      side (a long-standing XSS and exfiltration defence): the `<img>` survives with an empty
 *      `src`. Independently, a comment body caps at 65,536 characters while a single 57KB PNG is
 *      ~76KB of base64, so one image would not fit even if it rendered.
 *   3. An orphan branch, read over HTTP. This is what works, and what this script does.
 *
 * ── The URL form is load-bearing ───────────────────────────────────────────────────────────────
 * Images are linked as `github.com/<owner>/<repo>/raw/<branch>/<path>`, NOT
 * `raw.githubusercontent.com`. GitHub does not camo-proxy these, so the viewer's own browser
 * fetches them: the `github.com` web route accepts a session cookie, while raw.githubusercontent
 * wants an `Authorization` header a browser never sends. On THIS repo, which is public, both
 * happen to work. The `/raw/` form is used anyway so that nothing breaks on the day the repo is
 * made private, which is exactly when nobody would connect the two facts.
 *
 * ── Why an orphan ──────────────────────────────────────────────────────────────────────────────
 * `screenshots` shares no history with `main`. Images never enter source history, never appear in
 * a normal clone, and the branch can be pruned or reset without touching anything that matters.
 * Files land at `pr-<n>/<name>.png`, so one PR's images are self-contained and deletable.
 * `.github/workflows/prune-screenshots.yml` removes a PR's directory when it closes.
 *
 * Usage:
 *   pnpm screenshots:publish --pr 7                      # upload and print the markdown
 *   pnpm screenshots:publish --pr 7 --comment            # ...and post it to the PR
 *   pnpm screenshots:publish --pr 7 --only 390           # filter by filename substring
 *   pnpm screenshots:publish --pr 7 --comment \
 *     --note 'Links wrap at 320px now'                   # REQUIRED from round 2 onward
 */

import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BRANCH = 'screenshots';
const SCREENSHOT_DIR = '.screenshots';

/** Hidden in the rendered comment, so numbering rounds costs the reader nothing. */
const MARKER = '<!-- screenshots -->';

/**
 * Appended to every commit this script makes, so no GitHub Actions workflow runs against an
 * images-only branch. `prune-screenshots.yml` appends the same marker; YAML cannot import this
 * constant, so the two are kept in sync by the comment there.
 */
const SKIP_CI = '[skip ci]';

/**
 * Stops Vercel deploying this branch. Vercel builds every pushed branch and IGNORES `[skip ci]`,
 * so without this every screenshot upload produces a failed preview deployment and an email alert.
 * Vercel reads `vercel.json` from the root directory of the PUSHED COMMIT, so the opt-out has to
 * live on this branch; one on `main` never sees these pushes. This repo's Vercel root directory is
 * the repository root, hence the bare path. Unrelated to any `vercel.json` on `main`.
 */
const VERCEL_OPT_OUT = {
  path: 'vercel.json',
  content: `${JSON.stringify({ git: { deploymentEnabled: false } }, null, 2)}\n`,
};

async function gh(args, stdin) {
  const child = execFileAsync('gh', args, { maxBuffer: 64 * 1024 * 1024 });
  if (stdin !== undefined) {
    child.child.stdin?.write(stdin);
    child.child.stdin?.end();
  }
  return (await child).stdout;
}

async function repoSlug() {
  const out = await gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  return out.trim();
}

async function branchExists(repo) {
  try {
    await gh(['api', `repos/${repo}/git/ref/heads/${BRANCH}`]);
    return true;
  } catch {
    return false;
  }
}

async function createBlob(repo, content, encoding) {
  const out = await gh(
    ['api', '-X', 'POST', `repos/${repo}/git/blobs`, '--input', '-'],
    JSON.stringify({ content, encoding }),
  );
  return JSON.parse(out).sha;
}

/** Create `screenshots` as a TRUE orphan: a parentless commit over a fresh tree. */
async function createOrphanBranch(repo) {
  console.log(`▸ creating orphan branch '${BRANCH}'…`);

  // GitHub rejects an empty tree, so seed with a README that also explains the branch to anyone
  // who stumbles onto it.
  const readme = [
    '# screenshots',
    '',
    'Pull request screenshots, hosted so they render inside GitHub PR comments.',
    '',
    '**This is an ORPHAN branch.** It shares no history with `main`, is never merged, and is not',
    'part of a normal checkout. Do not branch from it or merge it anywhere.',
    '',
    "Written by `pnpm screenshots:publish`. One directory per PR (`pr-<n>/`), so a closed PR's",
    'images can be pruned by deleting its directory. See `.github/workflows/prune-screenshots.yml`.',
    '',
    '`vercel.json` here opts the branch out of Vercel deployments. Vercel builds every pushed',
    'branch and ignores `[skip ci]`, so without it each upload posts a failed preview.',
    '',
  ].join('\n');

  const tree = JSON.parse(
    await gh(
      ['api', '-X', 'POST', `repos/${repo}/git/trees`, '--input', '-'],
      JSON.stringify({
        tree: [
          {
            path: 'README.md',
            mode: '100644',
            type: 'blob',
            sha: await createBlob(repo, Buffer.from(readme).toString('base64'), 'base64'),
          },
          {
            path: VERCEL_OPT_OUT.path,
            mode: '100644',
            type: 'blob',
            sha: await createBlob(repo, VERCEL_OPT_OUT.content, 'utf-8'),
          },
        ],
      }),
    ),
  );

  const commit = JSON.parse(
    await gh(
      ['api', '-X', 'POST', `repos/${repo}/git/commits`, '--input', '-'],
      JSON.stringify({
        message: `chore: initialise screenshot host branch ${SKIP_CI}`,
        tree: tree.sha,
        parents: [], // parentless, so a true orphan
      }),
    ),
  );

  await gh(
    ['api', '-X', 'POST', `repos/${repo}/git/refs`, '--input', '-'],
    JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: commit.sha }),
  );
  console.log(`✓ created '${BRANCH}'`);
}

/** Existing blob sha at `path`, or undefined. Needed to overwrite: the Contents API rejects a
 *  create when the file is already there, so re-running a round has to pass the old sha. */
async function existingSha(repo, path) {
  try {
    const out = await gh(['api', `repos/${repo}/contents/${path}?ref=${BRANCH}`]);
    return JSON.parse(out).sha;
  } catch {
    return undefined;
  }
}

/** Heal a branch created before the opt-out existed, before any image commit follows it. */
async function ensureVercelOptOut(repo) {
  if (await existingSha(repo, VERCEL_OPT_OUT.path)) return;
  console.log(`▸ adding ${VERCEL_OPT_OUT.path} so Vercel stops deploying '${BRANCH}'…`);
  await gh(
    ['api', '-X', 'PUT', `repos/${repo}/contents/${VERCEL_OPT_OUT.path}`, '--input', '-'],
    JSON.stringify({
      message: `chore(screenshots): opt this branch out of Vercel deployments ${SKIP_CI}`,
      content: Buffer.from(VERCEL_OPT_OUT.content).toString('base64'),
      branch: BRANCH,
    }),
  );
}

async function upload(repo, localPath, remotePath) {
  const content = (await readFile(localPath)).toString('base64');
  const sha = await existingSha(repo, remotePath);
  const body = {
    message: `chore(screenshots): ${remotePath} ${SKIP_CI}`,
    content,
    branch: BRANCH,
  };
  if (sha) body.sha = sha; // overwrite instead of failing a re-run
  await gh(
    ['api', '-X', 'PUT', `repos/${repo}/contents/${remotePath}`, '--input', '-'],
    JSON.stringify(body),
  );
  return `https://github.com/${repo}/raw/${BRANCH}/${remotePath}`;
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const pr = arg('pr');
  if (!pr || !/^\d+$/.test(pr)) throw new Error('--pr <number> is required');
  const only = arg('only');
  const note = arg('note');
  const postComment = process.argv.includes('--comment');

  const all = (await readdir(SCREENSHOT_DIR).catch(() => [])).filter((f) => f.endsWith('.png'));
  const files = only ? all.filter((f) => f.includes(only)) : all;
  if (files.length === 0) {
    throw new Error(
      `no PNGs in ${SCREENSHOT_DIR}/${only ? ` matching "${only}"` : ''} , run \`pnpm screenshots\` first`,
    );
  }

  const repo = await repoSlug();

  // Which round is this? Counted from our own marker, so a reviewer can follow the progression and
  // so a re-post can be required to explain itself.
  const comments = JSON.parse(
    await gh(['api', `repos/${repo}/issues/${pr}/comments`, '--paginate']),
  );
  const round = comments.filter((c) => c.body.includes(MARKER)).length + 1;
  if (round > 1 && !note) {
    throw new Error(
      `this is screenshot round ${round} on PR #${pr}. Pass --note "<what changed>".\n` +
        'A PR carrying several screenshot comments is unreadable without it, and a reviewer should\n' +
        'not have to diff two images by eye to work out what moved.',
    );
  }

  if (!(await branchExists(repo))) await createOrphanBranch(repo);
  await ensureVercelOptOut(repo);

  const links = [];
  for (const file of files.sort()) {
    const url = await upload(repo, join(SCREENSHOT_DIR, file), `pr-${pr}/${file}`);
    console.log(`✓ ${file}`);
    links.push({ name: basename(file, '.png'), url });
  }

  // Round 1 renders expanded; later rounds collapse, so superseded shots do not bury the current
  // ones. The note is the first thing a reviewer reads.
  const markdown = [
    MARKER,
    round === 1 ? '## Screenshots' : `## Screenshots, round ${round}`,
    '',
    ...(note ? [`**What changed:** ${note}`, ''] : []),
    ...links.map(
      (l) =>
        `<details${round === 1 ? ' open' : ''}><summary><code>${l.name}</code></summary>\n\n` +
        `![${l.name}](${l.url})\n\n</details>`,
    ),
  ].join('\n');

  console.log(`\n${'─'.repeat(60)}\n${markdown}\n${'─'.repeat(60)}`);

  if (postComment) {
    await gh(['pr', 'comment', pr, '--body', markdown]);
    console.log(`\n✓ posted to PR #${pr}`);
  } else {
    console.log('\n(pass --comment to post this to the PR)');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
