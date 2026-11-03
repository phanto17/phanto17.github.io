# Code review: branch `world` (2026-11-03)

Two read-only passes over `main...world` (827cb88..fab4b45): a strict code-quality review and an
architecture review. Nothing was changed. The architecture report with diagrams was written outside
the repo (`%TEMP%\architecture-review-20261103-1400.html`). Line numbers are from fab4b45.

**Verdict: changes requested.** No file goes past 1k lines (engine.ts 511, world.css 780, overview.astro
745, which is mostly the old index.astro moved). The problems are structural. The world code
builds its own lifecycle, storage, key handling, hash routing, control styling and content copies
instead of using the modules set up on 2026-11-02, and it brings back two patterns that were deleted.

## Checked by hand before reporting

- `letters.ts:67`: `addEventListener('resize', …)` on `window` with no signal, never removed.
- `boot.ts:94, 99, 117, 127`: `history.replaceState(null, …)`. The popup keeps `history.state`
  (`telegraph-popup.ts:130`).
- `Base.astro:235`: the field boot returns early when the first page is the map. Because the canvas is
  persisted, the field never starts later in that session.
- `engine.ts:327-331` with `:470`: the intro orbit runs on `S.time`, which advances every frame, so the
  start-screen camera moves under reduced motion.
- `dioramas.ts:231`: "four-person teams". Mansion of Grief had four people and Animal Shelter three, so
  this is an invented fact.
- `boot.ts:225`: `window.__world` is set. `telegraph-ui.ts:271`: `lab.dataset.bound` is set.
- `SignalLanding.astro` is imported nowhere.

## Bugs and rule breaks (fix first)

**Fixed later on 2026-11-03 (uncommitted).** B1–B8 are fixed, plus two more bugs that the new checks
found. **B9:** Escape on the Telegraph popup inside the Lab also closed the Lab. The map now ignores
an Escape the popup already handled, in place of the `dialog[open]` query. **B10:** a quick Escape
after opening a panel could leave it open, because the deferred slide-in landed after the close.
`check-browser`'s world check now covers B1, B4, B5, B6 and B9, and waits on page state instead of
fixed sleeps. B2 was checked with a probe; B3 and B8 were checked by reading the code only.

| # | Where | What happens |
|---|---|---|
| B1 | `Base.astro:235`, `world.css:6-17` | Arrive on `/` and click Overview: the signal field never boots for the rest of the session. Arrive on `/overview/` and open the map: the persisted field keeps rendering in a `display:none` canvas, which is a second WebGL context. |
| B2 | `engine.ts:327-331` | The intro orbit ignores reduced motion. |
| B3 | `letters.ts:67` | Each visit to "Make a mess" leaks one window resize listener across navigations. |
| B4 | `boot.ts:81-128` | Open a panel, then open The Lab from the field log. The Lab opens over the drawer. Closing it clears the hash and unlocks input, but the drawer stays open with the camera still shifted. |
| B5 | `World.astro:238`, `boot.ts:117`, `telegraph-popup.ts:203-217` | `/#lab?stage=welcome` opens the Telegraph dialog over the start screen. `openLab()` then rewrites the hash to `#lab`, which drops the stage. |
| B6 | `boot.ts` `replaceState(null, …)` | Likely breaks ClientRouter back/forward into the map. Not verified in a browser. |
| B7 | `dioramas.ts:231` | "four-person teams" is not true for Animal Shelter. |
| B8 | `boot.ts:32`, `sound.ts` | With sound on, a deep link gets no AudioContext before a gesture, and nothing retries, so the ambient bed never starts. |

## Structure

1. **The engine's interface is its whole state.** `createEngine` returns the mutable `S`
   (`engine.ts:35-41, 488-509`) and fires `on.world`/`on.frame` before it returns. That is why boot.ts
   has `let engine | null`, guards, a re-alias and a second `renderLog()`. Fix: build in `start()`,
   expose a small read API, and move `stepFrames`/`quality`/`skipRender` to a debug handle.
2. **Mode is never modelled.** Drawer, Lab and Dev Mode state is spread over `hidden` flags, `openId`,
   `inputLocked`, `S.dev`, `setShift` and the hash. Fix: one `WorldMode` (map | panel id | lab tab) and
   one `setMode()` that applies DOM, input lock, camera shift, hash and sound together. This fixes B4
   and B5. See architecture candidates 1 and 4.
