/* Prism CRT themes — generated from design/tokens.json by tools/build-tokens.mjs. Do not edit by hand. */

export const THEMES = ['prism', 'paper', 'crt', 'signal'] as const;
export type ThemeId = (typeof THEMES)[number];
/** The themes the theme key cycles through before the Signal unlock. */
export const PUBLIC_THEMES: readonly ThemeId[] = ['prism', 'paper', 'crt'] as const;
/** The fourth theme, unlocked by clearing Telegraph Recall. */
export const SIGNAL_THEME = 'signal' as const;
/** The light theme: in effect when nothing is saved and the OS prefers a light scheme. */
export const LIGHT_THEME = 'paper' as const;
/** Each theme's page background (`bg`), for the browser chrome's theme-color. */
export const THEME_BG: Record<ThemeId, string> = {
  prism: '#1a1713',
  paper: '#f4ede1',
  crt: '#070b09',
  signal: '#0d0a14',
};
