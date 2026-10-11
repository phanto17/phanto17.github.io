# Design system — "Prism" (direction B, revised)

Extracted on 2026-10-11 from the 11 images in `references/` (grainy film photographs and
illustrations: near-black warm backgrounds, silhouettes, blurred rainbow light-leak bands).
Colours come from pixel sampling (darkest 20 %, brightest 5 %, most saturated 5 % per image,
plus a 10-cluster k-means over all images). Everything below is implemented in
`mockups/direction-B-prism.html`.

## 1. Mood

Dark room, warm film grain, one band of prism light. Editorial "field notes" structure (direction B)
kept: numbered projects, figures with captions, margin notes, pull quotes. Glow is used sparingly:
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
| `--text-3` | `#8a7a66` | — | captions, disabled |
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

### Glow
`text-shadow: 0 0 14px rgba(242,124,82,.55), 0 0 48px rgba(242,177,128,.28)` on the H1 and the
primary button; a lighter `0 0 24px rgba(242,124,82,.25)` on H2.

### Grain
Fixed full-page SVG `feTurbulence` (fractalNoise, baseFrequency .9, 3 octaves), `opacity .14`,
`mix-blend-mode: soft-light`. Plus a radial vignette to `--bg-0` at the edges.

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
- Container: max-width **1040 px**, side gutter **24 px** (16 px under 860 px).
- Section padding: **80 px** top/bottom (56 px mobile); hero 112 / 80 (80 / 56 mobile).
- Grid gaps: 48 px between columns (two-column), 28 px inside project rows, 20–40 px timeline.
- Stack rhythm inside text: 16 px between paragraphs, 6 px heading → subheading, 32 px subheading → content.
- Card / panel padding: 16 px (aside box), 24 px (preview panel).
- Buttons: 12 px × 20 px; pills: 4 px × 10 px.
- Project rows: 32 px vertical padding, 1 px divider.

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
- Prism band: optional slow drift (`transform` over 40 s) — **disabled under
  `prefers-reduced-motion`**, as is every transition.
- No parallax, no autoplaying video with sound.

## 7. Imagery rules

Screenshots/GIFs sit in `--r-md` frames on `--surface` with a 1 px `--umber` border and a faint
prism smear at the bottom edge. Captions in DM Mono below ("Fig. 1 — …").
