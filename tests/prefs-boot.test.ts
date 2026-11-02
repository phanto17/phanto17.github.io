/**
 * The generated files (src/scripts/generated/*, src/styles/tokens.css) must match what the generator
 * renders from design/tokens.json and the preference table, and the inline boot must paint the same
 * first-paint state the prefs module derives, under the same unlock rule as parseReward.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OUTPUTS, renderBoot, renderThemesTs, renderTokensCss, themeFacts } from '../tools/build-tokens.mjs';
import { SIGNAL_UNLOCK, prefRows } from '../src/scripts/prefs-table';
import { LEGACY_BEST_KEY, REWARD_KEY, parseReward } from '../src/scripts/signal-reward';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = JSON.parse(read('design/tokens.json'));
const facts = themeFacts(tokens, SIGNAL_UNLOCK.theme);
const rows = prefRows(facts.ids);
const committedBoot = read(OUTPUTS.boot);

describe('generated files are current (run node tools/build-tokens.mjs)', () => {
  it('tokens.css', () => expect(read(OUTPUTS.css)).toBe(renderTokensCss(tokens)));
  it('themes.ts', () => expect(read(OUTPUTS.themes)).toBe(renderThemesTs(facts)));
  it('prefs-boot.js', () => expect(committedBoot).toBe(renderBoot(rows, facts, SIGNAL_UNLOCK)));
});

/** Run the boot source against fakes; returns the painted <html> and the theme-color meta. */
function boot(opts: { local?: Record<string, string> | 'blocked'; session?: Record<string, string>; light?: boolean } = {}) {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const meta = { content: '', setAttribute: (_n: string, v: string) => void (meta.content = v) };
  const storage = (data: Record<string, string> | 'blocked' | undefined) => ({
    getItem: (k: string) => {
      if (data === 'blocked') throw new DOMException('blocked', 'SecurityError');
      return data && k in data ? data[k] : null;
    },
  });
  const document = {
    documentElement: {
      getAttribute: (n: string) => attrs.get(n) ?? null,
      setAttribute: (n: string, v: string) => void attrs.set(n, v),
      removeAttribute: (n: string) => void attrs.delete(n),
      classList: { add: (c: string) => void classes.add(c), remove: (c: string) => void classes.delete(c) },
    },
    getElementById: (id: string) => (id === 'theme-color' ? meta : null),
  };
  new Function('document', 'localStorage', 'sessionStorage', 'matchMedia', committedBoot)(
    document,
    storage(opts.local),
    storage(opts.session),
    () => ({ matches: Boolean(opts.light) }),
  );
  return { attrs, classes, meta };
}

describe('the inline boot paints the first-paint state', () => {
  it('nothing saved: motion on, dark chrome', () => {
    const r = boot();
    expect([...r.attrs.keys()]).toEqual([]);
    expect(r.classes.has('js-motion')).toBe(true);
    expect(r.meta.content).toBe('#1a1713');
  });

  it('nothing saved on a light OS: paper chrome', () => {
    expect(boot({ light: true }).meta.content).toBe('#f4ede1');
  });

  it('a saved theme and switches', () => {
    const r = boot({ local: { 'portfolio-theme': 'crt', 'portfolio-motion': 'reduced', 'portfolio-sound': 'on' }, session: { 'portfolio-crt': 'off' } });
    expect(r.attrs.get('data-theme')).toBe('crt');
    expect(r.attrs.get('data-motion')).toBe('reduced');
    expect(r.classes.has('js-motion')).toBe(false);
    expect(r.attrs.get('data-sound')).toBe('on');
    expect(r.attrs.get('data-crt')).toBe('off');
    expect(r.meta.content).toBe('#070b09');
  });

  it('ignores unknown values', () => {
    const r = boot({ local: { 'portfolio-theme': 'neon', 'portfolio-motion': 'maybe' } });
    expect(r.attrs.has('data-theme')).toBe(false);
    expect(r.classes.has('js-motion')).toBe(true);
  });

  it('refuses the Signal theme while locked', () => {
    const r = boot({ local: { 'portfolio-theme': 'signal' } });
    expect(r.attrs.has('data-theme')).toBe(false);
    expect(r.classes.has('has-signal')).toBe(false);
    expect(r.meta.content).toBe('#1a1713');
  });

  it('honours the Signal theme and stamp once unlocked', () => {
    const r = boot({ local: { 'portfolio-theme': 'signal', [REWARD_KEY]: JSON.stringify({ best: 9, clears: 1, since: '' }) } });
    expect(r.attrs.get('data-theme')).toBe('signal');
    expect(r.classes.has('has-signal')).toBe(true);
    expect(r.meta.content).toBe('#0d0a14');
  });

  it('a positive legacy best score also unlocks', () => {
    expect(boot({ local: { [LEGACY_BEST_KEY]: '7' } }).classes.has('has-signal')).toBe(true);
  });

  it('blocked storage: motion on, nothing else', () => {
    const r = boot({ local: 'blocked' });
    expect(r.classes.has('js-motion')).toBe(true);
    expect([...r.attrs.keys()]).toEqual([]);
  });
});

describe('the boot and parseReward agree on the unlock', () => {
  const cases: [string | null, string | null][] = [
    [null, null],
    ['{"best":0}', null],
    ['{"best":3}', null],
    ['{"best":"4"}', null],
    ['not json', null],
    ['', '0'],
    [null, '2'],
    ['{"best":0}', '1'],
    ['[]', null],
    ['{}', '-1'],
  ];
  for (const [raw, legacy] of cases) {
    it(`reward=${raw ?? 'none'} legacy=${legacy ?? 'none'}`, () => {
      const local: Record<string, string> = {};
      if (raw !== null) local[REWARD_KEY] = raw;
      if (legacy !== null) local[LEGACY_BEST_KEY] = legacy;
      expect(boot({ local }).classes.has('has-signal')).toBe(parseReward(raw, legacy) !== null);
    });
  }
});
