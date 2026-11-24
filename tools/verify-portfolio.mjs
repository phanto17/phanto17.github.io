// Verification suite for the ArtCraft-structured portfolio in dist/
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? join(import.meta.dirname, '..', 'dist'));
let passed = 0;

function check(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const ALL_SLUGS = [
  'push-comes-to-shove',
  'cinderhold',
  'horde-hours',
  'please-take-a-number',
  'barrowlight',
  'eternity-keeper',
];
const GAME_SLUGS = ['push-comes-to-shove', 'cinderhold', 'horde-hours', 'please-take-a-number', 'barrowlight'];
const SOFTWARE_SLUGS = ['eternity-keeper'];

console.log('=== 1. Self-Hosted WOFF2 Fonts & Zero Third-Party Font Requests ===');
const expectedFonts = [
  'dm-mono-normal-400-latin-ext.woff2',
  'dm-mono-normal-400-latin.woff2',
  'dm-mono-normal-500-latin-ext.woff2',
  'dm-mono-normal-500-latin.woff2',
  'dm-sans-italic-400-latin-ext.woff2',
  'dm-sans-italic-400-latin.woff2',
  'dm-sans-normal-400-600-latin-ext.woff2',
  'dm-sans-normal-400-600-latin.woff2',
  'fraunces-italic-400-700-latin-ext.woff2',
  'fraunces-italic-400-700-latin.woff2',
  'fraunces-normal-400-700-latin-ext.woff2',
  'fraunces-normal-400-700-latin.woff2',
];

check('All 12 self-hosted WOFF2 files exist in dist/fonts/', () => {
  for (const f of expectedFonts) {
    const p = join(dist, 'fonts', f);
    assert.ok(existsSync(p), `Missing font file: ${p}`);
    assert.ok(statSync(p).size > 5000, `Font file unexpectedly small: ${f}`);
  }
});

const htmlFiles = [];
const jsFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.html')) htmlFiles.push(full);
    else if (entry.endsWith('.js')) jsFiles.push(full);
  }
})(dist);

check('Zero external Google Fonts links in any built HTML file, and local WOFF2 preloads exist', () => {
  assert.ok(htmlFiles.length >= 10, `Expected at least 10 HTML pages, found ${htmlFiles.length}`);
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    assert.ok(!html.includes('fonts.googleapis.com'), `Found fonts.googleapis.com in ${file}`);
    assert.ok(!html.includes('fonts.gstatic.com'), `Found fonts.gstatic.com in ${file}`);
    assert.ok(
      html.includes('/fonts/fraunces-normal-400-700-latin.woff2'),
      `Missing Fraunces preload in ${file}`,
    );
  }
});

console.log('\n=== 2. Accessibility, Mobile Nav, Skip Links & Intrinsic Image Dimensions ===');
check('Every page includes skip-link, <main id="main">, and accessible mobile menu toggle', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    assert.ok(html.includes('class="skip-link" href="#main"'), `Missing skip-link in ${file}`);
    assert.ok(html.includes('<main id="main">'), `Missing <main id="main"> in ${file}`);
    assert.ok(
      html.includes('aria-controls="nav-links"') && html.includes('aria-expanded="false"'),
      `Missing accessible mobile menu button in ${file}`,
    );
  }
});

check('Every page has exactly one top-level heading', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `Expected one h1 in ${file}`);
  }
});

check('Every <img> has alt, width, height, and uses .avif format', () => {
  const imgRegex = /<img\b[^>]*>/g;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const imgs = html.match(imgRegex) ?? [];
    for (const tag of imgs) {
      assert.match(tag, /\balt="[^"]*"/, `Image missing alt in ${file}: ${tag}`);
      assert.match(tag, /\bwidth="\d+"/, `Image missing width in ${file}: ${tag}`);
      assert.match(tag, /\bheight="\d+"/, `Image missing height in ${file}: ${tag}`);
      assert.match(tag, /\bsrc="[^"]+\.avif"/, `Image not using .avif in ${file}: ${tag}`);
    }
  }
});

console.log('\n=== 3. ArtCraft Framed Layout & Zero Map / Mini-Game Checks ===');
check('Home page uses the ArtCraft framed structure with sections 01-05 and Contact', () => {
  const homeHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.ok(homeHtml.includes('class="rail-frame"'), 'Home missing .rail-frame');
  for (const id of ['overview', 'projects', 'about', 'experience', 'activities', 'contact']) {
    assert.ok(homeHtml.includes(`id="${id}"`), `Home missing section #${id}`);
  }
  assert.ok(!homeHtml.includes('class="marquee-band"'), 'Marquee band must not exist');
});

