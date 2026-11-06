#!/usr/bin/env node
/**
 * Capture PR screenshots of the built site with Playwright.
 *
 * Writes PNGs to the gitignored `.screenshots/`. They are NEVER committed to this branch: they are
 * published to an orphan branch by `scripts/publish-screenshots.mjs`, which explains why that is
 * the only workable route. See also `.claude/skills/ui-screenshot/SKILL.md`.
 *
 * Captures a matrix of widths against colour schemes, because both are review obligations in
 * AGENTS.md and a screenshot of only one of them is evidence of only one of them:
 *
 *   320px   the width layouts actually break at, and the one AGENTS.md calls out for width math
 *   390px   the "mobile" the Definition of Done requires
 *   1280px  the "desktop" the Definition of Done requires
 *
 * This script serves `dist/` itself and shuts the server down on the way out, so a capture is one
 * command with no server to remember. Point it at something already running with `--base-url`.
 *
 * It serves `dist/` with ~30 lines of `node:http` rather than shelling out to `astro preview`,
 * because Astro 7's preview DAEMONISES: the foreground process prints a pid and exits 0, leaving a
 * background server and a `astro preview stop` to remember. Driving that from a script means owning
 * a daemon lifecycle, a pid file and a port conflict on re-run, all of which belong to Astro and
 * can change under us. Reading files out of `dist/` is both less code and deterministic, and it is
 * closer to what a CDN does with this output anyway.
 *
 * Usage:
 *   pnpm screenshots                                  # the matrix, against a fresh preview server
 *   pnpm screenshots --route /                        # a specific route
 *   pnpm screenshots --widths 390,1280 --themes light # a subset
 *   pnpm screenshots --base-url http://localhost:4321 # do not boot a server
 */

import { createServer } from 'node:http';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const OUT_DIR = '.screenshots';
const DEFAULT_WIDTHS = [320, 390, 1280];
const DEFAULT_THEMES = ['light', 'dark'];
const PREVIEW_PORT = 4329;
const DIST_DIR = 'dist';

/** Served content types. A wrong one is a silently broken capture, so they are explicit. */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** `/` -> `index`, `/case-studies/foo` -> `case-studies-foo`. One definition of the filename rule. */
function routeSlug(route) {
  const trimmed = route.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'index' : trimmed.replace(/\//g, '-');
}

/**
 * Serve `dist/` on `port`, resolving once it is listening. Static files only, no directory listing,
 * and every request is confined to `dist/` so a `..` in a URL cannot read the repo.
 */
async function serveDist(port) {
  const root = resolve(DIST_DIR);

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';

      // Confine to dist/. `normalize` collapses `..` before the prefix check, so a traversal
      // attempt resolves outside `root` and is refused rather than served.
      const filePath = resolve(root, '.' + normalize(pathname));
      if (filePath !== root && !filePath.startsWith(root + '/')) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      const body = await readFile(filePath);
      res.writeHead(200, {
        'content-type': MIME[extname(filePath)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  });

  await new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(port, '127.0.0.1', ok);
  });
  return server;
}

/** Close the server and wait for it, so the process exits instead of hanging on a live handle. */
function closeServer(server) {
  return new Promise((ok) => server.close(() => ok()));
}

async function main() {
  const route = arg('route', '/');
  const widths = arg('widths', DEFAULT_WIDTHS.join(','))
    .split(',')
    .map((w) => Number(w.trim()));
  const themes = arg('themes', DEFAULT_THEMES.join(','))
    .split(',')
    .map((t) => t.trim());

  if (widths.some((w) => !Number.isInteger(w) || w < 200)) {
    throw new Error(`--widths takes integers >=200, got: ${widths.join(',')}`);
  }
  for (const theme of themes) {
    if (theme !== 'light' && theme !== 'dark') {
      throw new Error(`--themes takes light|dark, got: ${theme}`);
    }
  }

  const external = arg('base-url', undefined);
  let server;
  let baseUrl = external;

  if (!external) {
    try {
      await readFile(join(DIST_DIR, 'index.html'));
    } catch {
      throw new Error(`no ${DIST_DIR}/index.html, run \`pnpm build\` first`);
    }
    server = await serveDist(PREVIEW_PORT);
    baseUrl = `http://localhost:${PREVIEW_PORT}`;
    console.log(`▸ serving ${DIST_DIR}/ on ${baseUrl}`);
  }

  // A stale PNG from a previous run would be published as if it were current, which is worse than
  // a missing one: the reviewer cannot tell.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const slug = routeSlug(route);
  const overflow = [];

  try {
    for (const theme of themes) {
      for (const width of widths) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: theme,
          // Deterministic captures: an in-flight transition is the classic source of a diff that
          // looks like a regression and is not.
          reducedMotion: 'reduce',
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();
        const res = await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });
        if (!res || !res.ok()) {
          throw new Error(`${route} returned ${res ? res.status() : 'no response'}`);
        }

        // Cheap horizontal-overflow read while a page is already open. The enforced assertion is
        // M1-5b; this just means the capture reports it rather than a reviewer eyeballing it.
        // The callback below is serialised and executed in the PAGE, where `document` exists.
        // It never runs in this Node process, so eslint's Node globals do not apply to it. A block
        // directive rather than `disable-next-line`, because Prettier reflows a long trailing
        // description and moves the directive off the line it was meant to cover.
        /* eslint-disable no-undef */
        const scroll = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        /* eslint-enable no-undef */
        if (scroll.scrollWidth > scroll.clientWidth) {
          overflow.push(`${width}px/${theme}: ${scroll.scrollWidth} > ${scroll.clientWidth}`);
        }

        const name = `${slug}-${width}w-${theme}.png`;
        await page.screenshot({ path: join(OUT_DIR, name), fullPage: true });
        console.log(`✓ ${name}`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (server) await closeServer(server);
  }

  const written = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.png'));
  console.log(`\n${written.length} screenshot(s) in ${OUT_DIR}/`);

  if (overflow.length > 0) {
    console.log('\n⚠ horizontal overflow detected:');
    for (const o of overflow) console.log(`  ${o}`);
    console.log('AGENTS.md requires no horizontal overflow at 320px. Fix before publishing.');
    process.exitCode = 1;
    return;
  }

  console.log('No horizontal overflow at any captured width.');
  console.log('Publish with: pnpm screenshots:publish --pr <n> --comment');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
