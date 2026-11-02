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

## Page lifecycle (`src/scripts/page.ts`)

- **Page** — what the ClientRouter puts on screen between two swaps. Scripts live for the session;
  the page's elements do not.
- **Binder** — a function registered with `onPage` that binds one page: it runs once per page (at
  once if the page has already loaded, otherwise on `astro:page-load`), receives the page's
  **signal** for every listener that outlives the page, and may return a **cleanup**. Signal and
  cleanup fire on `astro:before-swap`.
- **Delegated hover** — `trackHover(selector, { move, leave })`: one document-level pointer listener
  follows the pointer over matching elements, in place of binding listeners on each of them.
- **Shared handles** — `shared.lenis`, `shared.reveal`, `shared.motionReady`: the objects scripts hand
  each other, in place of `window.*` globals.

## Telegraph Recall (`src/scripts/telegraph-*.ts`, `sound.ts`)

- **Engine** — the pure game model (`telegraph-engine.ts`): waves, cues, shoves, scoring, the Forecast
  Hint. **Stage controller** — the popup's state: current stage, explored portals, interaction count.
- **Board controller** — `telegraph-board.ts`: plays the engine's sequences as cues, takes the
  visitor's recall, owns manual-cue mode, the pause while the tab is hidden, the next-wave timer and
  the reward. It talks to a **board view** (the `BoardView` interface: the DOM adapter in
  `telegraph-ui.ts`, a recording fake in tests) and takes injected `wait`, `now` and storage.
- **Popup** — `telegraph-popup.ts`: the CRT dialog with its stage router, preview loop, focus trap,
  number-key shortcuts, `#lab?stage=<id>` deep links and the portal cards' inspector.
- **Copy** — `telegraph-copy.ts`: every string the game shows, as pure functions of the model.
- **Composition** — `telegraph-ui.ts`: queries the lab's elements once (all required), builds the DOM
  board view, binds the popup, wires the cabinet's keys; `init()` registers one page binder.
- **Sound cue** — a named entry in `sound.ts`'s `TONES` table (`click` for every control, `chime`
  for the landing, and the game's `cue`, `shove`, `step`, `wave`, `clear`, `miss`, `blocked`,
  `preview`, `stage-*`, `portal`, `close`); `sound.play(cue, step)` is the only way the site makes a
  sound, muted unless the `sound` preference is on. A tone may sweep its pitch, fade in, or carry
  further notes (`then`).

## Write-ups and notes (`src/lib/notes.ts`)

- **Write-up** — a project's Markdown file in `src/content/projects`. Its **breakdown** is the
  "Technical breakdown" H2, which must be the last H2.
- **Write-up plan** — `planWriteUp({ html, media, widget })`: the rendered write-up split into
  `before`, `intro` and **notes**, each note one H3 of the breakdown (the "What changed in …" H3s
  merged into one **release notes** note) carrying its heading, its body and its **visual**. A pure
  function: nothing passed in changes.
- **Visual** — what the pinned pane shows for a note: the page's **widget** (frontmatter `widget`,
  on the first note), the note's first code block (its in-note copy tagged `data-in-pane`), or a
  gallery image in turn. Rendered inside the note; moved to the **pane** on wide screens.
- **Write-up rules** — `WRITE_UP_RULES` and `checkWriteUpSource`: the conventions above, checked over
  every write-up by `tests/write-ups.test.ts`.

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