check('Built bundle contains zero interactive map or Telegraph mini-game artifacts', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    assert.ok(!html.includes('id="world"'), `Unexpected map #world in ${file}`);
    assert.ok(!html.includes('id="tg-grid"'), `Unexpected Telegraph #tg-grid in ${file}`);
    assert.ok(!html.includes('id="tg-crt-popup"'), `Unexpected Telegraph popup in ${file}`);
    assert.ok(!html.includes('id="lab"'), `Unexpected #lab section in ${file}`);
  }
  for (const js of jsFiles) {
    const src = readFileSync(js, 'utf8');
    assert.ok(!src.includes('THREE.WebGLRenderer') && !src.includes('OrbitControls'), `Unexpected Three.js code in ${js}`);
  }
});

console.log('\n=== 4. Subpage Telemetry, Honesty Disclosures, CV & Style Guide ===');
check('All 6 project subpages render stat chips, CRT toggle and AI honesty disclosures', () => {
  for (const slug of ALL_SLUGS) {
    const p = join(dist, 'projects', slug, 'index.html');
    assert.ok(existsSync(p), `Missing project page: ${p}`);
    const html = readFileSync(p, 'utf8');
    assert.ok(html.includes('class="stat-chip"'), `Missing .stat-chip in ${slug}`);
    assert.ok(html.includes('id="crt-toggle"'), `Missing #crt-toggle in ${slug}`);
    assert.ok(
      html.includes('Claude Code') || html.includes('Codex'),
      `Missing AI disclosure in ${slug}`,
    );
  }
});

check('Updated game subpages render collapsible <details class="changelog"> iteration drawers', () => {
  for (const slug of ['horde-hours', 'push-comes-to-shove', 'cinderhold']) {
    const p = join(dist, 'projects', slug, 'index.html');
    const html = readFileSync(p, 'utf8');
    assert.match(html, /<details\b[^>]*class="[^"]*\bchangelog\b/, `Missing <details class="changelog"> in ${slug}`);
  }
});

check('/style-guide/index.html is built and marked noindex', () => {
  const sg = readFileSync(join(dist, 'style-guide', 'index.html'), 'utf8');
  assert.ok(sg.includes('<meta name="robots" content="noindex">'), 'Style guide must be noindex');
  assert.ok(sg.includes('coral') && sg.includes('Fraunces'), 'Style guide missing tokens');
});

check('Key honesty disclosures remain intact across all confirmed repos', () => {
  const cinderhold = readFileSync(join(dist, 'projects', 'cinderhold', 'index.html'), 'utf8');
  const eternity = readFileSync(join(dist, 'projects', 'eternity-keeper', 'index.html'), 'utf8');
  const jam = readFileSync(join(dist, 'projects', 'please-take-a-number', 'index.html'), 'utf8');
  const barrow = readFileSync(join(dist, 'projects', 'barrowlight', 'index.html'), 'utf8');
  assert.ok(cinderhold.includes('Most of the code was written with Claude Code under my direction'));
  assert.ok(eternity.includes('Most of the code was written with Codex, Antigravity and Claude Code under my direction'));
  assert.ok(jam.includes('ElevenLabs Sound Effects') && jam.includes('431'));
  assert.ok(barrow.includes('1,077') && barrow.includes('OpenAI Codex'));
  assert.ok(existsSync(join(dist, 'CV_Tymoteusz_Jaskolski_EN.pdf')), 'Missing CV PDF in dist/');
});

console.log('\n=== 5. Technical SEO: robots.txt, sitemap.xml & JSON-LD Structured Data ===');
check('robots.txt and sitemap.xml exist and list all 6 projects', () => {
  const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Sitemap: https://phanto17.github.io/sitemap.xml'));
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('https://phanto17.github.io/projects/'));
  for (const slug of ALL_SLUGS) {
    assert.ok(
      sitemap.includes(`https://phanto17.github.io/projects/${slug}/`),
      `Sitemap missing ${slug}`,
    );
  }
});

check('Indexed pages contain valid JSON-LD structured data (Person / VideoGame / SoftwareApplication)', () => {
  const homeHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  const ldMatch = homeHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, 'Missing JSON-LD on home page');
  const homeGraph = JSON.parse(ldMatch[1]);
  const homeLd = (homeGraph['@graph'] ?? [homeGraph]).find((node) => node['@type'] === 'Person');
  assert.ok(homeLd, 'Missing Person node on home page');
  assert.equal(homeLd.jobTitle, 'Junior Gameplay Programmer (Unity / C#)');

  const nodeTypes = (html) =>
    (JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'] ?? []).map(
      (n) => n['@type'],
    );

  for (const slug of GAME_SLUGS) {
    const html = readFileSync(join(dist, 'projects', slug, 'index.html'), 'utf8');
    assert.ok(nodeTypes(html).includes('VideoGame'), `Missing VideoGame JSON-LD on ${slug}`);
  }
  for (const slug of SOFTWARE_SLUGS) {
    const html = readFileSync(join(dist, 'projects', slug, 'index.html'), 'utf8');
    assert.ok(nodeTypes(html).includes('SoftwareApplication'), `Missing SoftwareApplication JSON-LD on ${slug}`);
  }
});

console.log(`\nALL ${passed} VERIFICATION CHECKS PASSED!`);
