/**
 * How a location's accent is drawn in each theme, as numbers: the same mixes the field kit does in
 * CSS (field-kit.css `--acc-ui`, `.eyebrow`, `.tag`), so the style guide and tests/accents.test.ts can
 * check every accent's contrast without a browser. Pure; reads only the token file it is handed.
 *
 *   toned   = accent · tone + text · (1 − tone)         (--acc-ui; tone = acc-tone)
 *   eyebrow = toned · ink + text · (1 − ink)            (.eyebrow; ink = acc-ink)
 *   edge    = toned at edge opacity, over bg            (.tag border; edge = acc-edge)
 *
 * Mixing is in gamma-encoded sRGB, as CSS `color-mix(in srgb, …)` does.
 */
export type Rgba = [number, number, number, number];

/** A hex (#rrggbb) or rgb()/rgba() colour as 0–255 channels plus alpha; anything else is black. */
export function parseColour(c: string): Rgba {
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as Rgba;
  const rgba = c.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map((s) => s.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  return [0, 0, 0, 1];
}

const toHex = (c: Rgba): string => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** `a` at share `p` (0–1), the rest `b`, channel by channel; the result is opaque. */
export const mix = (a: Rgba, b: Rgba, p: number): Rgba => [0, 1, 2].map((k) => a[k] * p + b[k] * (1 - p)).concat(1) as Rgba;

const luminance = (c: Rgba): number => {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

/** WCAG 2 contrast, one decimal; a translucent ink is composited over the ground first. */
export function contrast(ink: string, ground: string): number {
  const g = parseColour(ground);
  const i = parseColour(ink);
  const over = mix(i, g, i[3]);
  const [l1, l2] = [luminance(over), luminance(g)];
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10;
}

/** The part of the token file this module reads. */
export interface AccentTokens {
  color: { themes: { id: string }[]; tokens: { name: string; value: string | Record<string, string> }[] };
  accent: { tokens: { name: string; value: string | Record<string, string> }[] };
}

/** One theme's grounds and accent rules, read from the token file. */
export interface AccentTheme {
  bg: string;
  text: string;
  tone: number;
  edge: number;
  ink: number;
}

export function accentTheme(tokens: AccentTokens, theme: string): AccentTheme {
  const first = tokens.color.themes[0].id;
  const pick = (list: AccentTokens['accent']['tokens'], name: string): string => {
    const t = list.find((x) => x.name === name);
    if (!t) throw new Error(`token ${name} is missing`);
    return typeof t.value === 'string' ? t.value : (t.value[theme] ?? t.value[first]);
  };
  const share = (name: string) => parseFloat(pick(tokens.accent.tokens, name)) / 100;
  return { bg: pick(tokens.color.tokens, 'bg'), text: pick(tokens.color.tokens, 'text'), tone: share('acc-tone'), edge: share('acc-edge'), ink: share('acc-ink') };
}

/** The inks the field kit draws from one accent in one theme, as opaque hex over bg. */
export function accentInks(accent: string, t: AccentTheme): { toned: string; eyebrow: string; edge: string } {
  const text = parseColour(t.text);
  const toned = mix(parseColour(accent), text, t.tone);
  return {
    toned: toHex(toned),
    eyebrow: toHex(mix(toned, text, t.ink)),
    edge: toHex(mix(toned, parseColour(t.bg), t.edge)),
  };
}

/** Fallback neutral sage accent for uncharted / empty slots. */
export const UNCHARTED_ACCENT = '#8fb5a6';

/** Eyebrow text needs 4.5:1 on bg (body-size text), a tag's border 3:1 (WCAG 1.4.11). */
export const ACCENT_MINIMUM = { eyebrow: 4.5, edge: 3 } as const;

export function accentContrast(accent: string, t: AccentTheme): { eyebrow: number; edge: number } {
  const inks = accentInks(accent, t);
  return { eyebrow: contrast(inks.eyebrow, t.bg), edge: contrast(inks.edge, t.bg) };
}
