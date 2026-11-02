/**
 * Visitor preferences: the one module that knows the storage keys, the `<html>` attributes and
 * classes, the change event and the rules behind them (is motion allowed, is the Signal theme
 * unlocked, which themes the key cycles through, which theme-color the browser chrome gets).
 *
 * The rows live in prefs-table.ts (data only) and are also rendered into the inline boot script
 * that paints them before first paint (src/scripts/generated/prefs-boot.js, inlined by Base.astro).
 * This module takes over once the page scripts run: `set()` writes storage, paints `<html>` and
 * fires one `portfolio:prefchange` event, as a single operation.
 *
 * Everything outside is injected (`createPrefs`), so the rules are unit-tested against fakes; the
 * default instance `prefs` binds to the real browser, and is inert when there is no document.
 */
import { LIGHT_THEME, PUBLIC_THEMES, SIGNAL_THEME, THEMES, THEME_BG, type ThemeId } from './generated/themes';
import { SIGNAL_UNLOCK, prefRows, type PrefRow } from './prefs-table';
import { readReward, type StorageLike } from './signal-reward';

export interface PrefValues {
  /** `null` = no choice saved: the stylesheet follows the OS colour scheme. */
  theme: ThemeId | null;
  motion: 'full' | 'reduced';
  sound: 'on' | 'off';
  /** CRT scanlines on project pages (per tab). */
  crt: 'on' | 'off';
  /** How a project's technical notes read. */
  notes: 'explore' | 'page';
}
export type PrefKey = keyof PrefValues;

export const PREF_CHANGE_EVENT = 'portfolio:prefchange';

export interface PrefChange<K extends PrefKey = PrefKey> {
  key: K;
  value: PrefValues[K];
  /** `set` = a call to `set()`; `system` = the OS preference moved (reduced motion, colour scheme). */
  source: 'set' | 'system';
}

export interface RootLike {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  classList: { add(...names: string[]): void; remove(...names: string[]): void; contains(name: string): boolean };
}
export interface MediaLike {
  matches: boolean;
  addEventListener?(type: 'change', listener: () => void): void;
}
export interface PrefsDeps {
  local: StorageLike | null;
  session: StorageLike | null;
  root: RootLike;
  matchMedia: (query: string) => MediaLike;
  /** Where `portfolio:prefchange` is dispatched (window in the browser). */
  target: EventTarget;
  /** The `<meta name="theme-color">`, if the page has one. */
  themeColorMeta?: () => { setAttribute(name: string, value: string): void } | null;
}

export interface Prefs {
  get<K extends PrefKey>(key: K): PrefValues[K];
  /**
   * Save, paint and announce a preference. Returns false (and changes nothing) for a value the row
   * does not accept, or for the Signal theme while it is locked.
   */
  set<K extends PrefKey>(key: K, value: PrefValues[K]): boolean;
  /** Listen for one key (or every key with `null`); returns the unsubscribe. */
  onChange(key: PrefKey | null, listener: (change: PrefChange) => void, options?: { signal?: AbortSignal }): () => void;

  /** The visitor's switch is on and the OS does not ask for reduced motion. */
  isMotionAllowed(): boolean;
  /** The OS asks for reduced motion (the site's switch is then disabled). */
  systemReducedMotion(): boolean;
  isSoundOn(): boolean;

  /** Telegraph Recall has been cleared in this browser (reads the reward record). */
  signalUnlocked(): boolean;
  /** Re-read the reward and paint `html.has-signal` accordingly; call after the record changes. */
  refreshSignal(): boolean;