3. **"Uncharted" is special-cased in 12 places** (gen.ts ×4, engine.ts ×5, boot.ts ×3), and
   `Location.type` is never read. Fix: `buildLayout` returns `{ locations, freeSlot }`, so the free
   slot is not a location and every filter goes away.
4. **Ten `S.view` branches and about six motion branches.** Fix: a `VIEW_SPECS` table read by one
   `applyView`, and one decorative clock (`animT += motion ? dt : 0`) for all decorative motion. The
   clock also fixes B2.
5. **Content and formatting duplicated** (`World.astro:27-35, 163, 187, 204, 207`; `boot.ts:102-109`;
   `tests/world-gen.test.ts:4-9`; `check-browser.cjs:473`). The landmarks are a literal, not data from
   `site.ts`/`activities.ts`/`about.ts` as CLAUDE.md says. Status label, period and live link are
   derived in four places with three wordings. The copy-mail binder exists twice. The Radio Mast line
   has already drifted from the overview. Fix: one location catalogue plus a project-view helper
   (architecture candidate 3).
6. **Project kinds are listed in four places** (`content.config.ts:75`, `gen.ts:15`, `FOOTPRINT`,
   `KINDS`), with a silent `?? generic` fallback (`dioramas.ts:260`) and the default accent written
   twice. Fix: `PROJECT_KINDS` as const in gen.ts and `z.enum(PROJECT_KINDS)`.
7. **Deleted patterns are back:** `window.__world` (double cast) and `dataset.bound`, both for
   check-browser only. Fix: one typed opt-in test seam; the checks wait on visible UI state.
8. **Page-lifecycle contract.** B3, plus boot's `$` is a blind `as T` over about 40 lookups. Fix:
   `mountLetters(…, { signal })` and a `queryWorld()` in the style of `queryLab`.
9. **Two window keydown handlers disagree about inputs** (`engine.ts:443-449`, `boot.ts:185-201`).
   Fix: boot owns the only dispatcher and calls `eng.setMoveInput`.
10. **Telegraph patch.** `telegraph-popup.ts:138` makes `renderStage` sometimes change the stage. Fix:
    render only; callers call `transitionTo`.
11. **engine.ts mixes about a dozen concerns** and builds DOM buttons, against its own header. The
    critter FSM is untested. Fix: `critters.ts` (pure, tested), `minimap.ts`, `labels.ts` on the boot
    side, and `views.ts` (architecture candidate 2).
12. **world.css** repeats the reduced-motion block (`:769-780`), which CLAUDE.md forbids, and styles
    `.world-seg button`, `.world-x` and the log buttons by hand instead of with `.key`.
13. **Dead code:** SignalLanding, `shouldShowLanding`/`LANDING_*`, the `chime` cue unless the landing
    is remounted, `rankLabel` (used only in tests; `SignalStamp.astro:29-30` builds its own string),
    `Location.type`. `generate()` mutates its input (`gen.ts:123`).
14. **Density:** 94 lines over 160 characters in engine/boot/dioramas, the longest 304, against 0 in
    the Telegraph modules. There are single-letter names (`S`, `g`, `c`, `x`) and `P` as both a type and
    an array in letters.ts.

## Architecture candidates (from the HTML report)

1. **Map controller behind a MapView seam.** Strong. It has the same shape as the Telegraph board
   controller.
2. **Field simulation module under the engine.** Strong. It covers the explorer, the locals, nearness,
   arrival and picking.
3. **One location catalogue.** Strong. The restyle plan's F3 depends on it.
4. **One owner of the URL fragment.** Worth exploring. It contains B5 and B6.
5. **The ambient bed inside the sound module.** Worth exploring. It contains B8; the cue-list test
   also misses the map's five cues.
6. **The map's controls on the glass-key seam.** Speculative. It is the same as structure item 12.

Top recommendation: 1 and 2 together, then 3.

## What is good

`gen.ts` is pure and pinned by tests. The world uses `onPage`, `prefs`, `sound.play` and `TONES`.
`about.ts` gives About one source shared by the overview and the Field Station panel.
