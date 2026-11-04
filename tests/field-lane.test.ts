/**
 * The signal field's content lane keeps page text readable in every theme: with the theme's own five
 * colours at `field-lane`, and with the map's palette at every quarter hour at `field-map-lane`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { laneContrast, laneGrounds } from '../src/lib/field-lane';
import { fieldPalette, rgbToHex } from '../src/world/daylight';

const tokens = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'));
const themes: string[] = tokens.color.themes.map((t: { id: string }) => t.id);
type Token = { name: string; value: string | Record<string, string> };
const find = (list: Token[], name: string, theme: string) => {
  const t = list.find((x) => x.name === name);
  if (!t) throw new Error(`no token ${name}`);
  return typeof t.value === 'string' ? t.value : t.value[theme];
};
const colour = (name: string, theme: string) => find(tokens.color.tokens, name, theme);
const field = (name: string, theme: string) => Number(find(tokens.field.tokens, name, theme));
const lane = Number(tokens.opacity.tokens.find((t: Token) => t.name === 'field-lane').value);
const INKS = ['text', 'text-2', 'text-3', 'steel', 'action-text'];
const QUARTERS = Array.from({ length: 96 }, (_, i) => i / 4);

describe('the lane bounds', () => {
  it('a single stop is both the lightest and the darkest ground', () => {
    expect(laneGrounds(['#ffffff'], '#000000', 0.2)).toEqual({ lightest: '#333333', darkest: '#333333' });
  });
  it('the darkest bound takes each channel at its lowest', () => {
    expect(laneGrounds(['#ff0000', '#00ff00'], '#000000', 1).darkest).toBe('#000000');
  });
});

describe.each(themes)('%s', (theme) => {
  const bg = colour('bg', theme);
  const inks = INKS.map((n) => colour(n, theme));

  it("its own field colours keep text at 4.5:1 (field-lane)", () => {
    const own = [1, 2, 3, 4, 5].map((i) => colour(`field-${i}`, theme));
    expect(laneContrast(own, bg, lane, inks)).toBeGreaterThanOrEqual(4.5);
  });

  it('the map palette keeps text at 4.5:1 at every quarter hour (field-map-lane)', () => {
    const mapLane = field('field-map-lane', theme);
    const low = QUARTERS.map((h) => ({ h, c: laneContrast(fieldPalette(h).map(rgbToHex), bg, mapLane, inks) })).filter((x) => x.c < 4.5);
    expect(low).toEqual([]);
  });

  it('field-map is a switch', () => {
    expect([0, 1]).toContain(field('field-map', theme));
  });
});
