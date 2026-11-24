/**
 * The time of day in Poznań and the map's light at each hour, without three.js, so the text pages
 * can read the same palette (the field behind them) without loading the 3D engine. `light.ts` wraps
 * the same key table in THREE colours for the map.
 */

export interface DaylightKey {
  /** Hour of the day, 0–24. */
  h: number;
  /** Sun (by day) or moon (by night) colour and intensity. */
  sun: string; si: number;
  /** Hemisphere light: sky colour, ground colour, intensity. */
  sky: string; gnd: string; hi: number;
  fog: string; water: string;
  /** 0 by day, 1 at night: lanterns, glows, fireflies. */
  night: number;
}

const NIGHT = { sun: '#b4cfc8', si: 1.5, sky: '#4f9a86', gnd: '#10261e', hi: 1.75, fog: '#082a22', water: '#0c3a33', night: 1 };
export const DAYLIGHT_KEYS: readonly DaylightKey[] = [
  { h: 0, ...NIGHT },
  { h: 5, ...NIGHT, sun: '#b0c8c8', sky: '#4c8f84', fog: '#0c2f2a', water: '#0f3d38' },
  { h: 6.5, sun: '#ff9d6c', si: 1.9, sky: '#8fb0ac', gnd: '#27332b', hi: 0.9, fog: '#59716c', water: '#2f5a5e', night: 0.35 },
  { h: 9, sun: '#fff0d6', si: 3.0, sky: '#c9ece2', gnd: '#46573f', hi: 1.15, fog: '#a9d4c7', water: '#2f8c84', night: 0 },
  { h: 15.5, sun: '#fff0d6', si: 3.0, sky: '#c9ece2', gnd: '#46573f', hi: 1.15, fog: '#a9d4c7', water: '#2f8c84', night: 0 },
  { h: 18, sun: '#ffb483', si: 2.2, sky: '#b4bdaa', gnd: '#35382c', hi: 1.15, fog: '#8d6d5e', water: '#4f6a70', night: 0.3 },
  { h: 19.6, sun: '#8c8fd6', si: 1.0, sky: '#4c5f86', gnd: '#0f1714', hi: 0.9, fog: '#1e2c3c', water: '#15293a', night: 0.8 },
  { h: 21.5, ...NIGHT },
  { h: 24, ...NIGHT },
];

export function poznanHour(d = new Date()): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const hh = Number(p.find((x) => x.type === 'hour')?.value ?? 0) % 24, mm = Number(p.find((x) => x.type === 'minute')?.value ?? 0);
  return hh + mm / 60;
}
export const fmtHour = (h: number): string => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
export const phaseName = (h: number): string => (h < 5 ? 'Night' : h < 7.5 ? 'Dawn' : h < 16.5 ? 'Day' : h < 19 ? 'Golden hour' : h < 20.5 ? 'Dusk' : 'Night');

/** The two keys around an hour and how far between them it is (0 at `a`, 1 at `b`). */
export function keysAround(hour: number): { a: number; b: number; t: number } {
  const h = ((hour % 24) + 24) % 24;
  let a = 0, b = 1;
  for (let i = 0; i < DAYLIGHT_KEYS.length - 1; i++) {
    if (h >= DAYLIGHT_KEYS[i].h && h <= DAYLIGHT_KEYS[i + 1].h) { a = i; b = i + 1; break; }
  }
  const ka = DAYLIGHT_KEYS[a], kb = DAYLIGHT_KEYS[b];
  return { a, b, t: (h - ka.h) / (kb.h - ka.h || 1) };
}

export type Rgb = [number, number, number];
const toRgb = (hex: string): Rgb => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255) as Rgb;
const lerp = (x: Rgb, y: Rgb, t: number): Rgb => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb;
export const rgbToHex = (c: Rgb): string =>
  '#' + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');

/** The map's path tile (`T.PATH` in engine.ts), the one warm surface seen from far away. */
export const PATH_TILE = '#a8926a';

/**
 * The map seen from far away at an hour, as the five stops of the field's colour ramp (sRGB 0–1), in
 * the ramp's order: bright (also the cursor bloom), warm, dark, dark, mid —
 * sun, the path in that sunlight (dimmed at night), the ground, the water, the fog.
 */
export function fieldPalette(hour: number): [Rgb, Rgb, Rgb, Rgb, Rgb] {
  const { a, b, t } = keysAround(hour);
  const ka = DAYLIGHT_KEYS[a], kb = DAYLIGHT_KEYS[b];
  const at = (k: 'sun' | 'gnd' | 'water' | 'fog') => lerp(toRgb(ka[k]), toRgb(kb[k]), t);
  const night = ka.night + (kb.night - ka.night) * t;
  const sun = at('sun'), path = toRgb(PATH_TILE);
  const litPath = path.map((v, i) => v * sun[i] * (1 - 0.55 * night)) as Rgb;
  return [sun, litPath, at('gnd'), at('water'), at('fog')];
}
