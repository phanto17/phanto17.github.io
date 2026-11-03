# Plan: every page in the field map's style

Drafted 2026-11-03 on branch `world`. Nothing in it is built yet. Every task has a title, a
description, an objective and an estimate, as the working rules ask. The decisions at the top are the
owner's to make; the tasks assume the recommended answer and say where another answer changes them.

## Where things stand

Screenshots of every built page (1440×900, Paper theme because headless Chrome reports a light
scheme) are in the session scratchpad; the survey behind this plan covered `world.css`, `World.astro`,
every page and every component.

**The map's language** (`src/styles/world.css`, `src/components/World.astro`):

- A low-poly, flat-shaded island under real Poznań light (`src/world/light.ts`: teal water, green
  grass, sand paths, fog `#082a22` at night). The 3D world keeps its own light; the interface follows
  the theme.
- The interface is "notes clipped to a map board": small panels on a translucent ground
  (`--world-panel` = `bg` at 84 %), a **1px accent border, a 2px hard accent offset** (not the umber
  `--card-depth`), radius `--r-xs`.
- Every location has an **accent** (`world.accent` in a project's frontmatter, hardcoded for the four
  landmarks in `World.astro:28-31`). The accent is the border; a **mono uppercase eyebrow** in the accent
  pulled 60 % toward the text colour sits over a **Fraunces title**.
- **Diamonds** (rotated 7–9px squares) are the bullet, the field-log dot and the "visited" mark.
- The **drawer** is the long-form surface: eyebrow, h2, a meta row of pills + mono dates/engine, the clip,
  the lead, "Systems I built" as a diamond list, a row of glass keys.
- HUD furniture: field log (a list with a count, "1/8 explored", from `portfolio-world-visited`), minimap
  + Poznań clock with the phase ("13:43 · Day"), segmented controls, a dashed italic **uncharted** marker,
  Dev Mode in `--sky`.
- Controls are the site's glass keys (`.btn`, `.key`), so that part already matches.

**The other pages** (`/overview/`, `/projects/`, `/projects/<id>/`, `/404`, `/style-guide/`) still speak
the earlier language: the warm signal field, `--surface` cards with a 1.5px umber border and the umber
`--card-depth` offset, numbered section heads (01–06) with scrubbed outline numerals, WinBar
`CH_01 // HORDE-HOURS.WASM` bars, CRT frames. None of them knows its location or accent; the project
pages link back to `/overview/#projects`, never to the map; there is no path from a write-up to its place
on the map.

Hardcoded colours outside the tokens: Prism's 11 hex values, Figure's frame gradient (Prism-theme
values in every theme) and its rainbow glow, PopupCRT (11), motion.css glare/reticle/ripple, keys.css
bevels, ShoveLab and SignalStamp bevels, the Telegraph cells, and on the map the landmark accents, the
AI tags and the Dev Mode pass badge. Breakpoints in use: 980, 960, 900, 860, 760, 700, 680, 640, 600,
580, 560, 540, 520, 420, 419px.

## Decisions for the owner

| # | Question | Options | Recommendation |
|---|---|---|---|
| D1 | What sits behind the text pages? | **A** keep the signal field as it is · **B** the field takes the map's palette at the current Poznań hour (water, grass, path, fog, sun from `light.ts`), still mixed toward `bg` under the content column · **C** a static blurred render of the map | **B**. It ties every page to the map and the clock while keeping `field.ts`, its contrast lane and its fallbacks. The owner chose the signal field's references on 2026-10-29, so this replaces their colours; A is the answer if those references must stay. |
| D2 | Does a page take its location's accent? | yes (project pages from `world.accent`, overview sections from their landmark) · no (coral everywhere) | **Yes.** It is the map's main idea and the data already exists. |
| D3 | The card language | the map's label chrome (accent border + hard accent offset, translucent ground) everywhere · keep the umber brutal cards and only add accents | **The label chrome everywhere**; the umber offset stays on the CRT monitor pieces (Telegraph, PopupCRT) only. |
| D4 | Section numerals 01–06 on the overview | keep the scrubbed numerals · replace them with location tags (diamond + eyebrow + landmark name) | **Location tags**, with the numeral kept small in the eyebrow ("03 · The Lab"). |
| D5 | WinBar `CH_01 // X.WASM` bars over project cards | keep · replace with the map label (eyebrow + title) | **Replace** on the projects index; keep WinBar for the Telegraph cabinet and the contact terminal, where the CRT is the point. |
| D6 | `SignalLanding.astro` is imported nowhere | delete · keep for later | **Delete** (git keeps it). |

