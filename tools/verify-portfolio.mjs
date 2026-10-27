// Comprehensive verification suite for the built portfolio in dist/ + TelegraphEngine & TelegraphStageController unit tests.
import { TelegraphEngine, TelegraphStageController } from '../src/scripts/telegraph-engine.ts';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'd:/Portfolio/dist');
let passed = 0;

function check(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

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
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.html')) htmlFiles.push(full);
  }
})(dist);

check('Zero external Google Fonts links in any built HTML file, and local WOFF2 preloads exist', () => {
  assert.ok(htmlFiles.length >= 8, `Expected at least 8 HTML pages, found ${htmlFiles.length}`);
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
check('Every page includes skip-link, main landmark, and accessible mobile menu toggle', () => {
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

check('Every <img> has non-empty alt, width, height, and uses .avif format', () => {
  const imgRegex = /<img\b[^>]*>/g;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const imgs = html.match(imgRegex) ?? [];
    for (const tag of imgs) {
      assert.match(tag, /\balt="[^"]+"/, `Image missing non-empty alt in ${file}: ${tag}`);
      assert.match(tag, /\bwidth="\d+"/, `Image missing width in ${file}: ${tag}`);
      assert.match(tag, /\bheight="\d+"/, `Image missing height in ${file}: ${tag}`);
      assert.match(tag, /\bsrc="[^"]+\.avif"/, `Image not using .avif in ${file}: ${tag}`);
    }
  }
});

check('Home page has static CRT spec readout bar and no moving slider below the title', () => {
  const homeHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.ok(!homeHtml.includes('class="marquee-band"'), 'Moving slider below title must not exist');
  assert.ok(homeHtml.includes('class="crt-spec-grid'), 'Missing static CRT spec readout bar below hero');
});

console.log('\n=== 3. Subpage Hierarchy, Telemetry Chips, Honesty Disclosures & Style Guide ===');
check('All 4 project subpages render verified telemetry chips and honesty disclosures', () => {
  for (const slug of ['horde-hours', 'push-comes-to-shove', 'cinderhold', 'eternity-keeper']) {
    const p = join(dist, 'projects', slug, 'index.html');
    const html = readFileSync(p, 'utf8');
    assert.ok(html.includes('class="stat-chip"'), `Missing .stat-chip in ${slug}`);
    assert.ok(html.includes('Claude Code'), `Missing AI honesty disclosure in ${slug}`);
    assert.ok(html.includes('id="crt-toggle"'), `Missing CRT scanline toggle in ${slug}`);
  }
});

check('Game subpages render collapsible <details class="changelog"> iteration drawers', () => {
  for (const slug of ['horde-hours', 'push-comes-to-shove', 'cinderhold']) {
    const p = join(dist, 'projects', slug, 'index.html');
    const html = readFileSync(p, 'utf8');
    assert.match(html, /<details\b[^>]*class="[^"]*\bchangelog\b/, `Missing <details class="changelog"> in ${slug}`);
  }
});

check('/style-guide/index.html is built and marked noindex', () => {
  const sg = readFileSync(join(dist, 'style-guide', 'index.html'), 'utf8');
  assert.ok(sg.includes('<meta name="robots" content="noindex">'), 'Style guide must be noindex');
  assert.ok(sg.includes('--coral') && sg.includes('Fraunces'), 'Style guide missing tokens');
});

console.log('\n=== 4. Technical SEO: robots.txt, sitemap.xml & JSON-LD Structured Data ===');
check('robots.txt and sitemap.xml exist and list all canonical routes', () => {
  const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Sitemap: https://phanto17.github.io/sitemap.xml'));
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  for (const slug of ['horde-hours', 'push-comes-to-shove', 'cinderhold', 'eternity-keeper']) {
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
  const homeLd = JSON.parse(ldMatch[1]);
  assert.equal(homeLd['@type'], 'Person');
  assert.equal(homeLd.jobTitle, 'Junior Gameplay Programmer (Unity / C#)');

  const gameHtml = readFileSync(join(dist, 'projects', 'push-comes-to-shove', 'index.html'), 'utf8');
  const gameLd = JSON.parse(gameHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(gameLd['@type'], 'VideoGame');

  const toolHtml = readFileSync(join(dist, 'projects', 'eternity-keeper', 'index.html'), 'utf8');
  const toolLd = JSON.parse(toolHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(toolLd['@type'], 'SoftwareApplication');
});

console.log('\n=== 5. Psychological Mini-Game ("Telegraph Recall") DOM & State Machine Tests ===');
check('Home page embeds #lab mini-game with 16 ARIA gridcells and polite live region', () => {
  const homeHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.ok(homeHtml.includes('id="lab"'), 'Missing #lab section');
  assert.ok(homeHtml.includes('id="tg-grid"') && homeHtml.includes('role="grid"'), 'Missing #tg-grid');
  const cellMatches = homeHtml.match(/role="gridcell"/g) ?? [];
  assert.equal(cellMatches.length, 16, `Expected 16 gridcells, found ${cellMatches.length}`);
  assert.ok(homeHtml.includes('id="tg-status"') && homeHtml.includes('aria-live="polite"'), 'Missing aria-live status');
});

check('TelegraphEngine pure state machine passes deterministic wave, hint, and disruption unit tests', () => {
  let seed = 0;
  const deterministicRng = () => {
    seed = (seed + 1) % 7;
    return seed / 10;
  };
  const eng = new TelegraphEngine(deterministicRng);
  const wave1 = eng.startCampaign();
  assert.equal(wave1.length, 3, 'Wave 1 must telegraph 3 tiles');
  assert.equal(new Set(wave1).size, 3, 'Wave 1 tiles must be unique');
  assert.equal(eng.submitCell(wave1[0]).kind, 'ignored', 'Input while not accepting must be ignored');

  eng.setAcceptingInput(true);
  assert.equal(eng.submitCell(wave1[0]).kind, 'step-ok');
  assert.equal(eng.submitCell(wave1[1]).kind, 'step-ok');
  const clear1 = eng.submitCell(wave1[2]);
  assert.equal(clear1.kind, 'wave-cleared');
  assert.equal(clear1.nextWave, 2);
  assert.equal(clear1.nextLength, 4);

  // Test Forecast Hint consumption
  const wave2 = eng.rollWaveSequence();
  assert.equal(wave2.length, 4);
  eng.setAcceptingInput(true);
  assert.equal(eng.useForecastHint(), true, 'First forecast hint should succeed');
  assert.equal(eng.getHintsRemaining(), 0);
  eng.setAcceptingInput(true);
  assert.equal(eng.useForecastHint(), false, 'Second forecast hint must be rejected');

  // Test disruption on wrong cell
  const wrongCell = Array.from({ length: 16 }, (_, i) => i).find((i) => i !== wave2[0]);
  const bad = eng.submitCell(wrongCell);
  assert.equal(bad.kind, 'disrupted');
  assert.equal(bad.expectedCell, wave2[0]);
});

check('TelegraphStageController & 3-Stage CRT Popup / Non-Linear Portal DOM pass verification', () => {
  const homeHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.ok(homeHtml.includes('id="tg-crt-popup"') && homeHtml.includes('role="dialog"'), 'Missing PopupCRT dialog');
  assert.ok(homeHtml.includes('id="tg-stage-router"'), 'Missing StageRouter viewport');
  assert.ok(homeHtml.includes('id="tg-portal-grid"'), 'Missing NonLinearLayout portal grid');

  const ctrl = new TelegraphStageController();
  assert.equal(ctrl.getStage(), 'welcome');
  const step2 = ctrl.nextStage();
  assert.equal(step2.to.id, 'animation-sequence');
  assert.equal(step2.to.transition, 'scanline-wipe');
  const step3 = ctrl.nextStage();
  assert.equal(step3.to.id, 'title-intro');
  assert.equal(ctrl.getVisitedStages().length, 3);

  ctrl.selectPortal('tactics-shove');
  ctrl.selectPortal('dungeon-cinderhold');
  assert.equal(ctrl.getExploredPortals().length, 3);
  assert.ok(ctrl.getInteractionCount() >= 4);
});

console.log(`\nALL ${passed} VERIFICATION CHECKS PASSED!`);
