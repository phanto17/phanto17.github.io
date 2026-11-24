# Design system — "Prism" (direction B, revised)

Extracted on 2026-10-11 from the 11 images in `references/` (grainy film photographs and
illustrations: near-black warm backgrounds, silhouettes, blurred rainbow light-leak bands).
Colours come from pixel sampling (darkest 20 %, brightest 5 %, most saturated 5 % per image,
plus a 10-cluster k-means over all images). Everything below is implemented in
`mockups/direction-B-prism.html`.


> **Since 2026-10-29 the values are generated.** `design/tokens.json` (a copy of the Prism CRT design system's token file) is compiled by `node tools/build-tokens.mjs` into `src/styles/tokens.css`, which `global.css` imports; the theme blocks are no longer hand-written. The tables below describe the Prism theme; the token file is authoritative for all four (Prism, Paper, CRT, Signal). It was checked byte-identical to the design-system artifact's `project/tokens.json` on 2026-11-06.

## 1. Mood

Dark room, warm film grain, and the signal field as the light (§6c; until 2026-10-29 one band of prism light).
Editorial "field notes" structure (direction B) kept: numbered locations, figures with captions, margin notes,
pull quotes. Glow is used sparingly:
headline, primary button, hover states. Everything else is matte.

## 2. Colour palette (hex)

### Backgrounds
| Token | Hex | Source | Use |
|---|---|---|---|
| `--bg-0` | `#0b070b` | darkest cluster (vignette edges) | page vignette, deepest shadow |
| `--bg` | `#1a1713` | 15 % cluster, dark means `#151415`–`#1a1713` | page background |
| `--surface` | `#2f291b` | 31 % cluster (largest) | cards, panels, code blocks |
| `--surface-2` | `#3a3224` | lightened surface | hover / raised panels |
| `--umber` | `#5d412b` | 8.7 % cluster | borders, dividers, numerals |

### Text
| Token | Hex | Source | Use |
|---|---|---|---|
| `--text` | `#f3e6d3` | bright means `#f9e7ca`, `#fce7ce` | headings, body |
| `--text-2` | `#b9a68f` | darkened cream | secondary body, leads |
| `--text-3` | `#a79a88` | — | captions, disabled (raised from `#8a7a66` on 2026-10-16 to pass WCAG AA: 6.5 / 5.2 / 4.6 on bg / surface / raised) |
| `--steel` | `#979ca4` | 5.4 % cluster (cool grey in the blue band) | metadata, mono labels |

### Accents
| Token | Hex | Source | Use |
|---|---|---|---|
| `--coral` | `#f27c52` | 10.3 % cluster | primary accent: links, CTA, glow colour |
| `--peach` | `#f2b180` | 9.7 % cluster | hover, italic emphasis |
| `--gold` | `#f6d370` | bright of flowers image | eyebrows, dates, highlights |
| `--brick` | `#a95c3d` | 6.8 % cluster | muted accent, quote rules |
| `--teal` | `#4e6367` | 4.2 % cluster | deep cool accent (rare) |

### Prism band (gradient stops, in order)
`#e95c3a` → `#f27c52` → `#f6d370` → `#9fd3a8` → `#8fc3df` → `#cab5ce` → `#faa193`
Rendered as a rotated, heavily blurred (28–40 px) linear gradient at 35–75 % opacity, one per hero
and at most one per page section. Never behind body text at full opacity.
**Retired on the site 2026-11-04:** the signal field replaced the band on 2026-10-29, and where the
field cannot run the band still sat behind the hero title and lead, washing them out (measured below
WCAG minimums on every page that had one). The stops remain the design system's (OG images, the
artifact's PrismBand component).

### Glow
`text-shadow: 0 0 14px rgba(242,124,82,.55), 0 0 48px rgba(242,177,128,.28)` on the H1 and the
primary button; a lighter `0 0 24px rgba(242,124,82,.25)` on H2.

### Grain
Fixed full-page SVG `feTurbulence` (fractalNoise, baseFrequency .9, 3 octaves), `opacity .14`,
`mix-blend-mode: soft-light`. Plus a radial vignette to `--bg-0` at the edges (the themed `vignette` token since 2026-11-04: none on Paper, where it darkened text on phones).

Contrast check (WCAG): `--text` on `--bg` ≈ 14.5:1; `--text-2` on `--bg` ≈ 8:1; `--coral` on
`--bg` ≈ 6.4:1; `#1a1713` text on `--coral` button ≈ 6.4:1. All pass AA for body text.

## 3. Typography

Fonts (Google Fonts, all open licences):
- **Display: Fraunces** (variable; axes `opsz 9–144`, `wght 400–700`, `SOFT 100`, `WONK 1`). At
  `SOFT 100` it becomes a soft, rounded 70s serif (Cooper/Windsor feel) — the vintage glow look.
- **Body: DM Sans** (variable, `opsz 9–40`, `wght 400–600`). Neutral geometric, reads well on dark.
- **Mono: DM Mono** 400/500 for eyebrows, dates, captions, metadata.

Scale (desktop → mobile):
| Role | Family / weight | Size | Line-height | Extras |
|---|---|---|---|---|
| H1 hero | Fraunces 600, SOFT 100, WONK 1, opsz 144 | `clamp(44px, 6.6vw, 80px)` | 0.98 | letter-spacing −.015em, glow |
| H2 section | Fraunces 600, SOFT 100 | 36px → 30px | 1.1 | light glow |
| H3 project title | Fraunces 600, SOFT 100 | 30px → 26px | 1.15 | |
| H4 timeline | Fraunces 600 | 22px | 1.2 | |
| Pull quote / margin note | Fraunces italic 400, SOFT 60 | 17–19px | 1.5 | colour `--lavender` |
| Lead | DM Sans 400 | 19px | 1.55 | colour `--text-2` |
| Body | DM Sans 400 | 17px → 16px | 1.6 | |
| Small / captions | DM Mono 400 | 11–12px | 1.4 | |
| Eyebrow / labels | DM Mono 400 | 12px, uppercase, tracking .12–.14em | — | colour `--gold` or `--steel` |
| Buttons | DM Sans 500 | 15px | — | pill |

## 4. Spacing

8 px base unit.
- Container: max-width **1040 px**, side gutter **24 px** (16 px at 980 px and below).
- Section padding: **80 px** top/bottom (56 px mobile); hero 112 / 80 (80 / 56 mobile).
- Grid gaps: 48 px between columns (two-column), 28 px inside project rows, 20–40 px timeline.
- Stack rhythm inside text: 16 px between paragraphs, 6 px heading → subheading, 32 px subheading → content.
- Card / panel padding: 16 px (aside box), 24 px (preview panel).
- Buttons: 12 px × 20 px; pills: 4 px × 10 px.
- Project rows: 32 px vertical padding, 1 px divider.

### Breakpoints (2026-11-04)
Three widths in the token file, `bp-wide` 981, `bp-mid` 760 and `bp-narrow` 420, written as five queries:

| Name | Query |
|---|---|
| wide | `(min-width: 981px)` |
| belowWide | `(max-width: 980px)` |
| mid | `(max-width: 760px)` |
| aboveMid | `(min-width: 761px)` |
| narrow | `(max-width: 420px)` |

CSS writes the queries literally, because media queries cannot read custom properties (the list heads
`tokens.css`). Scripts use `MEDIA` from the generated `src/scripts/generated/breakpoints.ts`.
`tests/breakpoints.test.ts` rejects any other width.

## 5. Radii

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 6 px | inline tags, code |
| `--r-sm` | 10 px | inputs, small chips |
| `--r-md` | 16 px | figures, media, aside boxes |
| `--r-lg` | 24 px | large panels (subpage sidebar, preview) |
| `--r-pill` | 999 px | buttons, pills |

## 6. Motion

- Hover: translateY(−1…−3 px) + glow box-shadow, 200–250 ms ease.
- Prism band (retired on the site 2026-11-04): slow drift (`transform` over 28 s), paused offscreen
  and disabled under `prefers-reduced-motion` or the site motion setting, as is every transition.
- Page transitions (2026-10-29): Astro's ClientRouter with a CRT power-cycle root animation (160ms out, 420ms in),
  project covers and titles morphing into the subpage hero (`transition:name`), nav / signal field / reticle persisted.
  A theme change cross-fades colours for one lift and flickers the page once (360ms); the `theme-color` meta follows
  the theme. Stage deep links: `/#lab?stage=<id>`. The click ripple and the opt-in click sound answer every control.
- Scroll choreography (2026-10-29): the Projects head bar is sticky under the nav on wide screens and timeline
  cards tip up on entry (the section numerals and their scrub went on 2026-11-05). Lenis smooths scrolling on
  desktop only, behind the motion switch (2026-11-02). Project write-ups show their technical breakdown as
  notes in a sticky split (below), with a "Read as one page" switch.
- No parallax, no autoplaying video with sound.

The site offers Prism, Paper and CRT themes. `--action-text` supplies readable link text
and `--on-accent` supplies text on primary buttons; both change with the theme. Verify
foreground and background pairs in each state rather than assuming the Prism ratios
apply to all themes. The manual-cue option in Telegraph Recall lets players advance
each signal at their own pace, and game sound starts off.

A fourth theme, **Signal** (plum night `#0d0a14`, the glass keys' cyan `#5fd7ff` and magenta `#ff4fa3` as accents),
is hidden until Telegraph Recall is cleared in that browser; the theme key then cycles into it after CRT
(2026-11-01, `src/scripts/signal-reward.ts`). Its inks keep the same ≥ 4.5:1 rule on `bg` and `surface`.

Since 2026-11-02 sub-heads, eyebrows and the hero lead decode from scrambled glyphs (left to right, the
real text kept as the accessible name), every section of the overview is its own module (dossier, bento,
expandable cards, terminal) and project write-ups read as a sticky split at 981px and up (steps left, a pinned
visual per step right, the shove lab on Push Comes to Shove). All of it stops or flattens under reduced motion.
A waiting note recedes in tone (`--text-3` on its prose), never in `opacity`, which took inline code under
4.5:1 (2026-11-06).

## 6b. The field map (home, 2026-11-03)

The 3D world keeps its own light (a teal-green island at night, sunlit by day, following Poznań
time), while every piece of interface on it uses the tokens: panels are the `panel` token (the
theme's ground at 84 %), hairlines `--hairline`, labels DM Mono uppercase, titles Fraunces. Controls are
the site's glass keys; Dev Mode is edged in `--sky`. Motion off = still dioramas and no camera bob; the
drawer and start screen drop their transitions. The map's own colours are tokens too (`world-ground`,
`ink-black`, `ai-*`, `pass*`).

## 6c. The field kit and location accents (2026-11-04 → 2026-11-05)

Since the map style work every text page speaks the map's vocabulary. `field-kit.css` is the seam: a page
uses its classes, `world.css` only places them. `/style-guide/#field-kit` renders each class on every theme.

| Class | What it is |
|---|---|
| `.tag`, `.tag-title` | a map label: translucent `panel` ground, accent border, hard accent offset; its display-type title |
| `.eyebrow` | mono uppercase line in the accent pulled toward the text colour |
| `.diamond`, `.diamond-list` | the location bullet (`.is-done` fills it); a list with filled diamonds |
| `.hud-panel` | a hairline panel on the translucent ground |
| `.hud-key` | the HUD's key size: mono 11.5 px on a glass key |
| `.seg` | a row of keys where one is on (`aria-pressed` / `aria-selected`) |
| `.uncharted` | on a tag, a place that is not there yet: dashed, no offset, italic title |
| `.meta-row` | a line of pills and mono facts |
| `.accent` | any other element whose own CSS draws with the accent |

**One accent per location:**

| Location | Accent | Source |
|---|---|---|
| Horde Hours | coral `#f27c52` | `world.accent` in its Markdown |
| Push Comes to Shove | mint `#7fd6c2` | `world.accent` |
| Cinderhold | red `#ff5d4a` | `world.accent` |
| Eternity Keeper | gold `#f6d370` | `world.accent` |
| Field Station | cream `#f3e6d3` | token `loc-station` |
| The Lab | sky `#7fd6ff` | token `loc-lab` |
| Guild Hall | lavender `#c6a8ff` | token `loc-guild` |
| Radio Mast | coral `#f27c52` | token `loc-mast` |
| the free slot | `#8fb5a6` | `UNCHARTED_ACCENT` in `gen.ts` |

The 3D world and the minimap use an accent as it is. The interface tones it per theme, because a colour that
reads on the night island may not read on Paper:

```
--acc-ui   = --acc mixed with --text, keeping --acc-tone of the accent   borders, rules, glows
--acc-text = --acc-ui mixed with --text, keeping --acc-ink of it         type
```

`acc-tone` is 100 % except on Paper (45 %); `acc-edge` is the border's opacity (70 % or 85 %), `acc-ink` 60 %,
`acc-offset` 2 px. `src/lib/accents.ts` does the same mixes in numbers, and `tests/accents.test.ts` holds every
location to 4.5:1 eyebrows and 3:1 borders in every theme. The unset accent is coral.

**Where the kit shows:** the nav is the map's HUD bar on every page, the footer's first row is the status line,
the location bar sits under the nav, the overview's section heads are `LocationHead`, write-ups are location
dossiers, the projects index is a location index beside the drawn map, the 404 is the uncharted tile. The
Telegraph cabinet and the shared pieces draw their chrome with `--acc-ui` and `--acc-text` (game states keep
their own tokens). `Figure` frames carry the accent, with no prism gradient or rainbow glow.

## 6d. The signal field and the map-lit palette

The background of every text page is the signal field (`src/scripts/field.ts`, WebGL, loaded lazily after the
page): a grainy, slowly drifting colour field of five stops that reacts to the cursor. It is mixed toward `bg`
by the `field-lane` share under the content column and `field-edge` at the edges, with no cursor bloom in the
lane, so page text keeps 4.5:1. Reduced motion gives one still frame. Without JavaScript, WebGL or with data
saver on, `body` shows a static CSS gradient of the same stops under a lane layer.

**Map-lit (2026-11-04):** in themes with the `field` token `field-map` at 1 (Prism, Paper), the five stops are the
field map at the current Poznań hour, from `src/world/daylight.ts` `fieldPalette`: sun, lit path, ground, water,
fog. They are re-sampled every 5 minutes, and `field-map-lane` replaces the lane share (Prism 0.13, Paper 0.15).
CRT and Signal keep their own colours. The static fallback reads the generated `--field-fallback-1..5` (the map
at noon) and `--field-fallback-lane`. The edge vignette is the themed `vignette` token, none on Paper.
`tests/field-lane.test.ts` and the browser checks `field` and `nojs` hold text at 4.5:1 at every hour.

## 7. Imagery rules & CRT viewport

Screenshots/GIFs sit in `--r-md` frames (`Figure.astro`) in the location's accent label chrome (§6c; the prism
smear at the bottom edge went on 2026-11-05), with a subtle `.crt-frame` scanline + radial vignette overlay
(`--scanline-alpha: 0.2`) plus a `4px 4px 0` boxed-manual shadow (`--card-depth`). Captions in
DM Mono below ("Fig. 1 — …"). Fonts (`Fraunces`, `DM Sans`, `DM Mono`) are self-hosted in
`public/fonts/*.woff2` (`latin` + `latin-ext`) with `<link rel="preload">` on the primary weights.