## Phase 0 — foundations (shared by every page)

### F0. Fix what the review found in the map's own chrome first
- **Description:** From `docs/review-world-2026-11-03.md`: start and stop the signal field per page with
  an `onPage` binder (B1; today a first visit to `/` leaves every later page without its field), let Base
  skip the footer for `chrome="world"` instead of world.css hiding it from outside, put `class="key"`
  on `.world-seg` buttons, `.world-x` and the log buttons, and delete world.css's duplicate
  reduced-motion block (review items 12/14).
- **Objective:** The map's chrome is built from the same seams the restyled pages will use, so F1 moves
  clean CSS rather than special cases.
- **Estimate:** 3 h

### F1. A field kit stylesheet
- **Description:** Move the map's reusable vocabulary out of `world.css` into `src/styles/field-kit.css`,
  imported by `global.css`: `.tag` (the label: translucent ground, accent border, hard accent offset),
  `.eyebrow` (mono uppercase, accent mixed toward text), `.diamond-list` and `.diamond` (bullet, done
  state), `.hud-panel` (hairline panel), `.seg` (segmented control), `.uncharted` (dashed, italic),
  `.meta-row` (pill + mono facts). `world.css` keeps only what is about the map (canvas, labels'
  positioning, HUD placement, drawer motion, Dev Mode) and uses the kit's classes.
- **Objective:** One definition of the map look that any page can use; `world.css` shrinks; nothing on
  the map changes visually (screenshot diff of `/` before/after).
- **Estimate:** 4 h

### F2. Accent and panel tokens
- **Description:** Add to `design/tokens.json` (and the design-system artifact copy): `panel` (the
  translucent ground, per theme), `acc-ink-mix` (the 60 % pull), `acc-offset` (2px), the four landmark
  accents (`loc-station`, `loc-lab`, `loc-guild`, `loc-mast`) per theme so Field Station's cream border
  reads on Paper, and the map's state colours (AI tags, the pass badge, `--sky` for Dev Mode). Regenerate
  with `node tools/build-tokens.mjs`; `World.astro` reads landmark accents from tokens instead of hex.
- **Objective:** No hex in `World.astro` or `world.css`; every accent passes 3:1 for borders and 4.5:1
  for eyebrow text on all four themes (checked by the contrast table the style guide already builds).
- **Estimate:** 3 h

### F3. One location list
- **Description:** A data module (`src/data/locations.ts`) that builds the location list once: projects
  from the collection (id, title, eyebrow = genre, accent, href `/projects/<id>/`, map link `/#<id>`)
  and the landmarks from `site.ts`/`about.ts`/`activities.ts` (Field Station → `/overview/#about`,
  The Lab → `#lab`, Guild Hall → `#activities`, Radio Mast → `#contact`). `World.astro`, the Nav, the
  overview, the projects index and the write-up pages all read it, together with one project-view helper
  (status label, period, live link; today four copies in three wordings). This is architecture
  candidate 3; do it once.
- **Objective:** A page knows its location and accent from one place; adding a project file still adds
  exactly one location everywhere (`tests/world-gen.test.ts` keeps passing; a new test pins that every
  location has an href and a map link).
- **Estimate:** 3 h

### F4. Three breakpoints
- **Description:** Replace the fourteen widths with three named ones in the token file (`wide` ≥ 981,
  `mid` ≤ 760, `narrow` ≤ 420; the map already uses 760) and move each component's queries onto them.
  Astro CSS cannot read custom properties in media queries, so the generator emits them as comments +
  a `breakpoints.ts` export, and a test greps the `.astro`/`.css` files for any other width.
- **Objective:** The pages and the map change layout at the same widths; `check-browser` layouts pass at
  320/375/640/768/1440 on all themes.
- **Estimate:** 3 h

### F5. The map-lit field (if D1 = B)
- **Description:** Split `light.ts` into a pure `daylight.ts` (hours, `phaseName`, `poznanHour`, the key
  table as hex) and the three.js sampler that wraps it, so pages can read the palette without loading
  three. `field.ts` takes its five colours from the current hour's water / grass / path / sun / fog
  instead of `--field-1..5` when the page is map-styled, re-sampled every few minutes; the lane/edge
  mix toward `bg` and the reduced-motion still frame stay as they are. The static CSS fallback gradient
  on `body` gets the same palette at build time (noon).
