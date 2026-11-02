# Glossary

The names the code uses, so that a term means one thing across the site, its tests and its notes.
Add a term when a module is named after a concept that is not here yet; sharpen one when a
conversation finds it fuzzy.

## Visitor preferences (`src/scripts/prefs.ts`)

- **Preference** — a choice the visitor makes that the site remembers in their browser: `theme`,
  `motion`, `sound`, `crt` (scanlines on project pages) and `notes` (how a project's technical notes
  read). Each is one row of the **preference table** (`src/scripts/prefs-table.ts`): storage key,
  tier, accepted values, fallback, and what it paints on `<html>`.
- **Tier** — where a preference is stored: `local` (localStorage, remembered per browser) or
  `session` (sessionStorage, per tab; the CRT switch).
- **Boot** — the inline head script that paints the saved preferences before first paint
  (`src/scripts/generated/prefs-boot.js`, generated from the table and `design/tokens.json` by
  `tools/build-tokens.mjs`, inlined by `Base.astro`). The prefs module takes over once page scripts run.
- **Carry** — copying the preference attributes (and the `js-*` classes) from the current `<html>` to
  the next document on `astro:before-swap`, because the next document's boot never ran in this browser.
- **Preference change** — the one event (`portfolio:prefchange`) the module fires after `set()`, or
  when an OS preference moves (`source: 'system'`); listened to through `prefs.onChange(key, …)`.

## Themes and the Signal

- **Theme** — one of `prism` (darkroom), `paper` (daylight), `crt` (phosphor) or `signal`
  (afterglow). The ids and each theme's page background come from `design/tokens.json` through
  `src/scripts/generated/themes.ts`. With no theme saved the stylesheet follows the OS colour scheme
  (`paper` when light, `prism` otherwise).
- **Signal unlock** — clearing all five waves of Telegraph Recall writes the **reward record**
  (`portfolio-signal`, with `best`, `clears`, `since`); a positive best score in it, or in the
  mini-game's former best-score key, unlocks the `signal` theme and the hero **stamp**
  (`html.has-signal`). The rule is `parseReward` in `signal-reward.ts`; the boot applies the same
  rule for first paint. The unlock is an extra, never a lock.
