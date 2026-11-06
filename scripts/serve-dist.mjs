#!/usr/bin/env node
/**
 * Serves the built site from `dist/`.
 *
 * Shared by `capture-screenshots.mjs` and Playwright's `webServer`, which is why it is its own
 * module: two copies of a static file server would drift, and the one that drifts is whichever is
 * not being looked at. Run directly, it serves until killed, which is the shape Playwright wants.
 *
 * Not `astro preview`: Astro 7's preview daemonises. It prints a pid, exits 0 and leaves a
 * background server plus an `astro preview stop` to remember, so driving it from a script means
 * owning a pid file and a port conflict on re-run. Reading files out of `dist/` is less code, and
 * closer to what a CDN does with this output.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

export const DIST_DIR = 'dist';
export const DEFAULT_PORT = 4329;

/** Served content types. A wrong one is a silently broken page, so they are explicit. */
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

/** Serve `dist/` on `port`, resolving once it is listening. */
export async function serveDist(port = DEFAULT_PORT) {
  const root = resolve(DIST_DIR);

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      const pathname = decodeURIComponent(url.pathname);

      // Confine every request to dist/. `normalize` collapses `..` before the prefix check, so a
      // traversal attempt resolves outside `root` and is refused rather than served.
      const filePath = resolve(root, '.' + normalize(pathname));
      if (filePath !== root && !filePath.startsWith(root + '/')) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      // Directory index resolution, for `/about` as well as `/about/`. Astro emits
      // `dist/about/index.html` and a real host serves it at both paths; without this the suite
      // 404s on every page but the root and would be testing something the site is not.
      let body;
      try {
        body = await readFile(filePath);
      } catch (err) {
        if (err.code !== 'EISDIR' && err.code !== 'ENOENT') throw err;
        body = await readFile(join(filePath, 'index.html'));
      }
      res.writeHead(200, {
        'content-type': MIME[extname(filePath) || '.html'] ?? 'application/octet-stream',
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

/** Close and wait, so a caller's process exits instead of hanging on a live handle. */
export function closeServer(server) {
  return new Promise((ok) => server.close(() => ok()));
}

// Run directly: serve until killed. This is Playwright's `webServer` entry point.
if (import.meta.filename === process.argv[1]) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  await serveDist(port);
  console.log(`serving ${DIST_DIR}/ on http://localhost:${port}`);
}
