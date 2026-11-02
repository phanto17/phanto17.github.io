// Compiles design/tokens.json (the Prism CRT design system's token file) into:
//   src/styles/tokens.css              the themed custom properties,
//   src/scripts/generated/themes.ts    the theme ids and each theme's page background,
//   src/scripts/generated/prefs-boot.js the inline head script that paints the saved preferences
//                                      before first paint (rows from src/scripts/prefs-table.ts).
//   node tools/build-tokens.mjs
// The design system artifact is the source of truth for the values; design/tokens.json is a copy of
// its project/tokens.json. Run this after updating the copy or the preference table, then commit the
// generated files: tests/prefs-boot.test.ts fails while they are stale.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_NOTE = 'generated from design/tokens.json by tools/build-tokens.mjs. Do not edit by hand.';

/** Which themes are light (`color-scheme`); the one light theme also follows the OS when nothing is saved. */
const scheme = { prism: 'dark', paper: 'light', crt: 'dark', signal: 'dark' };

export function renderTokensCss(tokens) {
  const themes = tokens.color.themes;
  const first = themes[0].id;
  const value = (t, theme) => (typeof t.value === 'string' ? t.value : (t.value[theme] ?? t.value[first]));
  const colour = (v) => (/^\{[^}]+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);

  function themeBlock(id) {
    let s = '';
    for (const t of tokens.color.tokens) s += `  --${t.name}: ${colour(value(t, id))};\n`;
    for (const t of tokens.shadow.tokens) s += `  --${t.name}: ${value(t, id)};\n`;
    s += `  color-scheme: ${scheme[id] ?? 'dark'};\n`;
    return s;
  }

  let out = `/* ${tokens.name} — ${GENERATED_NOTE} */\n\n`;
  for (const th of themes) {
    out += th.id === first ? `:root,\nhtml[data-theme='${th.id}'] {\n` : `html[data-theme='${th.id}'] {\n`;
    out += themeBlock(th.id) + `}\n\n`;
  }
  // Paper follows the OS when nothing is stored (the site's Nav stores an explicit choice).
  const notDark = themes.filter((th) => th.id !== 'paper').map((th) => `:not([data-theme='${th.id}'])`).join('');
  out += `@media (prefers-color-scheme: light) {\n  :root${notDark} {\n`;
  out += themeBlock('paper').replace(/^/gm, '  ').replace(/\s+$/, '') + `\n  }\n}\n\n`;

  out += `:root {\n`;
  for (const fam of ['spacing', 'radius', 'opacity', 'zIndex', 'timing', 'easing', 'blur']) {
    if (!tokens[fam]) continue;
    for (const t of tokens[fam].tokens) out += `  --${t.name}: ${t.value};\n`;
  }
  for (const [key, stack] of Object.entries(tokens.type.families)) out += `  --font-${key}: ${stack};\n`;
  out += `}\n`;
  return out;
}

/** Theme ids, the public cycle, the Signal theme, the light theme and each theme's `bg`. */
export function themeFacts(tokens, signalTheme) {
  const ids = tokens.color.themes.map((th) => th.id);
  const bgToken = tokens.color.tokens.find((t) => t.name === 'bg');
  const bg = Object.fromEntries(ids.map((id) => [id, typeof bgToken.value === 'string' ? bgToken.value : bgToken.value[id]]));
  const light = ids.find((id) => scheme[id] === 'light') ?? ids[0];
  return { ids, publicIds: ids.filter((id) => id !== signalTheme), signalTheme, light, bg };
}

export function renderThemesTs(facts) {
  const list = (ids) => `[${ids.map((id) => `'${id}'`).join(', ')}] as const`;
  return (
    `/* Prism CRT themes — ${GENERATED_NOTE} */\n\n` +
    `export const THEMES = ${list(facts.ids)};\n` +
    `export type ThemeId = (typeof THEMES)[number];\n` +
    `/** The themes the theme key cycles through before the Signal unlock. */\n` +
    `export const PUBLIC_THEMES: readonly ThemeId[] = ${list(facts.publicIds)};\n` +
    `/** The fourth theme, unlocked by clearing Telegraph Recall. */\n` +
    `export const SIGNAL_THEME = '${facts.signalTheme}' as const;\n` +
    `/** The light theme: in effect when nothing is saved and the OS prefers a light scheme. */\n` +
    `export const LIGHT_THEME = '${facts.light}' as const;\n` +
    `/** Each theme's page background (\`bg\`), for the browser chrome's theme-color. */\n` +
    `export const THEME_BG: Record<ThemeId, string> = {\n` +
    facts.ids.map((id) => `  ${id}: '${facts.bg[id]}',\n`).join('') +
    `};\n`
  );
}

