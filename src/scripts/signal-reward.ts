/**
 * Signal landing and clear-the-signal reward: the pure rules, with no DOM.
 *
 * - The landing panel ("The signal is live." + Play Telegraph Recall) shows once per visitor, after a
 *   few idle seconds on the home page, and never under reduced motion or on a deep link.
 * - Clearing wave 5 of Telegraph Recall unlocks the reward: a "SIGNAL CLEARED · <best>" stamp in the
 *   hero and a hidden fourth theme the theme key cycles into. Both are kept per browser in
 *   localStorage; the site itself is never locked.
 *
 * Everything that touches storage takes a storage-like object so the rules can be unit-tested and so
 * a blocked localStorage (private mode) degrades to "nothing unlocked".
 */

import { PUBLIC_THEMES, SIGNAL_THEME, type ThemeId } from './generated/themes';
import { SIGNAL_UNLOCK } from './prefs-table';

/** The public themes (the theme key's cycle before the unlock). From design/tokens.json via the generator. */
export const THEME_IDS: readonly ThemeId[] = PUBLIC_THEMES;
export { SIGNAL_THEME };
export type { ThemeId };

/** JSON record of the reward. */
export const REWARD_KEY = SIGNAL_UNLOCK.rewardKey;
/** The mini-game's former best-score key (a number); a positive value from before the record existed also unlocks. */
export const LEGACY_BEST_KEY = SIGNAL_UNLOCK.legacyBestKey;
/** 'seen' once the landing panel has been shown. */
export const LANDING_KEY = 'portfolio-landing';

export const LANDING_DELAY_MS = 4000;
/** Scrolling this far (px) before or after the panel appears counts as "not idle" / "dismiss". */
export const LANDING_SCROLL_THRESHOLD = 80;

export interface SignalReward {
  /** Best campaign score. */
  best: number;
  /** How many times all waves were cleared in this browser. */
  clears: number;
  /** ISO date of the first clear. */
  since: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const toScore = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/**
 * Parse the stored reward. A legacy best score alone (a visitor who cleared the game before the
 * reward existed) counts as one clear of unknown date.
 */
export function parseReward(raw: string | null | undefined, legacyBest?: string | null): SignalReward | null {
  let reward: SignalReward | null = null;
  if (raw) {
    try {
      const obj = JSON.parse(raw) as Partial<SignalReward> | null;
      const best = toScore(obj?.best);
      if (obj && best > 0) {
        reward = {
          best,
          clears: Math.max(1, toScore(obj.clears)),
          since: typeof obj.since === 'string' ? obj.since : '',
        };
      }
    } catch {
      reward = null;
    }
  }
  const legacy = toScore(legacyBest);
  if (legacy > 0) {
    if (!reward) reward = { best: legacy, clears: 1, since: '' };
    else if (legacy > reward.best) reward = { ...reward, best: legacy };
  }
  return reward;
}

export function readReward(storage: StorageLike | null | undefined): SignalReward | null {
  try {
    if (!storage) return null;
    return parseReward(storage.getItem(REWARD_KEY), storage.getItem(LEGACY_BEST_KEY));
  } catch {
    return null;
  }
}

/** The reward after one more clear with `score`. */
export function recordClear(prev: SignalReward | null, score: number, now: Date): SignalReward {
  const s = toScore(score);
  if (!prev) return { best: s, clears: 1, since: now.toISOString() };
  return { best: Math.max(prev.best, s), clears: prev.clears + 1, since: prev.since || now.toISOString() };
}

export function saveReward(storage: StorageLike | null | undefined, reward: SignalReward): boolean {
  try {
    storage?.setItem(REWARD_KEY, JSON.stringify(reward));
    return Boolean(storage);
  } catch {
    return false;
  }
}

/** The hero stamp's text: `SIGNAL CLEARED · 1200`. */
export function stampLabel(reward: SignalReward): string {
  return `SIGNAL CLEARED · ${reward.best}`;
}

export function isThemeId(value: unknown, unlocked: boolean): value is ThemeId {
  if (value === SIGNAL_THEME) return unlocked;
  return (THEME_IDS as readonly unknown[]).includes(value);
}

/** The theme key's cycle: the three public themes, plus Signal once unlocked. */
export function availableThemes(unlocked: boolean): readonly ThemeId[] {
  return unlocked ? [...THEME_IDS, SIGNAL_THEME] : THEME_IDS;
}

export function nextTheme(current: ThemeId, unlocked: boolean): ThemeId {
  const cycle = availableThemes(unlocked);
  const idx = cycle.indexOf(current);
  // A locked Signal theme (another browser's choice, or a cleared storage) returns to the first theme.
  return cycle[(idx + 1) % cycle.length] ?? cycle[0];
}

export interface LandingContext {
  /** `localStorage['portfolio-landing'] === 'seen'`. */
  seen: boolean;
  /** OS `prefers-reduced-motion` or the site's motion switch. */
  reducedMotion: boolean;
  /** `location.hash` on arrival; any hash is a deep link. */
  hash: string;
  /** `location.pathname`; only the home page has the panel. */
  pathname: string;
  /** True for the document the visitor arrived on, false after a client-side navigation. */
  firstLoad: boolean;
}

/** Whether the landing panel should be armed for this page view. */
export function shouldShowLanding(ctx: LandingContext): boolean {
  if (ctx.seen || ctx.reducedMotion || !ctx.firstLoad) return false;
  if (ctx.hash && ctx.hash !== '#') return false;
  return ctx.pathname === '/' || ctx.pathname === '/index.html';
}
