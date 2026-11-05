// Browser regression checks against dist/. Install Playwright or set PLAYWRIGHT_MODULE
// to an existing Playwright package; set CHROME_BIN to use a system Chromium browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const dist = path.resolve(__dirname, '..', 'dist');
// The home page is the field map (World.astro); the text sections, the Telegraph cabinet and the
// landing live on /overview/, so the interaction checks run there and the map has its own check.
const HOME = 'http://portfolio.test/overview/';
const routes = [
  '/', '/overview/', '/projects/', '/projects/horde-hours/', '/projects/push-comes-to-shove/',
  '/projects/cinderhold/', '/projects/eternity-keeper/', '/style-guide/', '/404.html',
];
const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.avif': 'image/avif', '.svg': 'image/svg+xml',
};

/** A shove cue (waves 4–5) is answered with the tile it lands on, one step in the arrow's direction. */
const SHOVE = { up: -4, down: 4, left: -1, right: 1 };
const landing = (idx, dir) => (dir ? idx + SHOVE[dir] : idx);

/** Telegraph Recall's script loads when the cabinet nears the viewport: scroll it in and wait for the binder. */
async function readyLab(page) {
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await page.waitForSelector('#lab[data-bound="true"]', { state: 'attached', timeout: 30000 });
}
async function openPopup(page) {
  await readyLab(page);
  await page.locator('#tg-open-popup').click();
  await page.waitForSelector('#tg-crt-popup[open]', { state: 'attached' });
  await page.waitForTimeout(150);
}

async function serveBuild(page) {
  await page.route('http://portfolio.test/**', async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    let file = path.resolve(dist, `.${pathname}`);
    if (pathname.endsWith('/')) file = path.join(file, 'index.html');
    if (!file.startsWith(`${dist}${path.sep}`) || !fs.existsSync(file)) {
      return route.fulfill({ status: 404, body: 'Not found' });
    }
    return route.fulfill({
      status: 200,
      contentType: mimeTypes[path.extname(file)] || 'application/octet-stream',
      body: fs.readFileSync(file),
    });
  });
}