- **Objective:** Every page's backdrop is the map seen from far away, at the same time of day as the
  map; page text keeps ≥ 4.5:1 (the contrast check samples the lane at night, dawn, day and dusk).
- **Estimate:** 6 h

### F6. HUD nav and status line
- **Description:** Restyle `Nav.astro` as the map's HUD bar on every page: translucent `panel` ground with
  a hairline instead of the 2px umber rule, the utility keys in the same `world-key` mono size as the
  map's, "Map" always first and pointing at `/#<this page's location>` so it drops the visitor at the
  place they were reading about. The footer becomes the map's status line: "Poznań 13:43 · Day ·
  3/8 explored · style guide" (the clock from `daylight.ts`, the count from `portfolio-world-visited`,
  both optional and absent without JavaScript). Add the missing `/projects/` link.
- **Objective:** Moving between the map and any page keeps the same chrome; the persisted nav still
  carries across view transitions; no three.js on text pages (bundle check).
- **Estimate:** 4 h

### F7. Location bar
- **Description:** A `LocationBar.astro` for the top of every page under the nav: a diamond in the
  location's accent, the eyebrow ("Location 03 · 2D dungeon crawler"), "← Back to the map" (`/#<id>`)
  and, where it applies, "All projects". It replaces the `.kicker` back link on write-ups and the
  section kicker on the projects index.
- **Objective:** Every page says where on the map it is and gets back there in one click.
- **Estimate:** 2 h

## Phase 1 — pages

### P1. Write-up pages (`/projects/<id>/`) as location dossiers
- **Description:** The page is the drawer panel at full size. Set `--acc` from the project's
  `world.accent` on `<main>`. Hero: eyebrow (genre), Fraunces title (keeps `transition:name="title-<id>"`),
  the drawer's meta row (status pill, dates, engine), stat chips as `.tag`s, keys. "What I built" uses the
  drawer's diamond list. The sidebar box becomes a `.hud-panel` (hairline, mono labels, the CRT toggle as
  a `.key`, not the hand-rolled button). Figures take an accent frame instead of the fixed Prism gradient
  and rainbow glow. NotesExplorer's step list styles like the field log (diamond per note, filled when
  the note has been read in this visit, count "2/5 notes"). The gallery and Credits table sit in
  `.hud-panel`s. CRT scanlines stay on figures behind the existing switch.
- **Objective:** A visitor who clicks "Read the write-up" in the drawer lands on a page that is visibly
  the same panel, grown; all four write-ups pass `tests/write-ups.test.ts` and the layout checks at every
  width and theme.
- **Estimate:** 10 h

### P2. Drawer → write-up transition
- **Description:** Give the drawer's title, clip and eyebrow the same `transition:name`s as the write-up
  hero (`title-<id>`, `cover-<id>`), so "Read the write-up" morphs the panel into the page; the map's
  canvas fades under the CRT power-cycle. Going back (`/#<id>`) reopens the drawer at that location
  (the deep link exists in `World.astro:238`).
- **Objective:** Map → write-up → map feels like one place; under reduced motion it is an instant swap.
- **Estimate:** 3 h

### P3. Projects index (`/projects/`) as the location index
- **Description:** Replace ProjectRow's WinBar card with the map label grown into a row: accent border
  and offset, eyebrow, Fraunces title, the diamond list of highlights, keys; the big brick numeral
  becomes the eyebrow's "Location 0n". Above the list, a static SVG minimap generated at build time from
  `gen.ts` slot positions (no three.js): diamonds at each project's slot in its accent, each a link to the
  row and to `/#<id>`; visited ones filled from `portfolio-world-visited` when JavaScript runs.
- **Objective:** The list reads as the map's legend and shows where each project sits; the page works
  without JavaScript.
- **Estimate:** 6 h

