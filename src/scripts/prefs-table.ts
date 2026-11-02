/**
 * The preference table: which visitor choices exist, where each is stored and what it paints on
 * `<html>`. Data only, with no imports, so `tools/build-tokens.mjs` can load this file in Node and
 * render the inline boot script (src/scripts/generated/prefs-boot.js) from the same rows that
 * `prefs.ts` applies at runtime. Change a preference here and both sides follow; run the generator
 * and commit its output (a Vitest drift test fails until you do).
 */

export type Tier = 'local' | 'session';

export interface PrefState {
  /** Value of the row's `<html>` attribute for this preference value; `null` removes the attribute. */
  attr: string | null;
  /** `<html>` classes present while the preference has this value (removed for every other value). */
  classes: readonly string[];
}

export interface PrefRow {
  /** The name callers use: `prefs.get('motion')`. */
  key: string;
  storageKey: string;
  tier: Tier;
  /** Accepted stored values; anything else reads as `fallback`. */
  values: readonly string[];
  /**
   * The value when nothing valid is stored, or storage is blocked (private mode). `null` means
   * "unset": the theme row then paints nothing and the stylesheet follows the OS colour scheme.
   */
  fallback: string | null;
  /** The `<html>` attribute the row drives, if any. */
  attr: string | null;
  states: Readonly<Record<string, PrefState>>;
}

/**
 * The Signal unlock: clearing Telegraph Recall writes a reward record; a positive best score in it
 * (or in the mini-game's older best-score key) unlocks the fourth theme and the hero stamp. The rule
 * itself is `parseReward` in signal-reward.ts and, for first paint, the generated boot script.
 */
export const SIGNAL_UNLOCK = {
  rewardKey: 'portfolio-signal',
  legacyBestKey: 'portfolio-tg-best',
  theme: 'signal',
  className: 'has-signal',
} as const;

const on = (attrValue: string | null, classes: readonly string[] = []): PrefState => ({ attr: attrValue, classes });

/** The four switches that do not depend on the theme list. */
export const SWITCH_ROWS: readonly PrefRow[] = [
  {
    key: 'motion',
    storageKey: 'portfolio-motion',
    tier: 'local',
    values: ['full', 'reduced'],
    fallback: 'full',
    attr: 'data-motion',
    // `js-motion` tells the stylesheet that JavaScript is present and motion is on, so reveals may
    // start hidden; without it (no JS, or reduced) everything is visible from the first paint.
    states: { full: on(null, ['js-motion']), reduced: on('reduced') },
  },
  {
    key: 'sound',
    storageKey: 'portfolio-sound',
    tier: 'local',
    values: ['on', 'off'],
    fallback: 'off',
    attr: 'data-sound',
    states: { on: on('on'), off: on(null) },
  },
  {
    // The CRT scanline overlay on project pages: a per-tab choice, so a new tab starts with it on.
    key: 'crt',
    storageKey: 'portfolio-crt',
    tier: 'session',
    values: ['on', 'off'],
    fallback: 'on',
    attr: 'data-crt',
    states: { on: on(null), off: on('off') },
  },
  {
    // How a project's technical notes read: the explorer (stepped) or the whole page.
    key: 'notes',
    storageKey: 'portfolio-notes',
    tier: 'local',
    values: ['explore', 'page'],
    fallback: 'explore',
    attr: null,
    states: { explore: on(null), page: on(null) },
  },
];

/** The theme row, given the theme ids from design/tokens.json. */
export function themeRow(themeIds: readonly string[]): PrefRow {
  const states: Record<string, PrefState> = {};
  for (const id of themeIds) states[id] = on(id);
  return {
    key: 'theme',
    storageKey: 'portfolio-theme',
    tier: 'local',
    values: themeIds,
    fallback: null,
    attr: 'data-theme',
    states,
  };
}

/** Every row, theme first, in the order the boot script applies them. */
export function prefRows(themeIds: readonly string[]): readonly PrefRow[] {
  return [themeRow(themeIds), ...SWITCH_ROWS];
}
