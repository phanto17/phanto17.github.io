// Check built links and assets. Usage: node tools/check-links.mjs [distDir] [--internal-only]
// The optional flag skips external requests, but still validates local paths and HTML fragments.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const internalOnly = args.includes('--internal-only');
const dist = resolve(args.find((arg) => !arg.startsWith('--')) ?? 'dist');
const siteOrigin = 'https://phanto17.github.io';
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (file.endsWith('.html')) pages.push(file);
  }
})(dist);

const internal = new Map(); // Resolved URL -> source pages, including query and fragment.
const external = new Map();
const attr = /\s(?:href|src)="([^"]+)"/g;
const hint = /<link[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/g;
let broken = 0;
const rel = (file) => relative(dist, file).split(sep).join('/');

for (const page of pages) {
  const pagePath = `/${rel(page).replace(/index\.html$/, '')}`;
  const html = readFileSync(page, 'utf8').replace(hint, '');
  for (const [, raw] of html.matchAll(attr)) {
    const value = raw.replace(/&amp;/g, '&');
    let url;
    try {
      url = new URL(value, `${siteOrigin}${pagePath}`);
    } catch {
      broken++;
      console.log(`BROKEN URL ${value} (on ${rel(page)})`);
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    const bucket = url.origin === siteOrigin ? internal : external;
    const key = url.href;
    if (!bucket.has(key)) bucket.set(key, new Set());
    bucket.get(key).add(page);
  }
}

const idCache = new Map();
function idsFor(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    const ids = new Set();
    for (const match of html.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      ids.add(match[1] ?? match[2]);
    }
    for (const match of html.matchAll(/<a\b[^>]*\sname\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      ids.add(match[1] ?? match[2]);
    }
    idCache.set(file, ids);
  }
  return idCache.get(file);
}

for (const [href, from] of internal) {
  const url = new URL(href);
  let pathname;
  let fragment;
  try {
    pathname = decodeURIComponent(url.pathname);
    fragment = decodeURIComponent(url.hash.slice(1));
  } catch {
    broken++;
    console.log(`BROKEN encoding ${href} (on ${[...from].map(rel).join(', ')})`);
    continue;
  }
  let target = resolve(dist, `.${pathname}`);
  const inside = target === dist || target.startsWith(`${dist}${sep}`);
  if (inside && existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!inside || !existsSync(target) || !statSync(target).isFile()) {
    broken++;
    console.log(`BROKEN internal ${href} (on ${[...from].map(rel).join(', ')})`);
  } else if (fragment && target.endsWith('.html') && !idsFor(target).has(fragment)) {
    broken++;
    console.log(`BROKEN fragment ${href} (on ${[...from].map(rel).join(', ')})`);
  }
}
console.log(`internal: ${internal.size} resolved URLs, ${broken} broken`);

if (internalOnly) {
  console.log(`external: ${external.size} URLs skipped (--internal-only)`);
  process.exit(broken ? 1 : 0);
}

const results = await Promise.all([...external.keys()].map(async (url) => {
  try {
    const res = await fetch(url, {
      method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (portfolio link check)' },
    });
    return [url, res.status];
  } catch (error) {
    return [url, `error: ${error.cause?.code ?? error.name}`];
  }
}));
let extBad = 0;
for (const [url, status] of results.sort((a, b) => String(a[1]).localeCompare(String(b[1])))) {
  const bad = typeof status !== 'number' || status === 404 || status === 410 || status >= 500;
  if (bad) extBad++;
  if (bad || status !== 200) console.log(`${bad ? 'BAD ' : 'note'} ${status}  ${url}`);
}
console.log(`external: ${external.size} unique URLs, ${extBad} bad (403/429 are bot blocks, not dead links)`);
process.exit(broken || extBad ? 1 : 0);