/**
 * The inline head script. Plain ES5 so it runs before anything else: it reads each row's storage,
 * validates the value, paints the `<html>` attribute and classes, applies the Signal unlock and sets
 * the browser chrome's theme-color. `prefs.ts` takes over from here once the page scripts run.
 */
export function renderBoot(rows, facts, unlock) {
  const json = (v) => JSON.stringify(v);
  return `/* Prism CRT preference boot — ${GENERATED_NOTE} Rows: src/scripts/prefs-table.ts. */
(function () {
  var root = document.documentElement;
  var rows = ${json(rows)};
  var themeBg = ${json(facts.bg)};
  function stored(row) {
    try {
      return (row.tier === 'session' ? sessionStorage : localStorage).getItem(row.storageKey);
    } catch (e) {
      return null;
    }
  }
  // The Signal unlock: the same rule as parseReward in src/scripts/signal-reward.ts.
  function signalUnlocked() {
    try {
      var raw = localStorage.getItem(${json(unlock.rewardKey)});
      if (raw) {
        var reward = JSON.parse(raw);
        if (reward && Number(reward.best) > 0) return true;
      }
      return Number(localStorage.getItem(${json(unlock.legacyBestKey)})) > 0;
    } catch (e) {
      return false;
    }
  }
  var unlocked = signalUnlocked();
  if (unlocked) root.classList.add(${json(unlock.className)});
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var value = stored(row);
    if (value === null || row.values.indexOf(value) < 0) value = row.fallback;
    if (row.key === 'theme' && value === ${json(unlock.theme)} && !unlocked) value = row.fallback;
    var state = value === null ? null : row.states[value];
    var keep = state ? state.classes : [];
    for (var name in row.states) {
      var classes = row.states[name].classes;
      for (var c = 0; c < classes.length; c++) if (keep.indexOf(classes[c]) < 0) root.classList.remove(classes[c]);
    }
    for (var k = 0; k < keep.length; k++) root.classList.add(keep[k]);
    if (row.attr) {
      if (state && state.attr !== null) root.setAttribute(row.attr, state.attr);
      else root.removeAttribute(row.attr);
    }
  }
  var theme = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? ${json(facts.light)} : ${json(facts.ids[0])});
  var meta = document.getElementById('theme-color');
  if (meta) meta.setAttribute('content', themeBg[theme] || themeBg[${json(facts.ids[0])}]);
})();
`;
}

export const OUTPUTS = {
  css: 'src/styles/tokens.css',
  themes: 'src/scripts/generated/themes.ts',
  boot: 'src/scripts/generated/prefs-boot.js',
};

async function main() {
  const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'));
  // Node runs the TypeScript table directly (type stripping); it has no imports of its own.
  const table = await import(pathToFileURL(join(root, 'src/scripts/prefs-table.ts')).href);
  const facts = themeFacts(tokens, table.SIGNAL_UNLOCK.theme);
  const rows = table.prefRows(facts.ids);

  writeFileSync(join(root, OUTPUTS.css), renderTokensCss(tokens));
  mkdirSync(join(root, 'src/scripts/generated'), { recursive: true });
  writeFileSync(join(root, OUTPUTS.themes), renderThemesTs(facts));
  writeFileSync(join(root, OUTPUTS.boot), renderBoot(rows, facts, table.SIGNAL_UNLOCK));

  const themes = tokens.color.themes;
  const count = themes.length * (tokens.color.tokens.length + tokens.shadow.tokens.length);
  console.log(`${OUTPUTS.css}: ${themes.length} themes, ${count} themed values, ${tokens.type.groups.reduce((n, g) => n + g.styles.length, 0)} type styles described in the token file`);
  console.log(`${OUTPUTS.themes}: ${facts.ids.join(', ')} (light: ${facts.light}, unlock: ${facts.signalTheme})`);
  console.log(`${OUTPUTS.boot}: ${rows.length} preference rows`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
