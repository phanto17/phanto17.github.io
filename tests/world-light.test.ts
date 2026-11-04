import { describe, expect, it } from 'vitest';
import { DAYLIGHT_KEYS, PATH_TILE, fieldPalette, fmtHour, keysAround, phaseName, poznanHour, rgbToHex } from '../src/world/daylight';
import * as light from '../src/world/light';

describe('time of day', () => {
  it('formats hours as HH:MM', () => {
    expect(fmtHour(0)).toBe('00:00');
    expect(fmtHour(13.5)).toBe('13:30');
    expect(fmtHour(23.999)).toBe('23:59');
  });
  it('names the phases', () => {
    expect(phaseName(3)).toBe('Night');
    expect(phaseName(6.5)).toBe('Dawn');
    expect(phaseName(12)).toBe('Day');
    expect(phaseName(18)).toBe('Golden hour');
    expect(phaseName(20)).toBe('Dusk');
    expect(phaseName(22)).toBe('Night');
  });
  it('reads Poznań time, not UTC', () => {
    // 2026-07-01 10:00 UTC is 12:00 in Poznań (CEST).
    expect(poznanHour(new Date('2026-07-01T10:00:00Z'))).toBeCloseTo(12, 5);
    expect(poznanHour(new Date('2026-01-01T23:30:00Z'))).toBeCloseTo(0.5, 5);
  });
  it('light.ts re-exports the same clock', () => {
    expect(light.poznanHour).toBe(poznanHour);
    expect(light.phaseName).toBe(phaseName);
  });
});

describe('the daylight table', () => {
  it('runs from 0 to 24 in order', () => {
    const hours = DAYLIGHT_KEYS.map((k) => k.h);
    expect(hours[0]).toBe(0);
    expect(hours.at(-1)).toBe(24);
    expect([...hours].sort((a, b) => a - b)).toEqual(hours);
  });
  it('finds the keys around an hour, wrapping past midnight', () => {
    expect(keysAround(12)).toEqual({ a: 3, b: 4, t: (12 - 9) / (15.5 - 9) });
    expect(keysAround(-1)).toEqual(keysAround(23));
    expect(keysAround(25)).toEqual(keysAround(1));
  });
  it('the map lighting samples the same table', () => {
    const s = light.sample(12);
    expect('#' + s.fog.getHexString()).toBe(DAYLIGHT_KEYS[3].fog);
    expect(s.night).toBe(0);
  });
});

describe('the field palette', () => {
  it('is the sun, the lit path, the ground, the water and the fog', () => {
    const [sun, path, gnd, water, fog] = fieldPalette(12).map(rgbToHex);
    const noon = DAYLIGHT_KEYS[3];
    expect([sun, gnd, water, fog]).toEqual([noon.sun, noon.gnd, noon.water, noon.fog]);
    expect(path).toBe('#a88959'); // the path tile in noon sunlight
  });
  it('dims the path at night', () => {
    const night = fieldPalette(2)[1], day = fieldPalette(12)[1];
    expect(Math.max(...night)).toBeLessThan(Math.max(...day));
    expect(PATH_TILE).toBe('#a8926a');
  });
  it('moves between keys smoothly', () => {
    const a = fieldPalette(7.75), b = fieldPalette(7.76);
    for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) expect(Math.abs(a[i][k] - b[i][k])).toBeLessThan(0.01);
  });
});
