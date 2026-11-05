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

**Answered 2026-11-04: the owner accepted all six recommendations** (D1 = B, D2 yes, D3 the label chrome
everywhere, D4 location tags, D5 replace WinBar on the projects index, D6 delete). The plan below
therefore keeps F5 and the full P1/P3/P4 estimates.

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
- **Status:** Done on 2026-11-04. B1 had already been fixed with the review fixes (0ed6f96), so F0 was the
  footer, the keys and the duplicate block.

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
- **Status:** Done on 2026-11-04. The proof was a computed-style diff in place of screenshots (the map
  moves): 22 states (start, map, Dev Mode, three panels, the Lab; Paper and Prism at 1440 px, Prism at
  390 px with the log open), labels measured as clones at rest and near. The one difference is
  intended: the open phone log keeps a gap between its rows, which F0's keys needed. `--panel` is
  defined in the kit until F2 moves it to the tokens; the map's label is `.world-label.tag`, the
  free slot `.tag.uncharted`.

### F2. Accent and panel tokens
- **Description:** Add to `design/tokens.json` (and the design-system artifact copy): `panel` (the
  translucent ground, per theme), `acc-ink-mix` (the 60 % pull), `acc-offset` (2px), the four landmark
  accents (`loc-station`, `loc-lab`, `loc-guild`, `loc-mast`) per theme so Field Station's cream border
  reads on Paper, and the map's state colours (AI tags, the pass badge, `--sky` for Dev Mode). Regenerate
  with `node tools/build-tokens.mjs`; `World.astro` reads landmark accents from tokens instead of hex.
- **Objective:** No hex in `World.astro` or `world.css`; every accent passes 3:1 for borders and 4.5:1
  for eyebrow text on all four themes (checked by the contrast table the style guide already builds).
- **Estimate:** 3 h
- **Status:** Done on 2026-11-04, with one change of shape. A location keeps one accent (the 3D world and
  the minimap need a single colour), so the per-theme part is not four landmark colours but how any
  accent is drawn: a themed `accent` family (`acc-tone` 100 % / Paper 45 %, `acc-edge` 70 % / Paper
  85 %, `acc-ink` 60 %, `acc-offset` 2px) that the kit applies through `--acc-ui`. `loc-*` hold the
  landmark accents, plus `panel`, `ink-black`, `world-ground`, `ai-*` and `pass*`. The style guide's
  new "Location accents" table and `tests/accents.test.ts` check all nine accents in all four themes
  (lowest: 3.2:1 border and 7.3:1 eyebrow on Paper, 3.5:1 border on the dark themes); the test also fails
  on any hex in `World.astro`, `world.css` or `field-kit.css`. Visible change: tag borders went from
  55 % to 70 % on the dark themes; on Paper the eyebrows, borders and diamonds are now readable. The
  design-system artifact's `tokens.json` matches `design/tokens.json` again (version 19).

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
- **Status:** Done on 2026-11-04. `src/data/locations.ts` holds `LANDMARKS` (title, eyebrow, `loc-*`
  accent, slot, overview anchor, nav word), `buildLocations(projects)`, the seed adapters for the map and
  `NAV` (site.ts no longer lists the nav). `src/lib/project-view.ts` is the one status / period / live
  link; the map panel, `ProjectTile`, `ProjectRow` and the write-up page use it. `World.astro` builds
  its seeds and panels from both; the map's embedded data is unchanged. `tests/locations.test.ts` pins
  order, hrefs, map links, one location per project file (through `buildLayout`), a landmark id clash,
  that every landmark anchor exists on the overview, the nav, and the project view. Visible wording:
  the tile and row pills read "▶ Play on itch.io" / "↓ Download on GitHub" (sentence case, as on the
  map and the write-up), and Eternity Keeper's write-up button "↓ Download on GitHub (Windows)". Not
  done here: the overview, the projects index and the write-up pages don't show their location yet
  (no map link, no accent); that is F7 (location bar) and P1–P4.

