// Compiles design/tokens.json (the Prism CRT design system's token file) into src/styles/tokens.css.
//   node tools/build-tokens.mjs
// The design system artifact is the source of truth for the values; design/tokens.json is a copy of
// its project/tokens.json. Run this after updating the copy, then commit both files.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'));
const themes = tokens.color.themes;
const first = themes[0].id;
const scheme = { prism: 'dark', paper: 'light', crt: 'dark' };

const value = (t, theme) => (typeof t.value === 'string' ? t.value : (t.value[theme] ?? t.value[first]));
const colour = (v) => (/^\{[^}]+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);

function themeBlock(id) {
  let s = '';
  for (const t of tokens.color.tokens) s += `  --${t.name}: ${colour(value(t, id))};\n`;
  for (const t of tokens.shadow.tokens) s += `  --${t.name}: ${value(t, id)};\n`;
  s += `  color-scheme: ${scheme[id] ?? 'dark'};\n`;
  return s;
}

let out = `/* ${tokens.name} — generated from design/tokens.json by tools/build-tokens.mjs. Do not edit by hand. */\n\n`;
for (const th of themes) {
  out += th.id === first ? `:root,\nhtml[data-theme='${th.id}'] {\n` : `html[data-theme='${th.id}'] {\n`;
  out += themeBlock(th.id) + `}\n\n`;
}
// Paper follows the OS when nothing is stored (the site's Nav stores an explicit choice).
out += `@media (prefers-color-scheme: light) {\n  :root:not([data-theme='prism']):not([data-theme='crt']) {\n`;
out += themeBlock('paper').replace(/^/gm, '  ').replace(/\s+$/, '') + `\n  }\n}\n\n`;

out += `:root {\n`;
for (const fam of ['spacing', 'radius', 'opacity', 'zIndex', 'timing', 'easing', 'blur']) {
  if (!tokens[fam]) continue;
  for (const t of tokens[fam].tokens) out += `  --${t.name}: ${t.value};\n`;
}
for (const [key, stack] of Object.entries(tokens.type.families)) out += `  --font-${key}: ${stack};\n`;
out += `}\n`;

writeFileSync(join(root, 'src/styles/tokens.css'), out);
const count = themes.length * (tokens.color.tokens.length + tokens.shadow.tokens.length);
console.log(`src/styles/tokens.css: ${themes.length} themes, ${count} themed values, ${tokens.type.groups.reduce((n, g) => n + g.styles.length, 0)} type styles described in the token file`);
