import { describe, expect, it } from 'vitest';
import { fmtHour, phaseName, poznanHour } from '../src/world/light';

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
});
