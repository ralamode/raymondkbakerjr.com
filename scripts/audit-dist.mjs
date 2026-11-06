#!/usr/bin/env node
/**
 * Asserts the promises this project makes about its own build output.
 *
 * These are the regressions a static site actually suffers, and none of them are visible in a
 * diff: a stray island pulls in a runtime, a webfont creeps back, an image ships without
 * dimensions and reintroduces layout shift, a personal address ends up in the HTML. Each check
 * exists because AGENTS.md or docs/architecture.md claims something, and a claim with no assertion
 * behind it is decoration.
 *
 * Deliberately NOT a Lighthouse run. On a zero-JavaScript static page Lighthouse returns 100
 * regardless and its variance measures the CI runner, so it would be a slow gate that cannot fail
 * for the right reason. These assertions can.
 *
 * Zero dependencies, by design: a gate that needs an install is a gate that gets skipped.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const DIST = resolve('dist');

/** docs/architecture.md -> Performance budget. Uncompressed HTML + CSS + fonts on the index. */
const BYTE_BUDGET = 60 * 1024;

/** Text that must never appear in a published artifact. docs/content-policy.md is the rule; this
 *  is the backstop. The controlling safeguard is inspection before staging, not this. */
const FORBIDDEN = [
  { label: 'a phone number', re: /\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  {
    label: 'a personal email address',
    re: /[\w.+-]+@(?:gmail|googlemail|outlook|hotmail|yahoo|icloud|proton(?:mail)?)\.[a-z.]+/i,
  },
  { label: 'a mailto: link', re: /mailto:/i },
];

const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);

async function walk(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, found);
    else found.push(p);
  }
  return found;
}

const files = await walk(DIST).catch(() => {
  console.error('No dist/ to audit. Run `pnpm build` first.');
  process.exit(1);
});
const html = files.filter((f) => f.endsWith('.html'));
if (html.length === 0) fail('dist/ contains no HTML at all');

const indexPath = join(DIST, 'index.html');
const index = await readFile(indexPath, 'utf8');

// 1. Zero client-side JavaScript on the index. The single loudest claim this repo makes.
const scripts = [...index.matchAll(/<script\b([^>]*)>/gi)];
const shipped = scripts.filter((m) => !/\btype\s*=\s*["']application\/ld\+json["']/i.test(m[1]));
if (shipped.length > 0) {
  fail(
    `index.html ships ${shipped.length} <script> tag(s); the budget is zero:\n` +
      shipped.map((m) => `      <script${m[1]}>`).join('\n'),
  );
}

// 2. No JavaScript assets emitted at all. Catches a script pulled in by something other than a
//    literal <script> tag in the index.
const jsAssets = files.filter((f) => ['.js', '.mjs'].includes(extname(f)));
if (jsAssets.length > 0) {
  fail(
    `dist/ contains JavaScript:\n${jsAssets.map((f) => `      ${relative(DIST, f)}`).join('\n')}`,
  );
}

// 3. Byte budget: HTML + CSS + fonts, uncompressed.
const counted = files.filter((f) =>
  ['.html', '.css', '.woff', '.woff2', '.ttf', '.otf'].includes(extname(f)),
);
let total = 0;
for (const f of counted) total += (await stat(f)).size;
if (total > BYTE_BUDGET) {
  fail(`HTML + CSS + fonts is ${total} bytes, over the ${BYTE_BUDGET} byte budget`);
}
notes.push(
  `weight: ${total} / ${BYTE_BUDGET} bytes (${Math.round((total / BYTE_BUDGET) * 100)}% of budget)`,
);

// 4. No webfont. The largest easy regression against both the budget and LCP.
const fonts = files.filter((f) => ['.woff', '.woff2', '.ttf', '.otf'].includes(extname(f)));
if (fonts.length > 0) {
  fail(`dist/ ships ${fonts.length} font file(s); the system stack is the standing rule`);
}

// 5. Every image carries intrinsic dimensions. Prevents layout shift at the source rather than
//    measuring CLS after the fact.
for (const file of html) {
  const doc = await readFile(file, 'utf8');
  for (const [tag, attrs] of [...doc.matchAll(/<img\b([^>]*)>/gi)].map((m) => [m[0], m[1]])) {
    if (!/\bwidth\s*=/.test(attrs) || !/\bheight\s*=/.test(attrs)) {
      fail(`${relative(DIST, file)} has an <img> without width/height: ${tag.slice(0, 90)}`);
    }
  }
}

// 6. Nothing unpublishable reached the output.
for (const file of files.filter((f) =>
  ['.html', '.css', '.svg', '.txt', '.xml', '.json'].includes(extname(f)),
)) {
  const body = await readFile(file, 'utf8');
  for (const { label, re } of FORBIDDEN) {
    const hit = body.match(re);
    if (hit) fail(`${relative(DIST, file)} contains ${label}: ${JSON.stringify(hit[0])}`);
  }
}

// 7. No source maps. They publish the original sources and are pure weight here.
const maps = files.filter((f) => f.endsWith('.map'));
if (maps.length > 0) fail(`dist/ ships ${maps.length} source map(s)`);

// 8. Required metadata is present and canonical points at the canonical host.
const site = 'https://www.raymondkbakerjr.com';
for (const [label, re] of [
  ['<title>', /<title>[^<]{3,}<\/title>/i],
  ['meta description', /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i],
  ['viewport', /<meta[^>]+name=["']viewport["']/i],
  ['lang attribute', /<html[^>]+lang=["'][a-z]{2}/i],
  ['favicon', /<link[^>]+rel=["']icon["']/i],
]) {
  if (!re.test(index)) fail(`index.html is missing ${label}`);
}
const canonical = index.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
if (!canonical) fail('index.html is missing a canonical link');
else if (!canonical[1].startsWith(site)) {
  fail(`canonical is ${canonical[1]}, which is not on ${site}`);
}

// 9. Every internal link resolves to something that exists.
for (const file of html) {
  const doc = await readFile(file, 'utf8');
  for (const [, href] of doc.matchAll(/(?:href|src)=["'](\/[^"'#?]*)/g)) {
    const target = join(DIST, decodeURIComponent(href));
    const ok =
      (await stat(target).then(
        (s) => s.isFile(),
        () => false,
      )) ||
      (await stat(join(target, 'index.html')).then(
        (s) => s.isFile(),
        () => false,
      ));
    if (!ok) fail(`${relative(DIST, file)} links to ${href}, which is not in dist/`);
  }
}

for (const n of notes) console.log(`  ${n}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} build-output assertion(s) failed:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`\nBuild output clean: ${files.length} file(s), zero JavaScript, inside budget.`);
