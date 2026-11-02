import { describe, expect, it } from 'vitest';
import {
  CARRIED_ATTRIBUTES,
  PREF_CHANGE_EVENT,
  createPrefs,
  type MediaLike,
  type PrefChange,
  type PrefsDeps,
  type RootLike,
} from '../src/scripts/prefs';
import { REWARD_KEY } from '../src/scripts/signal-reward';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}
const blockedStorage = {
  getItem: (): string | null => {
    throw new DOMException('blocked', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('blocked', 'SecurityError');
  },
};

function fakeRoot() {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const root: RootLike & { attrs: Map<string, string>; classes: Set<string> } = {
    attrs,
    classes,
    getAttribute: (n) => attrs.get(n) ?? null,
    setAttribute: (n, v) => void attrs.set(n, v),
    removeAttribute: (n) => void attrs.delete(n),
    classList: {
      add: (...n) => n.forEach((c) => classes.add(c)),
      remove: (...n) => n.forEach((c) => classes.delete(c)),
      contains: (c) => classes.has(c),
    },
  };
  return root;
}

/** Media queries whose `matches` can be flipped from the test, firing their change listeners. */
function fakeMedia(initial: Record<string, boolean> = {}) {
  const queries = new Map<string, MediaLike & { listeners: Set<() => void>; matches: boolean }>();
  const get = (q: string) => {
    let m = queries.get(q);
    if (!m) {
      const listeners = new Set<() => void>();
      m = { matches: initial[q] ?? false, listeners, addEventListener: (_t, l) => void listeners.add(l) };
      queries.set(q, m);
    }
    return m;
  };
  return {
    matchMedia: (q: string) => get(q),
    flip(q: string, matches: boolean) {
      const m = get(q);
      m.matches = matches;
      m.listeners.forEach((l) => l());
    },
  };
}

const REDUCED = '(prefers-reduced-motion: reduce)';
const LIGHT = '(prefers-color-scheme: light)';

function build(overrides: Partial<PrefsDeps> & { localData?: Record<string, string>; media?: Record<string, boolean> } = {}) {
  const local = memoryStorage(overrides.localData);
  const session = memoryStorage();
  const root = fakeRoot();
  const media = fakeMedia(overrides.media);
  const target = new EventTarget();
  const meta = { content: '', setAttribute: (_n: string, v: string) => void (meta.content = v) };
  const events: PrefChange[] = [];
  target.addEventListener(PREF_CHANGE_EVENT, (e) => events.push((e as CustomEvent<PrefChange>).detail));
  const prefs = createPrefs({
    local,
    session,
    root,
    matchMedia: media.matchMedia,
    target,
    themeColorMeta: () => meta,
    ...overrides,
  });
  return { prefs, local, session, root, media, meta, events };
}

describe('reading preferences', () => {
  it('falls back when nothing is stored', () => {
    const { prefs, root } = build();
    expect(prefs.get('theme')).toBeNull();
    expect(prefs.get('motion')).toBe('full');
    expect(prefs.get('sound')).toBe('off');
    expect(prefs.get('crt')).toBe('on');
    expect(prefs.get('notes')).toBe('explore');
    // The boot's first-paint state, repainted: motion on means js-motion, no attributes otherwise.
    expect(root.classes.has('js-motion')).toBe(true);
    expect([...root.attrs.keys()]).toEqual([]);
  });

  it('reads and paints stored values, including the session-tier CRT switch', () => {
    const { prefs, root } = build({ localData: { 'portfolio-theme': 'crt', 'portfolio-motion': 'reduced', 'portfolio-sound': 'on' } });
    expect(prefs.get('theme')).toBe('crt');
    expect(root.attrs.get('data-theme')).toBe('crt');
    expect(root.attrs.get('data-motion')).toBe('reduced');
    expect(root.classes.has('js-motion')).toBe(false);
    expect(root.attrs.get('data-sound')).toBe('on');
  });

  it('ignores values the row does not accept', () => {
    const { prefs } = build({ localData: { 'portfolio-theme': 'neon', 'portfolio-motion': 'maybe' } });
    expect(prefs.get('theme')).toBeNull();
    expect(prefs.get('motion')).toBe('full');
  });

  it('treats a locked Signal theme as unset', () => {
    const { prefs, root } = build({ localData: { 'portfolio-theme': 'signal' } });
    expect(prefs.get('theme')).toBeNull();
    expect(root.attrs.has('data-theme')).toBe(false);
  });

  it('honours the Signal theme once the reward record unlocks it', () => {
    const { prefs } = build({ localData: { 'portfolio-theme': 'signal', [REWARD_KEY]: JSON.stringify({ best: 12, clears: 1, since: '' }) } });
    expect(prefs.get('theme')).toBe('signal');
    expect(prefs.signalUnlocked()).toBe(true);
  });

  it('degrades to the fallbacks when storage is blocked', () => {
    const { prefs, root } = build({ local: blockedStorage, session: blockedStorage });
    expect(prefs.get('motion')).toBe('full');
    expect(root.classes.has('js-motion')).toBe(true);
    expect(prefs.signalUnlocked()).toBe(false);
    expect(prefs.set('motion', 'reduced')).toBe(true); // still paints for this page view
    expect(root.attrs.get('data-motion')).toBe('reduced');
  });
});

describe('setting preferences', () => {
  it('writes storage, paints <html> and announces, as one operation', () => {
    const { prefs, local, root, events } = build();
    expect(prefs.set('motion', 'reduced')).toBe(true);
    expect(local.data['portfolio-motion']).toBe('reduced');
    expect(root.attrs.get('data-motion')).toBe('reduced');
    expect(root.classes.has('js-motion')).toBe(false);
    expect(events).toEqual([{ key: 'motion', value: 'reduced', source: 'set' }]);

    prefs.set('motion', 'full');
    expect(root.attrs.has('data-motion')).toBe(false);
    expect(root.classes.has('js-motion')).toBe(true);
  });

  it('keeps the CRT switch in the session tier', () => {
    const { prefs, local, session, root } = build();
    prefs.set('crt', 'off');
    expect(session.data['portfolio-crt']).toBe('off');
    expect(local.data['portfolio-crt']).toBeUndefined();
    expect(root.attrs.get('data-crt')).toBe('off');
    prefs.set('crt', 'on');
    expect(root.attrs.has('data-crt')).toBe(false);
  });

  it('stores the notes mode without painting anything', () => {
    const { prefs, local, root } = build();
    prefs.set('notes', 'page');
    expect(local.data['portfolio-notes']).toBe('page');
    expect(prefs.get('notes')).toBe('page');
    expect([...root.attrs.keys()]).toEqual([]);
  });

  it('rejects values the row does not accept, changing nothing', () => {
    const { prefs, local, events } = build();
    expect(prefs.set('sound', 'loud' as 'on')).toBe(false);
    expect(local.data['portfolio-sound']).toBeUndefined();
    expect(events).toEqual([]);
  });

  it('rejects the Signal theme while locked, accepts it once unlocked', () => {
    const { prefs, local, root, meta } = build();
    expect(prefs.set('theme', 'signal')).toBe(false);
    expect(root.attrs.has('data-theme')).toBe(false);
    local.setItem(REWARD_KEY, JSON.stringify({ best: 5, clears: 1, since: '' }));
    expect(prefs.set('theme', 'signal')).toBe(true);
    expect(root.attrs.get('data-theme')).toBe('signal');
    expect(meta.content).toBe('#0d0a14');
  });

  it('updates the browser chrome colour with the theme', () => {
    const { prefs, meta } = build();
    prefs.set('theme', 'paper');
    expect(meta.content).toBe('#f4ede1');
    expect(prefs.themeColor()).toBe('#f4ede1');
    expect(prefs.themeColor('crt')).toBe('#070b09');
  });
});

describe('motion and sound rules', () => {
  it('allows motion only when the switch is on and the OS does not ask for less', () => {
    const { prefs, media } = build();
    expect(prefs.isMotionAllowed()).toBe(true);
    prefs.set('motion', 'reduced');
    expect(prefs.isMotionAllowed()).toBe(false);
    prefs.set('motion', 'full');
    media.flip(REDUCED, true);
    expect(prefs.isMotionAllowed()).toBe(false);
    expect(prefs.systemReducedMotion()).toBe(true);
  });

  it('announces an OS reduced-motion change as a system change', () => {
    const { media, events } = build();
    media.flip(REDUCED, true);
    expect(events).toEqual([{ key: 'motion', value: 'full', source: 'system' }]);
  });

  it('reports sound from the stored switch', () => {
    const { prefs } = build({ localData: { 'portfolio-sound': 'on' } });
    expect(prefs.isSoundOn()).toBe(true);
    prefs.set('sound', 'off');
    expect(prefs.isSoundOn()).toBe(false);
  });
});

describe('themes', () => {
  it('resolves the current theme from the saved choice, else the OS scheme', () => {
    const { prefs, media } = build();
    expect(prefs.currentTheme()).toBe('prism');
    media.flip(LIGHT, true);
    expect(prefs.currentTheme()).toBe('paper');
    prefs.set('theme', 'crt');
    expect(prefs.currentTheme()).toBe('crt');
  });

  it('follows an OS scheme change only while no theme is saved', () => {
    const { prefs, media, events, meta } = build();
    media.flip(LIGHT, true);
    expect(events).toEqual([{ key: 'theme', value: null, source: 'system' }]);
    expect(meta.content).toBe('#f4ede1');
    prefs.set('theme', 'crt');
    events.length = 0;
    media.flip(LIGHT, false);
    expect(events).toEqual([]);
  });

  it('cycles the public themes, and Signal once unlocked', () => {
    const { prefs, local } = build();
    expect(prefs.availableThemes()).toEqual(['prism', 'paper', 'crt']);
    expect(prefs.nextTheme()).toBe('paper');
    prefs.set('theme', 'crt');
    expect(prefs.nextTheme()).toBe('prism');
    local.setItem(REWARD_KEY, JSON.stringify({ best: 5, clears: 1, since: '' }));
    expect(prefs.availableThemes()).toEqual(['prism', 'paper', 'crt', 'signal']);
    expect(prefs.nextTheme()).toBe('signal');
  });

  it('refreshSignal paints html.has-signal from the reward record', () => {
    const { prefs, local, root } = build();
    expect(prefs.refreshSignal()).toBe(false);
    expect(root.classes.has('has-signal')).toBe(false);
    local.setItem(REWARD_KEY, JSON.stringify({ best: 5, clears: 1, since: '' }));
    expect(prefs.refreshSignal()).toBe(true);
    expect(root.classes.has('has-signal')).toBe(true);
  });
});

describe('subscriptions', () => {
  it('filters by key, or hears everything with null', () => {
    const { prefs } = build();
    const motion: PrefChange[] = [];
    const all: PrefChange[] = [];
    prefs.onChange('motion', (c) => motion.push(c));
    prefs.onChange(null, (c) => all.push(c));
    prefs.set('sound', 'on');
    prefs.set('motion', 'reduced');
    expect(motion.map((c) => c.key)).toEqual(['motion']);
    expect(all.map((c) => c.key)).toEqual(['sound', 'motion']);
  });

  it('stops on unsubscribe and on an aborted signal', () => {
    const { prefs } = build();
    const seen: string[] = [];
    const off = prefs.onChange('sound', () => seen.push('a'));
    const page = new AbortController();
    prefs.onChange('sound', () => seen.push('b'), { signal: page.signal });
    prefs.set('sound', 'on');
    off();
    page.abort();
    prefs.set('sound', 'off');
    expect(seen).toEqual(['a', 'b']);
  });
});

it('carries every painted attribute across a page swap', () => {
  expect(CARRIED_ATTRIBUTES).toEqual(['data-theme', 'data-motion', 'data-sound', 'data-crt']);
});
