import { describe, expect, it } from 'vitest';
import {
  LANDING_DELAY_MS,
  LEGACY_BEST_KEY,
  REWARD_KEY,
  availableThemes,
  isThemeId,
  nextTheme,
  parseReward,
  readReward,
  recordClear,
  saveReward,
  shouldShowLanding,
  stampLabel,
  type StorageLike,
} from '../src/scripts/signal-reward';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('reward record', () => {
  it('is null with nothing stored', () => {
    expect(parseReward(null)).toBeNull();
    expect(parseReward('', null)).toBeNull();
    expect(readReward(null)).toBeNull();
  });

  it('parses a stored record and repairs odd values', () => {
    expect(parseReward(JSON.stringify({ best: 1200, clears: 3, since: '2026-11-01T10:00:00.000Z' }))).toEqual({
      best: 1200,
      clears: 3,
      since: '2026-11-01T10:00:00.000Z',
    });
    expect(parseReward(JSON.stringify({ best: '950.7', clears: 0 }))).toEqual({ best: 950, clears: 1, since: '' });
    expect(parseReward(JSON.stringify({ best: 0, clears: 5 }))).toBeNull();
    expect(parseReward('{not json')).toBeNull();
    expect(parseReward(JSON.stringify(null))).toBeNull();
  });

  it('treats the mini-game best score as a clear, and keeps the higher score', () => {
    expect(parseReward(null, '800')).toEqual({ best: 800, clears: 1, since: '' });
    expect(parseReward(JSON.stringify({ best: 600, clears: 2, since: 'x' }), '800')).toEqual({ best: 800, clears: 2, since: 'x' });
    expect(parseReward(JSON.stringify({ best: 900, clears: 2, since: 'x' }), '800')).toEqual({ best: 900, clears: 2, since: 'x' });
    expect(parseReward(null, '0')).toBeNull();
    expect(parseReward(null, 'nope')).toBeNull();
  });

  it('records the first clear with the date, then counts clears and keeps the best', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');
    const first = recordClear(null, 1000, now);
    expect(first).toEqual({ best: 1000, clears: 1, since: '2026-11-01T12:00:00.000Z' });
    const later = new Date('2026-11-02T12:00:00.000Z');
    expect(recordClear(first, 700, later)).toEqual({ best: 1000, clears: 2, since: '2026-11-01T12:00:00.000Z' });
    expect(recordClear(first, 1300, later)).toEqual({ best: 1300, clears: 2, since: '2026-11-01T12:00:00.000Z' });
  });

  it('round-trips through storage and survives a throwing storage', () => {
    const storage = memoryStorage({ [LEGACY_BEST_KEY]: '400' });
    expect(readReward(storage)).toEqual({ best: 400, clears: 1, since: '' });
    const reward = recordClear(readReward(storage), 1100, new Date('2026-11-01T00:00:00.000Z'));
    expect(saveReward(storage, reward)).toBe(true);
    expect(JSON.parse(storage.data[REWARD_KEY])).toEqual(reward);
    expect(readReward(storage)).toEqual(reward);

    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readReward(broken)).toBeNull();
    expect(saveReward(broken, reward)).toBe(false);
    expect(saveReward(null, reward)).toBe(false);
  });

  it('labels the stamp with the best score', () => {
    expect(stampLabel({ best: 1200, clears: 1, since: '' })).toBe('SIGNAL CLEARED · 1200');
  });
});

describe('theme cycle', () => {
  it('cycles the three public themes while locked', () => {
    expect(availableThemes(false)).toEqual(['prism', 'paper', 'crt']);
    expect(nextTheme('prism', false)).toBe('paper');
    expect(nextTheme('paper', false)).toBe('crt');
    expect(nextTheme('crt', false)).toBe('prism');
  });

  it('adds Signal after CRT once unlocked', () => {
    expect(availableThemes(true)).toEqual(['prism', 'paper', 'crt', 'signal']);
    expect(nextTheme('crt', true)).toBe('signal');
    expect(nextTheme('signal', true)).toBe('prism');
  });

  it('leaves a locked Signal theme for the first theme', () => {
    expect(nextTheme('signal', false)).toBe('prism');
  });

  it('accepts Signal as a theme id only when unlocked', () => {
    expect(isThemeId('prism', false)).toBe(true);
    expect(isThemeId('signal', false)).toBe(false);
    expect(isThemeId('signal', true)).toBe(true);
    expect(isThemeId('neon', true)).toBe(false);
    expect(isThemeId(null, true)).toBe(false);
  });
});

describe('landing panel', () => {
  const base = { seen: false, reducedMotion: false, hash: '', pathname: '/', firstLoad: true };

  it('waits four seconds', () => {
    expect(LANDING_DELAY_MS).toBe(4000);
  });

  it('shows on a first, idle, motion-allowed visit to the home page', () => {
    expect(shouldShowLanding(base)).toBe(true);
    expect(shouldShowLanding({ ...base, pathname: '/index.html' })).toBe(true);
    expect(shouldShowLanding({ ...base, hash: '#' })).toBe(true);
  });

  it('never shows again once seen', () => {
    expect(shouldShowLanding({ ...base, seen: true })).toBe(false);
  });

  it('never shows under reduced motion', () => {
    expect(shouldShowLanding({ ...base, reducedMotion: true })).toBe(false);
  });

  it('never shows on a deep link or a project page', () => {
    expect(shouldShowLanding({ ...base, hash: '#lab' })).toBe(false);
    expect(shouldShowLanding({ ...base, hash: '#lab?stage=welcome' })).toBe(false);
    expect(shouldShowLanding({ ...base, hash: '#projects' })).toBe(false);
    expect(shouldShowLanding({ ...base, pathname: '/projects/cinderhold/' })).toBe(false);
  });

  it('only arms on the document the visitor arrived on', () => {
    expect(shouldShowLanding({ ...base, firstLoad: false })).toBe(false);
  });
});
