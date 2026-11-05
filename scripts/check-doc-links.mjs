#!/usr/bin/env node
/**
 * Validates every relative Markdown link in the repository.
 *
 * Three classes of failure, all of which have shipped in real repositories:
 *
 *   1. The target does not exist — a doc was renamed and its inbound links were not.
 *   2. The target exists but the case differs. macOS and Windows resolve this; Linux and
 *      github.com do not. The link works for the author and 404s for everyone else, which
 *      is why the check compares against the real directory entry rather than calling
 *      `existsSync`.
 *   3. The `#fragment` names no heading in the target file.
 *
 * External (http/https/mailto/tel) links are out of scope: checking them makes CI depend on
 * someone else's uptime and rate limits. They are verified by the post-deploy link check
 * described in docs/architecture.md.
 *
 * Zero dependencies, by design — a gate that needs an install is a gate that gets skipped.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.astro', '.vercel']);

/** Walk the tree, collecting files that match `predicate`. */
function walk(dir, predicate, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), predicate, found);
    } else if (predicate(entry.name)) {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

/**
 * GitHub's heading-to-anchor slug: strip inline code and link syntax, lowercase, drop
 * everything that is not alphanumeric / space / hyphen / underscore, then spaces to hyphens.
 */
function slugify(heading) {
  return heading
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 \-_]/g, '')
    .replace(/ /g, '-');
}

/** Anchors a Markdown file offers: its heading slugs, plus any explicit HTML id/name. */
function anchorsOf(file) {
  const text = readFileSync(file, 'utf8');
  const anchors = new Set();
  let inFence = false;

  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) anchors.add(slugify(heading[1]));
  }
  for (const [, id] of text.matchAll(/<[^>]+\s(?:id|name)=["']([^"']+)["']/g)) {
    anchors.add(id.toLowerCase());
  }
  return anchors;
}

/** Inline links, reference definitions, and bare image targets. */
function linksOf(file) {
  const text = readFileSync(file, 'utf8');
  const links = [];
  const lines = text.split('\n');
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const withoutCode = line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
    for (const [, target] of withoutCode.matchAll(/!?\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
      links.push({ target, line: index + 1 });
    }
    const definition = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/.exec(withoutCode);
    if (definition) links.push({ target: definition[1], line: index + 1 });
  });
  return links;
}

/** True when `path` exists with exactly this spelling, case included. */
function existsCaseSensitive(path) {
  try {
    const entries = readdirSync(dirname(path));
    return entries.includes(basename(path));
  } catch {
    return false;
  }
}

const EXTERNAL = /^(https?:|mailto:|tel:|#|\/\/)/i;
const failures = [];

for (const file of walk(ROOT, (name) => name.endsWith('.md'))) {
  const rel = relative(ROOT, file);
  const selfAnchors = anchorsOf(file);

  for (const { target, line } of linksOf(file)) {
    const at = `${rel}:${line}`;

    // Same-file fragment.
    if (target.startsWith('#')) {
      const fragment = decodeURIComponent(target.slice(1)).toLowerCase();
      if (fragment && !selfAnchors.has(fragment)) {
        failures.push(`${at}  no heading matches "${target}" in this file`);
      }
      continue;
    }
    if (EXTERNAL.test(target)) continue;

    const [rawPath, fragment] = target.split('#');
    const absolute = target.startsWith('/')
      ? join(ROOT, decodeURIComponent(rawPath))
      : resolve(dirname(file), decodeURIComponent(rawPath));

    if (!existsCaseSensitive(absolute)) {
      failures.push(`${at}  target does not exist: ${target}`);
      continue;
    }

    // Guard the whole relative path, not just the leaf: one wrong-case directory is enough.
    const segments = relative(ROOT, absolute).split(sep);
    let walked = ROOT;
    for (const segment of segments) {
      if (!existsCaseSensitive(join(walked, segment))) {
        failures.push(`${at}  case mismatch in "${segment}": ${target} (breaks on Linux)`);
        break;
      }
      walked = join(walked, segment);
    }

    if (fragment && statSync(absolute).isFile() && absolute.endsWith('.md')) {
      const wanted = decodeURIComponent(fragment).toLowerCase();
      if (!anchorsOf(absolute).has(wanted)) {
        failures.push(`${at}  no heading matches "#${fragment}" in ${rawPath}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} broken documentation link(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error('');
  process.exit(1);
}
console.log('All relative documentation links resolve.');
