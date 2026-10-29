// Browser regression checks against dist/. Install Playwright or set PLAYWRIGHT_MODULE
// to an existing Playwright package; set CHROME_BIN to use a system Chromium browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const dist = path.resolve(__dirname, '..', 'dist');
const routes = [
  '/', '/projects/', '/projects/horde-hours/', '/projects/push-comes-to-shove/',
  '/projects/cinderhold/', '/projects/eternity-keeper/', '/style-guide/', '/404.html',
];
const mimeTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.avif': 'image/avif', '.svg': 'image/svg+xml',
};

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
      await page.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
      if (width <= 980) {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('#nav-links a').first().isVisible(), true);
        const menu = await page.locator('#nav-links').boundingBox();
        assert.ok(menu && menu.y + menu.height <= height, `Menu extends below ${width}×${height}`);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#nav-links a').first().isVisible(), false);
      }
      await page.locator('#tg-open-popup').click();
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
    await page.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#nav-links a').first().isVisible(), true);
    assert.equal(await page.locator('#tg-open-popup').isVisible(), false);
    assert.equal(await page.locator('noscript p').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.close();
  }
  console.log('Script-free navigation and game fallback passed.');
}

async function checkAnchorNavigation(browser) {
  const page = await browser.newPage({ viewport: { width: 640, height: 450 }, reducedMotion: 'reduce' });
  await serveBuild(page);
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
  await page.locator('.menu-toggle').click();
  await page.locator('#nav-links a[href="/#projects"]').click();
  const heading = await page.locator('#projects h2').boundingBox();
  const navigation = await page.locator('nav.nav').boundingBox();
  assert.ok(heading && navigation && heading.y >= navigation.y + navigation.height,
    'The sticky navigation obscures the project heading');
  await page.close();
  console.log('Anchor navigation remains visible below the sticky header.');
}

async function checkGame(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serveBuild(page);
  await page.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
  await page.locator('#tg-open-popup').click();
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
  await page.goto('http://portfolio.test/', { waitUntil: 'domcontentloaded' });
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
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
  await page.locator('#tg-manual').click();
  await page.locator('#tg-start').click();

  async function reveal(length) {
    await page.locator('#tg-next-cue').waitFor({ state: 'visible' });
    const sequence = [];
    for (let i = 0; i < length; i++) {
      await page.locator('#tg-next-cue').click();
      sequence.push(await page.locator('.tg-cell.telegraph').getAttribute('data-idx'));
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
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
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
      sequence.push((Number(match[1]) - 1) * 4 + Number(match[2]) - 1);
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
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
  const panel = page.locator('[data-portal-id="tactics-shove"]');
  await panel.click();
  assert.equal(await panel.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#inspector-title').textContent(), 'Planning the next move');
  assert.equal(await page.getByRole('region', { name: 'Planning the next move' }).count(), 1);
  assert.ok(await panel.locator('.crt-click-ripple').count() > 0, 'An activated panel should show feedback');
  assert.equal(await page.locator('#tg-mute').getAttribute('aria-pressed'), 'false');
  await page.locator('#tg-open-popup').click();
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

async function checkThemeContrast(browser) {
  for (const theme of ['prism', 'paper', 'crt']) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
    await page.addInitScript((value) => localStorage.setItem('portfolio-theme', value), theme);
    await serveBuild(page);
    await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
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

async function checkThemePreferences(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, colorScheme: 'light' });
  await serveBuild(page);
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
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
  await page.goto('http://portfolio.test/', { waitUntil: 'networkidle' });
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

(async () => {
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build first.');
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}),
  });
  try {
    const checks = {
      layouts: checkLayouts, nojs: checkNoJavaScript, anchors: checkAnchorNavigation,
      game: checkGame, campaign: checkFullCampaign, keyboard: checkKeyboardGame,
      motion: checkMotionPreferences, feedback: checkActionFeedback,
      contrast: checkThemeContrast, theme: checkThemePreferences, touch: checkTouchInput,
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