async function checkLayouts(browser) {
  let checked = 0;
  for (const theme of ['prism', 'paper', 'crt']) {
    // 640×450 approximates the CSS viewport of a 1280×900 browser at 200% zoom.
    for (const [width, height] of [[320, 240], [375, 667], [640, 450], [768, 1024], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript((value) => localStorage.setItem('portfolio-theme', value), theme);
      await serveBuild(page);
      for (const route of routes) {
        await page.goto(`http://portfolio.test${route}`, { waitUntil: 'domcontentloaded' });
        const [contentWidth, viewportWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.ok(contentWidth <= viewportWidth, `${route}: horizontal overflow at ${width}px in ${theme}`);
        checked++;
      }
      await page.goto(HOME, { waitUntil: 'domcontentloaded' });
      if (width <= 980) {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('#nav-links a').first().isVisible(), true);
        const menu = await page.locator('#nav-links').boundingBox();
        assert.ok(menu && menu.y + menu.height <= height, `Menu extends below ${width}×${height}`);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#nav-links a').first().isVisible(), false);
      }
      await openPopup(page);
      const dialog = await page.locator('.crt-popup-monitor').boundingBox();
      assert.ok(dialog && dialog.y >= 0 && dialog.y + dialog.height <= height, 'Dialog exceeds viewport');
      if (width <= 680) {
        const next = await page.locator('#crt-next-stage').boundingBox();
        assert.ok(next && next.y >= dialog.y && next.y + next.height <= dialog.y + dialog.height,
          `Dialog action is outside the visible monitor at ${width}×${height}`);
      }
      if (process.env.PORTFOLIO_CAPTURE_DIR && (width === 375 || width === 1440)) {
        await page.screenshot({ path: path.join(process.env.PORTFOLIO_CAPTURE_DIR, `dialog-${theme}-${width}.png`) });
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'tg-open-popup');
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log(`Layout: ${checked} page/theme/viewport combinations passed.`);
}

async function checkNoJavaScript(browser) {
  for (const width of [320, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 700 }, javaScriptEnabled: false });
    await serveBuild(page);
    await page.goto(HOME, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#nav-links a').first().isVisible(), true);
    assert.equal(await page.locator('#tg-open-popup').isVisible(), false);
    assert.equal(await page.locator('noscript p').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.close();
  }
  // Without scripts nothing draws the field: the hero text sits on the static backdrop. Read each
  // hero line's own colour against the ground under it (the text made transparent, layout kept).
  // A blurred prism band behind the heroes washed them out until 2026-11-04.
  const decoder = await browser.newPage();
  const low = [];
  for (const theme of ['prism', 'paper', 'crt']) {
    for (const [url, width] of [['/overview/', 390], ['/overview/', 1440], ['/projects/push-comes-to-shove/', 1440], ['/404.html', 390]]) {
      const page = await browser.newPage({ viewport: { width, height: 800 }, javaScriptEnabled: false, colorScheme: theme === 'paper' ? 'light' : 'dark' });
      await page.route('http://portfolio.test/**', async (route) => {
        const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
        let file = path.resolve(dist, `.${pathname}`);
        if (pathname.endsWith('/')) file = path.join(file, 'index.html');
        if (!file.startsWith(`${dist}${path.sep}`) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
        let body = fs.readFileSync(file);
        if (file.endsWith('.html')) {
          let html = body.toString('utf8');
          // Without scripts the theme can only come from the OS scheme; CRT is set on the element.
          if (theme === 'crt') html = html.replace('<html ', '<html data-theme="crt" ');
          if (new URL(route.request().url()).searchParams.has('bare')) {
            html = html.replace('</head>', '<style>* { color: transparent !important; text-shadow: none !important; }</style></head>');
          }
          body = html;
        }
        return route.fulfill({ status: 200, contentType: mimeTypes[path.extname(file)] || 'application/octet-stream', body });
      });
      await page.goto(`http://portfolio.test${url}`, { waitUntil: 'load' });
      const regions = await page.evaluate(() => [...document.querySelectorAll('main h1, main .lead, main .kicker, main .meta, main .meta-row, main .locbar .eyebrow, main .locbar-links a')]
        .map((el) => ({ el, r: el.getBoundingClientRect(), s: getComputedStyle(el) }))
        .filter(({ r }) => r.width > 0 && r.bottom <= innerHeight)
        .map(({ el, r, s }) => ({
          name: el.tagName.toLowerCase() + (el.classList[0] ? `.${el.classList[0]}` : ''),
          x: r.left, y: r.top, w: r.width, h: r.height, ink: s.color,
          need: parseFloat(s.fontSize) >= 24 || (Number(s.fontWeight) >= 700 && parseFloat(s.fontSize) >= 18.66) ? 3 : 4.5,
        })));
      assert.ok(regions.length > 0, `No hero text found on ${url}`);
      await page.goto(`http://portfolio.test${url}?bare`, { waitUntil: 'load' });
      const png = (await page.screenshot()).toString('base64');
      const ratios = await groundContrast(decoder, png, regions);
      regions.forEach((r, i) => { if (ratios[i] < r.need) low.push(`${theme} ${url}@${width} ${r.name}: ${ratios[i].toFixed(2)}:1 (needs ${r.need})`); });
      await page.close();
    }
  }
  await decoder.close();
  assert.deepEqual(low, [], 'Hero text without scripts falls under its WCAG minimum');
  console.log('Script-free navigation, game fallback and hero contrast passed.');
}

async function checkAnchorNavigation(browser) {
  const page = await browser.newPage({ viewport: { width: 640, height: 450 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  await page.locator('.menu-toggle').click();
  await page.locator('#nav-links a[href="/overview/#activities"]').click();
  const heading = await page.locator('#activities h2').boundingBox();
  const navigation = await page.locator('nav.nav').boundingBox();
  assert.ok(heading && navigation && heading.y >= navigation.y + navigation.height,
    'The sticky navigation obscures the section heading');
  await page.close();
  console.log('Anchor navigation remains visible below the sticky header.');
}

async function checkGame(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'domcontentloaded' });
  await openPopup(page);
  assert.equal(await page.getByRole('dialog', { name: 'Telegraph Recall introduction' }).isVisible(), true);
  assert.equal(await page.locator('#crt-prev-stage').isVisible(), false);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('#tg-crt-popup')?.contains(document.activeElement)), true,
      'Keyboard focus escaped the open dialog');
  }
  await page.locator('#crt-next-stage').click();
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Watch the signal');
  await page.keyboard.press('3');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Telegraph Recall');
  assert.equal(await page.locator('[data-stage-target="title-intro"]').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('1');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Welcome to Telegraph Recall');
  assert.equal(await page.locator('#crt-prev-stage').isVisible(), false);
  await page.locator('[data-stage-target="title-intro"]').click();
  const lastNote = page.locator('[data-popup-portal]').last();
  await lastNote.focus();
  const noteBounds = await lastNote.boundingBox();
  const footerBounds = await page.locator('.crt-popup-footer').boundingBox();
  assert.ok(noteBounds && footerBounds && noteBounds.y + noteBounds.height <= footerBounds.y + 1,
    'Focused note is obscured by the sticky action bar');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tg-open-popup');

  await page.locator('#tg-manual').click();
  assert.equal(await page.locator('#tg-next-cue').isVisible(), false);
  await page.locator('#tg-start').click();
  const sequence = [];
  for (let i = 0; i < 3; i++) {
    await page.locator('#tg-next-cue').click();
    sequence.push(await page.locator('.tg-cell.telegraph').getAttribute('data-idx'));
  }
  assert.equal(await page.locator('#tg-next-cue').textContent(), 'Start recall');
  await page.locator('#tg-next-cue').click();
  assert.equal(await page.locator('#tg-next-cue').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-idx')), '0');
  assert.equal(await page.getByRole('button', { name: 'Row 1, Column 1' }).count(), 1);
  for (const index of sequence) await page.locator(`.tg-cell[data-idx="${index}"]`).click();
  assert.match(await page.locator('#tg-status').textContent(), /Wave 1 resolved/);
  await page.locator('#tg-start').click();
  await page.waitForTimeout(1000); // The previous wave's 900 ms timer must not restart it.
  assert.match(await page.locator('#tg-status').textContent(), /Show first cue/);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#tg-start').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.match(await page.locator('#tg-status').textContent(), /Sequence paused/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.match(await page.locator('#tg-status').textContent(), /Telegraph 1 of 3/);
  await page.waitForFunction(() => document.querySelector('#tg-status')?.textContent?.includes('Your turn'));
  assert.deepEqual(errors, []);
  await page.close();
  console.log('Dialog focus, cues, restart and simulated visibility changes passed.');
}

async function checkMotionPreferences(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('#motion-switcher');
  await page.waitForFunction(() => document.querySelector('#motion-switcher')?.disabled);
  assert.equal(await toggle.isDisabled(), true);
  assert.equal(await page.locator('.kinetic-word').first().evaluate((el) => getComputedStyle(el).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('#motion-switcher')?.disabled);
  assert.equal(await toggle.isEnabled(), true);
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
  assert.equal(await page.locator('.kinetic-word').first().evaluate((el) => getComputedStyle(el).animationName), 'none');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#motion-switcher')?.getAttribute('aria-pressed') === 'false');
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  await page.close();
  console.log('System and saved motion preferences passed.');
}

async function checkFullCampaign(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  await page.locator('#tg-manual').click();
  await page.locator('#tg-start').click();

  async function reveal(length) {
    await page.locator('#tg-next-cue').waitFor({ state: 'visible' });
    const sequence = [];
    for (let i = 0; i < length; i++) {
      await page.locator('#tg-next-cue').click();
      const lit = page.locator('.tg-cell.telegraph');
      sequence.push(String(landing(Number(await lit.getAttribute('data-idx')), await lit.getAttribute('data-shove'))));
    }
    await page.locator('#tg-next-cue').click();
    return sequence;
  }

  for (let wave = 1; wave <= 5; wave++) {
    let sequence = await reveal(wave + 2);
    if (wave === 1) {
      await page.locator('#tg-hint').click();
      const replay = await reveal(wave + 2);
      assert.deepEqual(replay, sequence, 'Hint should replay the same sequence');
      assert.equal(await page.locator('#tg-hint').isDisabled(), true);
      sequence = replay;
    }
    for (const index of sequence) await page.locator(`.tg-cell[data-idx="${index}"]`).click();
    if (wave < 5) assert.match(await page.locator('#tg-status').textContent(), new RegExp(`Wave ${wave} resolved`));
  }
  assert.match(await page.locator('#tg-status').textContent(), /All 5 waves cleared/);
  assert.equal(await page.locator('#tg-score').textContent(), '25');
  await page.close();
  console.log('Five-wave campaign and hint replay passed.');
}

async function checkKeyboardGame(browser) {
  const page = await browser.newPage({ viewport: { width: 640, height: 450 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  const activeId = () => page.evaluate(() => document.activeElement.id);
  async function tabUntil(id) {
    for (let i = 0; i < 30 && await activeId() !== id; i++) await page.keyboard.press('Tab');
    assert.equal(await activeId(), id, `Could not reach ${id} by keyboard`);
  }
  async function readCues(length, tryLocked = false) {
    await tabUntil('tg-next-cue');
    const sequence = [];
    for (let i = 1; i <= length; i++) {
      await page.keyboard.press('Enter');
      await page.waitForFunction((step) => document.querySelector('#tg-status')?.textContent?.includes(`Telegraph ${step} of`), i);
      const text = await page.locator('#tg-status').textContent();
      const match = text.match(/Row (\d), Col (\d)/);
      assert.ok(match, `Cue coordinates missing from live status: ${text}`);
      const shove = text.match(/shoved (up|down|left|right)/);
      sequence.push(landing((Number(match[1]) - 1) * 4 + Number(match[2]) - 1, shove?.[1]));
      if (tryLocked && i === 1) {
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.evaluate(() => document.activeElement.classList.contains('tg-cell')), true);
        await page.keyboard.press('Space');
        const locked = await page.locator('#tg-status').textContent();
        assert.ok(locked.includes(text.trim()) && locked.includes('Wait for the sequence to finish'));
        await tabUntil('tg-next-cue');
      }
    }
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.classList.contains('tg-cell'));
    return sequence;
  }
  async function selectCell(target) {
    const current = Number(await page.evaluate(() => document.activeElement.getAttribute('data-idx')));
    assert.ok(Number.isInteger(current), 'Grid cell did not retain keyboard focus');
    const down = (Math.floor(target / 4) - Math.floor(current / 4) + 4) % 4;
    const right = (target % 4 - current % 4 + 4) % 4;
    for (let i = 0; i < down; i++) await page.keyboard.press('ArrowDown');
    for (let i = 0; i < right; i++) await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-idx')), String(target));
    await page.keyboard.press('Space');
  }

  await page.locator('.tg-cell').first().focus();
  await page.keyboard.press('Space');
  assert.match(await page.locator('#tg-status').textContent(), /Start or restart a turn to play/);
  assert.equal(await page.locator('.tg-cell').first().evaluate((el) => el.classList.contains('unavailable')), true);
  await page.locator('#tg-manual').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await activeId(), 'tg-start');
  await page.keyboard.press('Enter');
  const first = await readCues(3, true);
  await selectCell(first[0]);
  await tabUntil('tg-hint');
  await page.keyboard.press('Enter');
  const replay = await readCues(3);
  assert.deepEqual(replay, first, 'Keyboard hint should replay the current sequence');
  for (const cell of replay) await selectCell(cell);
  assert.match(await page.locator('#tg-status').textContent(), /Wave 1 resolved/);
  await page.locator('#tg-next-cue').waitFor({ state: 'visible' });
  const second = await readCues(4);
  await selectCell((second[0] + 1) % 16);
  assert.match(await page.locator('#tg-status').textContent(), /Telegraph missed/);
  await tabUntil('tg-start');
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#tg-status').textContent(), /Show first cue/);
  await page.close();
  console.log('Keyboard cue reading, grid navigation, hint, mistake and retry passed.');
}

async function checkActionFeedback(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'no-preference' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  const panel = page.locator('[data-portal-id="tactics-shove"]');
  await panel.click();
  assert.equal(await panel.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#inspector-title').textContent(), 'Planning the next move');
  assert.equal(await page.getByRole('region', { name: 'Planning the next move' }).count(), 1);
  assert.ok(await panel.locator('.crt-click-ripple').count() > 0, 'An activated panel should show feedback');
  assert.equal(await page.locator('#tg-mute').getAttribute('aria-pressed'), 'false');
  await openPopup(page);
  const before = Number(await page.locator('#tg-interaction-count').textContent());
  await page.locator('#crt-next-stage').click();
  const after = Number(await page.locator('#tg-interaction-count').textContent());
  assert.equal(after - before, 2, 'A click and its stage change should each be recorded once');
  for (const stage of ['title-intro', 'welcome', 'animation-sequence']) {
    await page.locator(`[data-stage-target="${stage}"]`).click();
    assert.equal(await page.locator('[data-stage-scene]:visible').count(), 1);
    assert.equal(await page.locator(`[data-stage-scene="${stage}"]`).isVisible(), true);
    assert.equal(await page.locator(`[data-stage-target="${stage}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.keyboard.press('Escape');
  await page.locator('#motion-switcher').click();
  await page.locator('[data-portal-id="psychology"]').click();
  assert.equal(await page.locator('[data-portal-id="psychology"] .crt-click-ripple').count(), 0);
  await page.close();
  console.log('Portal feedback, stage changes, sound default and reduced-motion response passed.');
}

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map((n) => Number(n) / 255);
    const linear = rgb.map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * The lowest contrast each region's ink reaches on the ground in a screenshot (base64 PNG), read as
 * 8×8 block means so film grain averages out. `decoder` is any page with JavaScript on (the image
 * decodes there); a region is { x, y, w, h, ink } in CSS pixels with ink as #rrggbb or rgb().
 */
async function groundContrast(decoder, png, regions) {
  return decoder.evaluate(async ({ png, regions }) => {
    const img = await new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.src = `data:image/png;base64,${png}`; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const w = img.width, data = ctx.getImageData(0, 0, w, img.height).data;
    const lin = (v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    // color-mix() computes to `color(srgb r g b)` with channels in 0–1, rgb() to 0–255.
    const channels = (c) => {
      if (c.startsWith('#')) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
      const v = c.replace(/^color\(srgb/, '').match(/[\d.]+/g).slice(0, 3).map(Number);
      return c.startsWith('color(srgb') ? v.map((x) => x * 255) : v;
    };
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return regions.map((r) => {
      const li = lum(...channels(r.ink));
      let worst = Infinity;
      const x0 = Math.max(0, Math.round(r.x)), y0 = Math.max(0, Math.round(r.y));
      for (let by = y0; by + 8 <= Math.min(img.height, r.y + r.h); by += 8) for (let bx = x0; bx + 8 <= Math.min(w, r.x + r.w); bx += 8) {
        let R = 0, G = 0, B = 0;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const k = ((by + y) * w + bx + x) * 4; R += data[k]; G += data[k + 1]; B += data[k + 2]; }
        worst = Math.min(worst, ratio(li, lum(R / 64, G / 64, B / 64)));
      }
      return worst;
    });
  }, { png, regions });
}

async function checkThemeContrast(browser) {
  for (const theme of ['prism', 'paper', 'crt']) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
    await page.addInitScript((value) => localStorage.setItem('portfolio-theme', value), theme);
    await serveBuild(page);
    await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
    const buttonColors = await page.locator('#tg-open-popup').evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.color, style.backgroundColor];
    });
    assert.ok(contrastRatio(...buttonColors) >= 4.5, `Primary button contrast in ${theme}`);
    await page.goto('http://portfolio.test/projects/cinderhold/', { waitUntil: 'networkidle' });
    const linkColors = await page.locator('.side dd a').first().evaluate((el) => [
      getComputedStyle(el).color,
      getComputedStyle(el.closest('.box')).backgroundColor,
    ]);
    assert.ok(contrastRatio(...linkColors) >= 4.5, `Project sidebar link contrast in ${theme}`);
    await page.close();
  }
  console.log('Primary action and project-link contrast passed in all themes.');
}

/**
 * The signal field under the content column keeps text at 4.5:1 at night, dawn, day and dusk in every
 * theme (the map-lit themes change with the Poznań hour). The page's own layers are hidden, the still
 * frame (reduced motion) is screenshotted, and the lane is read as 8×8 block means so the film grain
 * averages out.
 */
async function checkFieldLane(browser) {
  // Poznań is UTC+1 on these dates.
  const hours = { night: '2026-11-04T01:00:00Z', dawn: '2026-11-04T05:30:00Z', day: '2026-11-04T11:00:00Z', dusk: '2026-11-04T18:48:00Z' };
  const low = [];
  for (const theme of ['prism', 'paper', 'crt', 'signal']) {
    for (const [name, iso] of Object.entries(hours)) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      await context.clock.setFixedTime(new Date(iso));
      await context.addInitScript((value) => {
        localStorage.setItem('portfolio-theme', value);
        // The Signal theme needs the reward record.
        if (value === 'signal') localStorage.setItem('portfolio-signal', JSON.stringify({ best: 9, clears: 1, since: '' }));
      }, theme);
      const page = await context.newPage();
      await serveBuild(page);
      await page.goto(HOME, { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('has-field'), null, { timeout: 30000 });
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme, `The ${theme} theme did not apply`);
      await page.waitForTimeout(800);
      const inks = await page.evaluate(() => ['--text', '--text-2', '--text-3'].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()));
      await page.addStyleTag({ content: 'body > *:not(.signal-field) { opacity: 0 !important; } body { background: transparent !important; }' });
      await page.waitForTimeout(150);
      const png = (await page.screenshot()).toString('base64');
      const width = 1440, height = 900;
      const lane = { x: width / 2 - 520, y: 0, w: 1040, h: height };
      const worst = Math.min(...(await groundContrast(page, png, inks.map((ink) => ({ ...lane, ink })))));
      if (worst < 4.5) low.push(`${theme} at ${name}: ${worst.toFixed(2)}:1`);
      await context.close();
    }
  }
  assert.deepEqual(low, [], 'Text over the field lane falls under 4.5:1');
  console.log('Field lane contrast passed at night, dawn, day and dusk in all themes.');
}

async function checkThemePreferences(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, colorScheme: 'light' });
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  assert.equal(await page.locator('#theme-label').textContent(), 'Paper');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.querySelector('#theme-label')?.textContent === 'Prism');
  await page.locator('#theme-switcher').click();
  assert.equal(await page.locator('#theme-label').textContent(), 'Paper');
  await page.emulateMedia({ colorScheme: 'light' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'paper');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#theme-label').textContent(), 'Paper');
  await page.close();
  console.log('System and saved theme preferences passed.');
}

async function checkTouchInput(browser) {
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serveBuild(page);
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await readyLab(page);
  for (const selector of ['.menu-toggle', '#theme-switcher', '.nav-actions .cv']) {
    const bounds = await page.locator(selector).boundingBox();
    assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, `Touch target too small: ${selector}`);
  }
  await page.locator('.menu-toggle').tap();
  assert.equal(await page.locator('#nav-links a').first().isVisible(), true);
  await page.locator('.menu-toggle').tap();
  await page.locator('[data-portal-id="tactics-shove"]').tap();
  assert.equal(await page.locator('[data-portal-id="tactics-shove"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#tg-open-popup').tap();
  for (const selector of ['.crt-stage-tab', '#tg-close-popup', '#crt-next-stage']) {
    for (const target of await page.locator(selector).all()) {
      const bounds = await target.boundingBox();
      assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, `Touch target too small: ${selector}`);
    }
  }
  await page.locator('#crt-next-stage').tap();
  assert.equal(await page.locator('[data-stage-scene="animation-sequence"]').isVisible(), true);
  await page.locator('#tg-close-popup').tap();
  await page.locator('#tg-manual').tap();
  await page.locator('#tg-start').tap();
  const cellBounds = await page.locator('.tg-cell').first().boundingBox();
  assert.ok(cellBounds && cellBounds.width >= 44 && cellBounds.height >= 44, 'Game cells are too small for touch');
  const sequence = [];
  for (let i = 0; i < 3; i++) {
    await page.locator('#tg-next-cue').tap();
    sequence.push(await page.locator('.tg-cell.telegraph').getAttribute('data-idx'));
  }
  await page.locator('#tg-next-cue').tap();
  for (const index of sequence) await page.locator(`.tg-cell[data-idx="${index}"]`).tap();
  assert.match(await page.locator('#tg-status').textContent(), /Wave 1 resolved/);
  assert.deepEqual(errors, []);
  await page.close();
  console.log('Emulated touch navigation, modal and game controls passed.');
}

/** Waits for a condition in the page; SwiftShader frames hold timers back, so fixed sleeps flake here. */
const until = (page, fn, message) => page.waitForFunction(fn, null, { timeout: 10000 }).catch(() => assert.fail(message));
/** The camera has caught up with the explorer, so a screen point lands on the same tile every run. */
const settled = () => { const { cam, player } = window.__world.eng.S; return !cam.intro && Math.hypot(cam.focus.x - cam.pan.x - player.x, cam.focus.z - cam.pan.y - player.z) < 0.05; };

/** The field map: Explore boots the engine, the explorer walks, panels and the Lab open, Dev Mode runs, a project can be added. */
async function checkWorld(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serveBuild(page);
  await page.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#world-start h1').textContent().then((t) => t.replace(/\s+/g, ' ').trim()), 'Junior Gameplay Programmer (Unity / C#)');
  assert.equal(await page.locator('#world-start a[href="/overview/"]').isVisible(), true, 'The overview link is not on the start screen');
  await page.locator('#world-enter-quiet').click();
  await page.waitForFunction(() => Boolean(window.__world), null, { timeout: 60000 });
  await page.waitForFunction(() => !window.__world.eng.S.cam.intro, null, { timeout: 10000 });
  await page.waitForTimeout(1500);
  const locs = await page.evaluate(() => window.__world.eng.S.locs.map((l) => l.id));
  assert.deepEqual(locs.filter((id) => !['station', 'lab', 'guild', 'mast', 'uncharted'].includes(id)), ['horde-hours', 'push-comes-to-shove', 'cinderhold', 'eternity-keeper']);
  assert.equal(await page.locator('.world-label').count(), locs.length, 'One label per location');
  // Walk to Cinderhold by BFS and open its panel.
  await page.evaluate(() => { const w = window.__world; w.eng.goTo(w.eng.locOf('cinderhold')); w.eng.stepFrames(600, 1 / 30); });
  assert.equal(await page.evaluate(() => window.__world.eng.S.near?.id), 'cinderhold', 'The explorer did not arrive');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#world-drawer-title').textContent(), 'Cinderhold');
  assert.equal(await page.locator('#world-drawer a[href="/projects/cinderhold/"]').isVisible(), true, 'The panel does not link to the write-up');
  await page.keyboard.press('Escape');
  await until(page, () => document.getElementById('world-drawer').hidden, 'Escape did not close the panel');
  // Dev Mode: render passes, overlays and a test project that moves nothing.
  await page.keyboard.press('Backquote');
  await page.keyboard.press('2');
  assert.equal(await page.evaluate(() => window.__world.eng.S.view), 'wireframe');
  await page.keyboard.press('1');
  const before = await page.evaluate(() => window.__world.eng.S.locs.map((l) => `${l.id}@${l.x},${l.z}`));
  await page.locator('#world-add').click();
  const after = await page.evaluate(() => window.__world.eng.S.locs.map((l) => `${l.id}@${l.x},${l.z}`));
  for (const entry of before) if (!entry.startsWith('uncharted@')) assert.ok(after.includes(entry), `${entry} moved when a project was added`);
  assert.equal(after.length, before.length + 1);
  await page.locator('#world-remove').click();
  await page.keyboard.press('Backquote');
  // The Lab: the real Telegraph cabinet and the letters.
  await page.evaluate(() => window.__world.openLab());
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#world-lab #tg-open-popup').isVisible(), true, 'The Telegraph cabinet is not in the Lab');
  await page.locator('[data-lab-tab="mess"]').click();
  await page.waitForTimeout(800);
  assert.ok((await page.evaluate(() => window.__world.letters()?.state().length)) >= 8, 'The letters did not start');
  await page.locator('#world-lab-close').click();
  assert.equal(await page.locator('#world-lab').getAttribute('hidden'), '');
  // A panel and the Lab never stack, and the map's hash writes keep the router's history entry.
  const routerState = await page.evaluate(() => JSON.stringify(history.state));
  await page.evaluate(() => { const w = window.__world; w.openLoc(w.eng.locOf('cinderhold')); });
  assert.equal(await page.evaluate(() => location.hash), '#cinderhold');
  await page.evaluate(() => window.__world.openLab());
  await until(page, () => document.getElementById('world-drawer').hidden, 'The panel stayed open under the Lab');
  await page.locator('#world-lab-close').click();
  assert.equal(await page.evaluate(() => location.hash), '');
  assert.equal(await page.evaluate(() => JSON.stringify(history.state)), routerState, 'A hash write dropped the router state');
  // Leaving the map for another page starts the signal field there (the map is a visit's first page here).
  await page.locator('.world-keys a[href="/overview/"]').click();
  await page.waitForURL('**/overview/');
  await page.waitForFunction(() => document.getElementById('signal-field')?.width === Math.max(1, Math.round(innerWidth * 0.5)), null, { timeout: 10000 });
  assert.deepEqual(errors, []);
  await page.close();
  // A stage deep link opens the Lab with the Telegraph popup on that stage, and the Lab keeps the stage in the hash.
  const deep = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await serveBuild(deep);
  await deep.goto('http://portfolio.test/#lab?stage=welcome', { waitUntil: 'domcontentloaded' });
  await deep.waitForFunction(() => Boolean(window.__world) && !document.getElementById('world-lab').hidden, null, { timeout: 60000 });
  await deep.waitForSelector('#tg-crt-popup[open]', { state: 'attached', timeout: 30000 });
  assert.equal(await deep.evaluate(() => location.hash), '#lab?stage=welcome', 'The Lab dropped the stage from the hash');
  await deep.keyboard.press('Escape');
  await until(deep, () => !document.querySelector('#tg-crt-popup[open]'), 'Escape did not close the popup');
  assert.equal(await deep.locator('#world-lab').getAttribute('hidden'), null, 'Escape on the popup also closed the Lab');
  await deep.close();
  // Phone: no horizontal overflow, tap to walk.
  const phone = await browser.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await serveBuild(phone);
  await phone.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'The start screen overflows on a phone');
  await phone.locator('#world-enter-quiet').click();
  await phone.waitForFunction(() => Boolean(window.__world) && !window.__world.eng.S.cam.intro, null, { timeout: 60000 });
  await until(phone, settled, 'The camera did not settle on the explorer');
  await phone.touchscreen.tap(200, 300);
  await until(phone, () => window.__world.eng.S.player.path.length > 0 || window.__world.eng.S.player.moving, 'A tap did not start a walk');
  await phone.close();
  console.log('Field map: boot, walk, panel, Dev Mode, test project, Lab and phone tap passed.');
}

/**
 * The HUD nav on every page: the Map link points at the page's place (a write-up, the overview section
 * in view), Projects is current under /projects/, the nav element survives view transitions, the keys
 * share the map's size and the footer's status line reads the clock and the field log.
 */
async function checkNav(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.addInitScript(() => localStorage.setItem('portfolio-world-visited', JSON.stringify(['lab', 'not-a-place'])));
  const nav = () => page.evaluate(() => {
    const link = (label) => [...document.querySelectorAll('#nav-links a')].find((a) => a.textContent.trim() === label);
    return {
      map: link('Map').getAttribute('href'),
      projects: link('Projects').getAttribute('aria-current'),
      lab: link('Lab').getAttribute('aria-current'),
      mapCurrent: link('Map').getAttribute('aria-current'),
      tag: document.querySelector('nav.nav').__tag ?? null,
    };
  });

  await page.goto('http://portfolio.test/projects/push-comes-to-shove/', { waitUntil: 'networkidle' });
  let n = await nav();
  assert.equal(n.map, '/#push-comes-to-shove', "A write-up's Map link does not open its place");
  assert.equal(n.projects, 'location', 'Projects is not current on a write-up');
  const bar = await page.evaluate(() => ({
    line: document.querySelector('.locbar .eyebrow')?.textContent,
    links: [...document.querySelectorAll('.locbar-links a')].map((a) => a.getAttribute('href')),
  }));
  assert.match(bar.line ?? '', /^Location \d\d · /, 'The location bar does not name the place');
  assert.deepEqual(bar.links, ['/#push-comes-to-shove', '/projects/'], 'The location bar does not lead back to the place');
  // The write-up is the drawer panel grown: the project's accent on <main>, the metrics as map labels,
  // HUD panels instead of umber cards, a diamond per note with the first one read.
  const dossier = await page.evaluate(() => ({
    acc: getComputedStyle(document.querySelector('main')).getPropertyValue('--acc').trim(),
    tags: document.querySelectorAll('.phero .stat-tag.tag').length,
    side: document.querySelector('.side .box')?.classList.contains('hud-panel'),
    dots: [...document.querySelectorAll('[data-note-dot]')].map((d) => d.classList.contains('is-done')),
    count: document.querySelector('[data-notes-progress]')?.textContent,
  }));
  assert.match(dossier.acc, /^#[0-9a-f]{6}$/i, 'The write-up does not carry its location accent');
  assert.ok(dossier.tags > 0 && dossier.side, 'The write-up hero or sidebar is not in the map chrome');
  assert.ok(dossier.dots.length > 1 && dossier.dots[0] && dossier.count === String(dossier.dots.filter(Boolean).length),
    `The notes' field-log marks are off: ${JSON.stringify(dossier)}`);
  const status = (await page.locator('[data-status-line]').textContent()).replace(/\s*·\s*/g, ' · ').replace(/\s+/g, ' ').trim();
  assert.match(status, /^Poznań \d\d:\d\d · \S.* · 1\/\d+ explored · Style guide$/, `Status line reads "${status}"`);
  const ground = await page.evaluate(() => {
    const css = getComputedStyle(document.querySelector('nav.nav'));
    const key = getComputedStyle(document.querySelector('#theme-switcher'));
    return { border: css.borderBottomWidth, bg: css.backgroundColor, panel: getComputedStyle(document.documentElement).getPropertyValue('--panel').trim(), font: key.fontSize };
  });
  assert.equal(ground.border, '1px', 'The nav still has the thick rule');
  assert.equal(ground.font, '11.5px', 'The nav keys are not the HUD key size');

  // A client-side move keeps the same nav element and updates the Map link.
  await page.evaluate(() => { document.querySelector('nav.nav').__tag = 'kept'; });
  await page.locator('#nav-links a', { hasText: 'Projects' }).click();
  await page.waitForURL('**/projects/');
  await page.waitForFunction(() => document.querySelector('[data-nav-map]').getAttribute('href') === '/');
  n = await nav();
  assert.equal(n.tag, 'kept', 'The nav was re-created by the page move');
  assert.equal(n.projects, 'page', 'Projects is not current on the projects index');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.locbar-links a')].map((a) => a.getAttribute('href'))), ['/'],
    'The projects index bar should lead to the map only');

  // On the overview the Map link follows the section in view.
  await page.goto('http://portfolio.test/overview/', { waitUntil: 'networkidle' });
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('lab').scrollIntoView({ block: 'start' }));
  await page.waitForFunction(() => document.querySelector('[data-nav-map]').getAttribute('href') === '/#lab', null, { timeout: 5000 });
  n = await nav();
  assert.equal(n.lab, 'location', 'The Lab link is not current over the Lab section');

  // On the map the keys are the same size and Map is the current page.
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
  n = await nav();
  assert.equal(n.mapCurrent, 'page', 'Map is not current on the map');
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.world-key, .nav .util-btn')].map((k) => getComputedStyle(k).fontSize));
  assert.ok(sizes.length > 2 && sizes.every((x) => x === '11.5px'), `Map and nav keys differ: ${sizes.join(', ')}`);
  await page.close();
  console.log('HUD nav: Map link per page and section, Projects current, persisted, status line read.');
}

/** three.js loads only on the map: no script a text page fetches contains the renderer. */
async function checkBundle(browser) {
  const marker = 'WebGLRenderer';
  const chunks = fs.readdirSync(path.join(dist, '_astro')).filter((x) => x.endsWith('.js'));
  const threeChunks = chunks.filter((x) => fs.readFileSync(path.join(dist, '_astro', x), 'utf8').includes(marker));
  assert.ok(threeChunks.length > 0, 'No built chunk contains three.js: the bundle check would pass vacuously');
  for (const route of routes.filter((r) => r !== '/')) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await serveBuild(page);
    const loaded = [];
    page.on('response', (r) => { if (r.url().endsWith('.js')) loaded.push(path.basename(new URL(r.url()).pathname)); });
    await page.goto(`http://portfolio.test${route}`, { waitUntil: 'networkidle' });
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1200);
    const bad = loaded.filter((x) => threeChunks.includes(x));
    assert.deepEqual(bad, [], `${route} loads three.js (${bad.join(', ')})`);
    await page.close();
  }
  console.log(`Bundle: three.js (${threeChunks.join(', ')}) stays off ${routes.length - 1} text pages.`);
}

(async () => {
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build first.');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}),
  });
  try {
    const checks = {
      layouts: checkLayouts, nojs: checkNoJavaScript, anchors: checkAnchorNavigation,
      game: checkGame, campaign: checkFullCampaign, keyboard: checkKeyboardGame,
      motion: checkMotionPreferences, feedback: checkActionFeedback,
      contrast: checkThemeContrast, theme: checkThemePreferences, touch: checkTouchInput,
      world: checkWorld, field: checkFieldLane, nav: checkNav, bundle: checkBundle,
    };
    const selected = process.env.PORTFOLIO_BROWSER_CHECK;
    if (selected) {
      assert.ok(checks[selected], `Unknown browser check: ${selected}`);
      await checks[selected](browser);
    } else {
      for (const check of Object.values(checks)) await check(browser);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
