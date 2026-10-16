// Link checker for the built site.
// usage: node tools/check-links.mjs [distDir]
// Internal links and assets must exist in dist/; external URLs are fetched (GET, 15 s timeout).
// Exit code 1 when any internal link is broken or an external URL answers 404/410/5xx.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
})(dist);

const internal = new Map(); // target -> pages
const external = new Map();
const attr = /\s(?:href|src)="([^"]+)"/g;
const hint = /<link[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/g; // resource hints are not links
for (const page of pages) {
  const html = readFileSync(page, 'utf8').replace(hint, '');
  for (const [, raw] of html.matchAll(attr)) {
    const url = raw.replace(/&amp;/g, '&');
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('data:')) continue;
    const bucket = /^https?:\/\//.test(url) ? external : internal;
    if (bucket === external && url.startsWith('https://phanto17.github.io')) {
      const path = url.replace('https://phanto17.github.io', '') || '/';
      (internal.get(path) ?? internal.set(path, new Set()).get(path)).add(page);
      continue;
    }
    (bucket.get(url) ?? bucket.set(url, new Set()).get(url)).add(page);
  }
}

const rel = (p) => p.slice(dist.length + 1).replace(/\\/g, '/');
let broken = 0;

for (const [url, from] of internal) {
  const clean = url.split('#')[0].split('?')[0];
  const base = clean.startsWith('/') ? join(dist, clean) : join(dirname([...from][0]), clean);
  const ok = existsSync(base) && (statSync(base).isFile() || existsSync(join(base, 'index.html')));
  if (!ok) {
    broken++;
    console.log(`BROKEN internal ${url}  (on ${[...from].map(rel).join(', ')})`);
  }
}
console.log(`internal: ${internal.size} unique targets, ${broken} broken`);

const results = await Promise.all(
  [...external.keys()].map(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0 (portfolio link check)' },
      });
      return [url, res.status];
    } catch (e) {
      return [url, `error: ${e.cause?.code ?? e.name}`];
    }
  }),
);
let extBad = 0;
for (const [url, status] of results.sort((a, b) => String(a[1]).localeCompare(String(b[1])))) {
  const bad = typeof status !== 'number' || status === 404 || status === 410 || status >= 500;
  if (bad) extBad++;
  if (bad || status !== 200) console.log(`${bad ? 'BAD ' : 'note'} ${status}  ${url}`);
}
console.log(`external: ${external.size} unique URLs, ${extBad} bad (403/429 are bot blocks, not dead links)`);
process.exit(broken || extBad ? 1 : 0);