### F4. Three breakpoints
- **Description:** Replace the fourteen widths with three named ones in the token file (`wide` ≥ 981,
  `mid` ≤ 760, `narrow` ≤ 420; the map already uses 760) and move each component's queries onto them.
  Astro CSS cannot read custom properties in media queries, so the generator emits them as comments +
  a `breakpoints.ts` export, and a test greps the `.astro`/`.css` files for any other width.
- **Objective:** The pages and the map change layout at the same widths; `check-browser` layouts pass at
  320/375/640/768/1440 on all themes.
- **Estimate:** 3 h
- **Status:** Done on 2026-11-04. `design/tokens.json` has a `breakpoint` family (`bp-wide` 981px,
  `bp-mid` 760px, `bp-narrow` 420px); `tools/build-tokens.mjs` writes the five queries as a comment at
  the top of `tokens.css` and as `MEDIA` in `src/scripts/generated/breakpoints.ts` (`wide`, `belowWide`,
  `mid`, `aboveMid`, `narrow`). `tests/breakpoints.test.ts` allows no other width query in the
  `.css`/`.astro` files and no width number in scripts (`matchMedia` literals, `innerWidth < N`);
  `prefs-boot.test.ts` checks the generated file is current. Every query moved **up** to the next
  breakpoint (900/860/960 → 980; 700/680/640/600/580/560/540/520 → 760; 419 → 420), so nothing
  collapses later than before. Visible: the write-up split, the sticky Projects head bar and the
  two-column layouts start at 981px (were 861px), the compact phone rules start at 760px (the overview
  facts panel, popup, tiles and mini-game stack at 541–760 now). `Nav.astro`, `NotesExplorer` and the
  map's `boot.ts` read `MEDIA`; the map's phone test was `innerWidth < 760`, off by one from its own
  CSS at exactly 760px. A sweep at 440–980px found no horizontal overflow; `check-browser` world,
  layouts, motion, contrast, theme, nojs, anchors, keyboard and feedback pass.

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
- **Status:** Done on 2026-11-04. `src/world/daylight.ts` is the pure part (the key table as hex,
  `poznanHour`, `fmtHour`, `phaseName`, `keysAround`, `fieldPalette`); `light.ts` wraps the same table
  in THREE colours, so the map's lighting is unchanged, and the HUD (`boot.ts`) reads the clock from
  `daylight.ts`. The five stops are sun, the path tile in that sunlight (dimmed at night), ground,
  water and fog, in the ramp's bright / warm / dark / dark / mid order (the hour table has no grass or
  path colour of its own: ground is the hemisphere ground colour). "Map-styled" became a theme switch
  in a new themed `field` token family: `field-map` 1 in Prism and Paper, 0 in CRT and Signal (their
  field colours are what makes those themes; one value flips each). The map's daytime sun is far
  lighter than any theme stop, so map-lit themes draw the lane at `field-map-lane` (Prism 0.13, Paper
  0.15) instead of `field-lane` 0.20. `field.ts` re-samples every 5 minutes and eases like a theme
  change. The no-WebGL body gradient reads generated `--field-fallback-1..5` (the noon palette in
  map-lit themes, `field-1..5` otherwise). Checks: `tests/field-lane.test.ts` bounds the lane by the
  stops (`src/lib/field-lane.ts`) in every theme at every quarter hour, the new `check-browser` `field`
  check measures the rendered still frame at night, dawn, day and dusk in all four themes (worst 4.9:1;
  a 0.35 lane fails it), and the other nine checks pass. Found and fixed right after (2026-11-04): without WebGL or
  JavaScript the hero text sat on the fallback backdrop and fell under WCAG minimums — the prism band
  behind it (retired), no lane in the body gradient (now a CSS lane layer at `--field-fallback-lane`,
  which also covers the brighter noon palette in Prism) and a dark vignette on Paper (a themed
  `vignette` token, transparent on Paper). The `nojs` check now measures the hero lines on four pages.

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
- **Status:** Done on 2026-11-05. `Nav.astro` sits on the `panel` ground with a hairline (the drawer
  too); the theme, motion, menu and CV keys take the new field-kit `.hud-key` (mono 11.5px, the map's
  keys use it as well, `.world-key` keeps only its pressed colours). The Map link points at
  `mapHrefFor(body[data-location])` — Base's new `location` prop, set by every write-up — and on the
  overview at the landmark of the section in view (the scroll-spy reads its sections as data, so no
  location list ships to the client); Projects now opens `/projects/` and is current on the index and
  on every write-up. The footer's first row is the status line "Poznań 08:22 · Day · 3/8 explored ·
  Style guide" (`src/lib/status-line.ts`, the field log's count over `buildLocations`, re-read every
  30 s, hidden without JavaScript); the second row keeps the © line and the GitHub / YouTube / email
  links, so text pages still carry the contact links. The `nav-bg` token stays for the design-system
  artifact's nav component; the site no longer reads it. Checks: `tests/status-line.test.ts`, the nav
  cases in `tests/locations.test.ts`, and two new `check-browser` checks — `nav` (Map link per write-up
  and per overview section, Projects current, the nav element survives a client-side move, key sizes
  match the map's, the status line reads) and `bundle` (no script fetched by the eight text pages
  contains three.js, and some chunk does); the other ten checks and the link check pass.