  /** The theme in effect: the saved one, else the OS scheme's. */
  currentTheme(): ThemeId;
  /** The theme key's cycle: the public themes, plus Signal once unlocked. */
  availableThemes(): readonly ThemeId[];
  nextTheme(): ThemeId;
  /** The page background of a theme, for the browser chrome. */
  themeColor(theme?: ThemeId): string;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const LIGHT_SCHEME = '(prefers-color-scheme: light)';

export const PREF_ROWS: readonly PrefRow[] = prefRows(THEMES);
const rowOf = (key: PrefKey): PrefRow => PREF_ROWS.find((row) => row.key === key) as PrefRow;

/** The `<html>` attributes the preferences paint; Base.astro carries these across a page swap. */
export const CARRIED_ATTRIBUTES: readonly string[] = PREF_ROWS.flatMap((row) => (row.attr ? [row.attr] : []));

export function createPrefs(deps: PrefsDeps): Prefs {
  const { root, target } = deps;
  const storageFor = (row: PrefRow) => (row.tier === 'session' ? deps.session : deps.local);

  const readStored = (row: PrefRow): string | null => {
    try {
      return storageFor(row)?.getItem(row.storageKey) ?? null;
    } catch {
      return null;
    }
  };
  const writeStored = (row: PrefRow, value: string | null) => {
    try {
      if (value !== null) storageFor(row)?.setItem(row.storageKey, value);
    } catch {
      /* private mode: the choice lasts for this page view */
    }
  };

  const signalUnlocked = (): boolean => {
    try {
      return readReward(deps.local) !== null;
    } catch {
      return false;
    }
  };

  /** A stored value that the row accepts and the rules allow, else the fallback. */
  const validate = (row: PrefRow, value: string | null): string | null => {
    if (value === null || !row.values.includes(value)) return row.fallback;
    if (row.key === 'theme' && value === SIGNAL_THEME && !signalUnlocked()) return row.fallback;
    return value;
  };

  const paint = (row: PrefRow, value: string | null) => {
    const state = value === null ? null : row.states[value];
    const keep = new Set(state?.classes ?? []);
    for (const other of Object.values(row.states)) {
      for (const name of other.classes) if (!keep.has(name)) root.classList.remove(name);
    }
    if (keep.size) root.classList.add(...keep);
    if (row.attr) {
      if (state && state.attr !== null) root.setAttribute(row.attr, state.attr);
      else root.removeAttribute(row.attr);
    }
  };

  // What the boot script painted before first paint, re-derived from the same storage; painting it
  // again is a no-op there and makes this module self-sufficient where the boot did not run.
  const current = new Map<string, string | null>();
  for (const row of PREF_ROWS) {
    const value = validate(row, readStored(row));
    current.set(row.key, value);
    paint(row, value);
  }

  const get = <K extends PrefKey>(key: K): PrefValues[K] => current.get(key) as PrefValues[K];

  const currentTheme = (): ThemeId =>
    get('theme') ?? (deps.matchMedia(LIGHT_SCHEME).matches ? LIGHT_THEME : THEMES[0]);
  const themeColor = (theme: ThemeId = currentTheme()): string => THEME_BG[theme] ?? THEME_BG[THEMES[0]];
  const paintThemeColor = () => deps.themeColorMeta?.()?.setAttribute('content', themeColor());

  const announce = <K extends PrefKey>(key: K, source: PrefChange['source']) => {
    const detail: PrefChange<K> = { key, value: get(key), source };
    target.dispatchEvent(new CustomEvent(PREF_CHANGE_EVENT, { detail }));
  };

  const set = <K extends PrefKey>(key: K, value: PrefValues[K]): boolean => {
    const row = rowOf(key);
    if (value === null || validate(row, value) !== value) return false;
    current.set(key, value);
    writeStored(row, value);
    paint(row, value);
    if (key === 'theme') paintThemeColor();
    announce(key, 'set');
    return true;
  };

  const onChange: Prefs['onChange'] = (key, listener, options) => {
    const handler = (event: Event) => {
      const change = (event as CustomEvent<PrefChange>).detail;
      if (key === null || change.key === key) listener(change);
    };
    target.addEventListener(PREF_CHANGE_EVENT, handler, options);
    return () => target.removeEventListener(PREF_CHANGE_EVENT, handler);
  };

  const refreshSignal = (): boolean => {
    const unlocked = signalUnlocked();
    if (unlocked) root.classList.add(SIGNAL_UNLOCK.className);
    else root.classList.remove(SIGNAL_UNLOCK.className);
    return unlocked;
  };

  const availableThemes = (): readonly ThemeId[] => (signalUnlocked() ? THEMES : PUBLIC_THEMES);
  const nextTheme = (): ThemeId => {
    const cycle = availableThemes();
    const idx = cycle.indexOf(currentTheme());
    // A locked Signal theme (another browser's choice, or a cleared storage) returns to the first theme.
    return cycle[(idx + 1) % cycle.length] ?? cycle[0];
  };

  // The OS preferences moving: the motion rule changes without a `set()`, and an unset theme
  // follows the colour scheme.
  deps.matchMedia(REDUCED_MOTION).addEventListener?.('change', () => announce('motion', 'system'));
  deps.matchMedia(LIGHT_SCHEME).addEventListener?.('change', () => {
    if (get('theme') !== null) return;
    paintThemeColor();
    announce('theme', 'system');
  });

  return {
    get,
    set,
    onChange,
    isMotionAllowed: () => get('motion') !== 'reduced' && !deps.matchMedia(REDUCED_MOTION).matches,
    systemReducedMotion: () => deps.matchMedia(REDUCED_MOTION).matches,
    isSoundOn: () => get('sound') === 'on',
    signalUnlocked,
    refreshSignal,
    currentTheme,
    availableThemes,
    nextTheme,
    themeColor,
  };
}

/** The real browser, or inert stand-ins when this module is evaluated without a document (tests, SSR). */
function browserDeps(): PrefsDeps {
  if (typeof document === 'undefined') {
    const inertRoot: RootLike = {
      getAttribute: () => null,
      setAttribute: () => {},
      removeAttribute: () => {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
    };
    return { local: null, session: null, root: inertRoot, matchMedia: () => ({ matches: false }), target: new EventTarget() };
  }
  const safe = (read: () => StorageLike): StorageLike | null => {
    try {
      return read();
    } catch {
      return null;
    }
  };
  return {
    local: safe(() => localStorage),
    session: safe(() => sessionStorage),
    root: document.documentElement,
    matchMedia: (query) => window.matchMedia(query),
    target: window,
    themeColorMeta: () => document.getElementById('theme-color'),
  };
}

/** The site's preferences, bound to this browser. */
export const prefs: Prefs = createPrefs(browserDeps());