### P4. Overview (`/overview/`) as the field log in text
- **Description:** Each section is a location: the section head becomes a location tag (diamond,
  "02 · Field Station", h2) per D4, with the landmark's accent on its cards (About = station, Projects =
  each tile its own accent, Lab = lab, Activities = guild, Experience = station, Contact = mast) and an
  "On the map →" link (`/#station`, `/#lab`, …). Cards move from umber offset to accent offset (`.tag`);
  the activities timeline dots become diamonds; ProjectTile's WinBar becomes the map label over the
  cover; the hero's `.brutal-note` and spec grid become `.hud-panel`s. The Telegraph cabinet and the
  contact terminal keep their CRT chrome (D5) in their landmark accents. Scroll choreography stays,
  minus the numeral scrub if D4 drops the big numerals.
- **Objective:** The overview is visibly the text twin of the map: same accents, same labels, same
  order; every section links to its place; the no-JS and keyboard checks still pass.
- **Estimate:** 8 h

### P5. 404 as the uncharted tile
- **Description:** Use the map's uncharted marker (dashed border, italic title, no offset) for the
  "This tile isn't on the grid." card, with a small static minimap (from P3) and keys to the map, the
  overview and the projects.
- **Objective:** The error page belongs to the same world and offers the three ways back.
- **Estimate:** 1.5 h

### P6. Style guide: the field kit
- **Description:** Add a section to `/style-guide/` that renders the kit: a label, the uncharted
  marker, an eyebrow in every location accent, the diamond list and field log, the meta row, a
  `.hud-panel`, the segmented control and a drawer specimen, on each theme, plus the location accent
  contrast rows from F2.
- **Objective:** The style guide documents what the pages now use; a regression shows up there first.
- **Estimate:** 3 h

### P7. Shared pieces that also live on the map
- **Description:** TelegraphMiniGame, PopupCRT, ShoveLab and SignalStamp move their hardcoded colours to
  tokens (PopupCRT's backdrop is already `--backdrop`), take `--acc` from where they sit (the Lab accent
  on the map and on the overview; Push Comes to Shove's accent for ShoveLab on its write-up). Prism.astro
  reads the `--prism-*` tokens; Figure's frame reads `--surface`/`--bg`.
- **Objective:** The cabinet looks the same in the Lab overlay and on the overview; no hex left in
  components (a test greps `src/components` for `#[0-9a-f]{3,6}` outside tokens).
- **Estimate:** 5 h

## Phase 2 — clean-up and proof

### C1. Dead code and stale notes
- **Description:** Delete `SignalLanding.astro` (D6) and its CSS, fix the comments that still say
  "index.astro adds .is-stuck" (base.css) and "home page's bento" (ProjectTile), drop WinBar's
  ProjectRow use if D5 removes it, and remove the base.css helpers no page uses after Phase 1.
- **Objective:** Nothing in `src/` is unused; `astro check` 0 errors.
- **Estimate:** 1.5 h

### C2. Verification
- **Description:** `npm test`, `astro check`, `npm run build`, `tools/check-links.mjs`, every
  `tools/check-browser.cjs` check (layouts × themes × widths, contrast, no-JS, keyboard, motion, world),
  axe-core and the keyboard walk on every page, the phone trace on the S20 FE for the map-lit field (F5),
  and before/after screenshots of every page in all four themes for the owner.
- **Objective:** Same or better scores than the 2026-11-02 audit; the owner reviews the screenshots
  before anything is pushed to `main`.
- **Estimate:** 5 h

### C3. Docs
- **Description:** Update `CLAUDE.md` (the field-kit seam, location tokens, breakpoints, the map-lit
  field), `docs/design-system.md`, `GLOSSARY.md` (Field kit, Location bar, Location accent) and the
  design-system artifact's `tokens.json`.
- **Objective:** The next session finds the new rules without reading the CSS.
- **Estimate:** 1.5 h

## Order and total

F0 → F1 → F2 → F3 come first (everything depends on them); F4 and F5 can run beside P1–P7 because they
touch different files; F6/F7 before P1. P2 needs P1. P5 needs P3's minimap. C1–C3 last.

| Phase | Tasks | Hours |
|---|---|---|
| 0 Foundations | F0–F7 | 28 |
| 1 Pages | P1–P7 | 36.5 |
| 2 Clean-up and proof | C1–C3 | 8 |
| **Total** | | **72.5** |

With D1 = A (keep the signal field), drop F5 (−6 h). With D3 = keep the brutal cards, P1/P3/P4 shrink by
about a third (≈ −8 h).

Out of scope: the CV (`docs/cv/cv-en.html` is a print document with its own type and blue accent) and
the Unity games themselves.