### F7. Location bar
- **Description:** A `LocationBar.astro` for the top of every page under the nav: a diamond in the
  location's accent, the eyebrow ("Location 03 · 2D dungeon crawler"), "← Back to the map" (`/#<id>`)
  and, where it applies, "All projects". It replaces the `.kicker` back link on write-ups and the
  section kicker on the projects index.
- **Objective:** Every page says where on the map it is and gets back there in one click.
- **Estimate:** 2 h
- **Status:** Done on 2026-11-05. `src/components/LocationBar.astro` is rendered by `Base.astro` at the
  top of `<main>` on every text page (not on the map). A write-up passes `location` and gets its
  accent diamond, "Location 03 · 2D dungeon crawler / roguelite" (`locationEyebrow` in
  `src/data/locations.ts`: the project's number in the projects' order, the same number as the tiles
  and the index rows) and "← Back to the map" to `/#<id>`; the other pages pass `place` (projects
  index "Projects · 4 locations on the map", overview, 404, style guide) and go back to `/`. "All
  projects" shows on every page but the index. It replaced the write-up's "← Projects" kicker, the
  404's kicker and the style guide's "← Portfolio Home" link; the hero tops were tightened (96 → 56px,
  phones 64 → 32px). The projects index had no section kicker to replace. Checks: a `locationEyebrow`
  test, the `nav` check reads the bar's line and links, the `nojs` check measures the bar's text — and
  its shared `groundContrast` now reads `color(srgb …)` inks (what `color-mix()` computes to) in
  0–1, which it had read as near-black.

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
- **Status:** Done on 2026-11-05. `Base.astro` looks up the page's location and sets its accent on
  `<main class="accent">`, so every descendant reads the toned `--acc-ui` (the location bar no longer sets
  its own). Hero: the drawer's `.meta-row` (status pill, period, engine, role — role kept, it was in the
  old meta line) and the metrics as `.tag` labels; no separate eyebrow, because the location bar right
  above already reads "Location 0N · genre". "What I built" is a `.diamond-list`; the sidebar box, the
  changelog, the gallery and the credits table are `.hud-panel`s; the CRT switch is a `.key.hud-key`
  (the hand-rolled `.crt-toggle-btn` and the box's tilt are gone); release-note H4s take the accent ink.
  `Figure.astro` frames take the label chrome (accent border + hard offset on `ink-black`) instead of
  the Prism gradient and rainbow glow — on every page that uses Figure, so the projects index rows get
  coral frames until P3. NotesExplorer: a `.diamond` per note in its bar, filled once read in this visit,
  and "n/N notes" in the head, now shown in the split layout too (the count used to update only on
  clicks; the scroll observer now updates it); the explore pane is a panel with a hairline. Checks: the
  `nav` check asserts the accent on `<main>`, the label metrics, the HUD sidebar and the note marks;
  `nojs` measures `.meta-row`; `tests/write-ups.test.ts` and all twelve browser checks pass.

### P2. Drawer → write-up transition
- **Description:** Give the drawer's title, clip and eyebrow the same `transition:name`s as the write-up
  hero (`title-<id>`, `cover-<id>`), so "Read the write-up" morphs the panel into the page; the map's
  canvas fades under the CRT power-cycle. Going back (`/#<id>`) reopens the drawer at that location
  (the deep link exists in `World.astro:238`).
- **Objective:** Map → write-up → map feels like one place; under reduced motion it is an instant swap.
- **Estimate:** 3 h
- **Status:** Done on 2026-11-05. The project panels in `World.astro` carry `eyebrow-<id>`, `title-<id>`
  and `cover-<id>` on their genre line, h2 and clip (video or image); the write-up pairs them with the
  location bar's line (new `eyebrow-<id>`), its h1 and its cover. The map's canvas fades with the root
  power-cycle (no extra rule needed). Found while testing: a visitor scrolls the drawer to reach "Read the
  write-up", and a named element scrolled out of the drawer is still captured, so the title flew in from
  above the screen; `boot.ts` now sets `view-transition-name: none` on any named part outside the
  drawer's visible box when a write-up link is clicked (before the router's own click handler), and it
  arrives with the page. Coming back: `/#<id>` already reopened the drawer; `begin()` now skips the
  render-pass montage on a deep link, so the drawer opens at once. Reduced motion: the existing
  `motion.css` rules zero every view-transition animation. Check: `check-browser` `morph` — the three
  groups animate from a panel at the top, only the clip from a panel scrolled to the link, and "Back to
  the map" reopens the drawer without the montage; the other twelve checks pass.

