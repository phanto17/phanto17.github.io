/**
 * Text contrast over the signal field's content lane, as numbers (tests/field-lane.test.ts and the
 * token notes). In the lane the shader draws `mix(bg, ramp(t), lane)`, and `ramp(t)` is always a
 * blend of its five stops, so the worst ground under text is bounded by the stops themselves:
 *
 *   lightest: the stop whose mix with bg is lightest (luminance is convex in each channel, so the
 *             lightest blend of the stops is one of the stops),
 *   darkest:  every channel at its lowest across the stops (a floor no blend can go under).
 *
 * The film grain (±2.75 % per pixel, zero mean) and the cursor bloom (zero inside the lane) are left
 * out, as in the `field-lane` token's own note. Pure; mixes in gamma-encoded sRGB like the shader.
 */
import { contrast, mix, parseColour, type Rgba } from './accents';

const hex = (c: Rgba): string => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lum = (c: Rgba): number => {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

/** The lightest and darkest grounds the lane can show for these stops (hex), bg and lane share. */
export function laneGrounds(stops: readonly string[], bg: string, lane: number): { lightest: string; darkest: string } {
  const b = parseColour(bg);
  const mixed = stops.map((s) => mix(parseColour(s), b, lane));
  const lightest = mixed.reduce((x, y) => (lum(y) > lum(x) ? y : x));
  const darkest = [0, 1, 2].map((k) => Math.min(...mixed.map((m) => m[k]))).concat(1) as Rgba;
  return { lightest: hex(lightest), darkest: hex(darkest) };
}

/** The lowest contrast any of the inks reaches on either bound. */
export function laneContrast(stops: readonly string[], bg: string, lane: number, inks: readonly string[]): number {
  const { lightest, darkest } = laneGrounds(stops, bg, lane);
  return Math.min(...inks.flatMap((ink) => [contrast(ink, lightest), contrast(ink, darkest)]));
}