### P3. Projects index (`/projects/`) as the location index
- **Description:** Replace ProjectRow's WinBar card with the map label grown into a row: accent border
  and offset, eyebrow, Fraunces title, the diamond list of highlights, keys; the big brick numeral
  becomes the eyebrow's "Location 0n". Above the list, a static SVG minimap generated at build time from
  `gen.ts` slot positions (no three.js): diamonds at each project's slot in its accent, each a link to the
  row and to `/#<id>`; visited ones filled from `portfolio-world-visited` when JavaScript runs.
- **Objective:** The list reads as the map's legend and shows where each project sits; the page works
  without JavaScript.
- **Estimate:** 6 h
- **Status:** Done on 2026-11-05. `ProjectRow.astro` is an `article.loc-row.tag` (accent border + hard
  offset) with the place's line ("Location 0N · genre" from `locationEyebrow`, the same as the location
  bar) and its explored diamond, the Fraunces title (h2 now, under the page's h1), the meta row, the
  summary, the highlights as a `.diamond-list` and glass keys (Play, Read the write-up, On the map
  `/#<id>`, Source); WinBar, the brick numeral, the kind tag and the metric chips are gone from the index
  (the metrics stay on the write-up). The row's id is the place id. `src/lib/minimap.ts` builds the
  minimap at build time from `buildLayout` + `generate` — land and path tiles as merged row runs
  (102×85 tiles, ~4.6 KB of path) — and `LocationMap.astro` draws it as an SVG under HTML markers in
  percent: project diamonds link to their rows and carry their titles (labels toward the middle on
  wide screens, centred under the diamond on phones), landmarks are small diamonds, the uncharted slot
  is dashed; with JavaScript the places in `portfolio-world-visited` fill. On wide screens the page
  title sits beside the map. Found on the way: no `.sr-only` class existed, so the map's field log
  showed its "(visited)" text on screen; `base.css` has it now. Checks: `tests/minimap.test.ts` (the
  runs cover exactly the generated land and path tiles, every place inside the map, label sides), the
  `nav` check reads the legend (minimap links = rows, the place lines, On the map links, the explored
  Lab filled); all thirteen browser checks pass.

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
