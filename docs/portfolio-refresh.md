# Portfolio refresh — Prism signal desk

The portfolio remains an Astro static site. Its first job is to show the role, playable
projects and CV quickly; Telegraph Recall is an optional demonstration, not a gate.

## Design kit

Use the existing self-hosted Fraunces for display, DM Sans for reading, and DM Mono for
short technical labels. Keep paragraphs under roughly 80 characters per line. The base
Prism tokens remain room `#1a1713`, shadow `#0b070b`, surface `#2f291b`, text
`#f3e6d3`, signal `#f27c52` and cue `#f6d370`. Use theme tokens for panel backgrounds
and text so the paper and CRT themes remain readable. Verify actual color combinations,
including translucent overlays, rather than treating token values as proof of contrast.

The hero leads with the exact CV title and links to projects, the game and the CV. Project
rows pair an image with a short contribution and a playable link. On a narrow screen the
image and copy stack in reading order. The signal desk holds the more theatrical CRT
effects; the rest of the portfolio keeps motion in service of navigation and feedback.

## Telegraph Recall

The introduction has three scenes: welcome, signal preview and game introduction.
Visitors may skip between scenes and explore the related project notes in any order.
The board grows from three cues to seven across five waves; the player gets one replay
hint. This is a game about observation, not a measurement of cognitive ability. Sound
starts off. Manual cue playback lets the player advance each signal at their own pace.
The engine lives in `src/scripts/telegraph-engine.ts`, browser interaction logic in
`src/scripts/telegraph-ui.ts`, and the interface markup in
`src/components/TelegraphMiniGame.astro`, `PopupCRT.astro`, `NonLinearLayout.astro`,
and `InteractivePanel.astro`.

To add a scene, extend `StageId`, add an ordered entry to `TELEGRAPH_STAGES` with its
label, title, subtitle, transition and `next` or `play` action, and add a matching
`data-stage-scene` article in `PopupCRT.astro`. Tabs, sequence numbers, previous/next
navigation and the first nine numeric shortcuts use that order. Add any scene-specific
start and cleanup behavior in `telegraph-ui.ts`; cancel timers when leaving or closing.
Game-state changes belong in the engine; browser events belong in the UI script. The
popup keeps its scene markup and transitions together, while exploratory notes use a
reusable panel.

## Accessibility review checklist

- Test all navigation and the game with keyboard and a screen reader, including dialog
  open, Escape, focus return, stage changes, board feedback, hint and restart.
- Check contrast in Prism, paper and CRT themes; use text or shape as well as color for
  meaningful game feedback.
- Test system reduced motion and the site motion setting during an active interaction.
  Motion should not obscure instructions or prevent the game from being completed.
- Verify at 320 px, phone, tablet and desktop widths, at 200% zoom, and on touch devices.
- Keep sound opt-in; never depend on audio to convey instructions or results.

## Local runbook

Run `npm install`, then `npm run dev` for development. Before release run
`npm run check`, `npm run build`, `node tools/verify-portfolio.mjs` and
`node tools/check-links.mjs`. The link checker requires network access for external links;
use `node tools/check-links.mjs --internal-only` when offline. Run
`node tools/test-check-links.mjs` to verify its relative-link and fragment detection.
For the optional automated browser regression checks, run `npm run test:browser` after
building. They require the `playwright` package and its Chromium browser, or an existing
Playwright package specified by `PLAYWRIGHT_MODULE` and a system Chrome or Chromium
executable specified by `CHROME_BIN`. The checks serve the built files through an isolated
test route and do not contact a deployed site. Set `PORTFOLIO_CAPTURE_DIR` to an existing
directory to save phone and desktop screenshots of the dialog in each theme for visual review.
The suite covers all built HTML pages at several viewport sizes, including a viewport
approximating 200% desktop zoom, as well as dialog focus, the five-wave game, hints,
restart, motion preferences and the script-free fallback. A keyboard-only game check
reads cue coordinates from the live status and exercises arrows, hint replay and retry.
To run one check, set `PORTFOLIO_BROWSER_CHECK` to its name (for example, `keyboard`).
Viewport emulation does not
replace testing actual browser zoom, touch devices or screen readers. An emulated touch
flow exercises the menu, notes, popup and game and checks selected 44×44 px targets.
Manually inspect the production build in representative browsers and devices. Record
performance measurements on a representative mobile device before and after changes;
targets are LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.1
at the 75th percentile when sufficient field data is available.

### Remaining manual verification

| Task | Description | Objective | Estimated hours |
|---|---|---|---:|
| Screen reader and keyboard | On Windows, use NVDA with Chrome or Edge; follow the sequence below. | Confirm spoken names, focus order and game feedback with assistive technology. | 1.5 |
| Browser zoom | At 200% and 400% zoom, check the home page, a project page and the game dialog. | Verify reflow, readable text and unobscured focus at actual browser zoom. | 1 |
| Touch device | On a phone, open the menu, change a theme, explore a note and play a turn. | Confirm touch targets, scrolling and feedback on physical hardware. | 1 |
| Mobile performance | Record a cold load and an interaction trace on a representative phone. | Investigate the observed long tasks and measure loading and responsiveness. | 1.5 |

For the screen-reader check, start at the skip link, navigate to the game, open the intro,
use the stage controls, close it with Escape and confirm focus returns to its launcher.
Turn on manual cues, start a turn, advance each cue and confirm its coordinates are
announced. Navigate the board with arrow keys, submit a cell, use the hint and retry
after a mistake. Check that status messages are understandable and that the popup keeps
keyboard focus. This is a manual protocol, not a claim that the test has already passed.

GitHub Actions publishes the static site when `main` is pushed. Commit and push only at
the owner's request. Analytics is optional and requires a separate tool and configuration;
the existing event dispatcher by itself does not collect analytics.

### Local asset-size baseline (2026-10-28)

The built homepage HTML measured 72,078 bytes (17,184 gzip); its two linked CSS files
totaled 38,606 bytes (8,506 gzip), and the linked Telegraph UI script measured 16,997
bytes (6,207 gzip). These figures exclude fonts, images, and inline scripts already
counted within HTML. Gzip was measured locally; hosting compression may differ. This is
an asset-size baseline, not a measurement of mobile LCP, INP, CLS or network transfer.

In three local Chromium runs at a 375×667 emulated viewport with 4× CPU throttling,
the homepage reported FCP of 540–952 ms, LCP of 1,016–1,244 ms and no observed layout
shifts during the test. Each run recorded four long tasks. Files were fulfilled from a
local test route without network latency, and INP was not measured. These figures are
diagnostics for this machine, not field data or evidence that mobile performance targets
are met; the long tasks warrant further profiling on a representative device.

With JavaScript disabled, the mobile navigation remains visible and the game displays a
fallback linking to the projects. The interactive board requires JavaScript.

### Phase 1 of the design-system plan (2026-10-29)

The tokens now come from the Prism CRT design system: `design/tokens.json` is a copy of its
token file and `node tools/build-tokens.mjs` compiles it to `src/styles/tokens.css`, which
`global.css` imports; the hand-written theme blocks are gone and `global.css` keeps four
aliases (`--display`, `--sans`, `--mono`, `--line`). The style guide page is generated from
the same file. Paper's hover colour (`peach`) changed from `#8f2d0c`, which equalled the link
colour, to `#a33311` (5.9:1 on `bg`, 5.2:1 on `surface`). The hero canvas now starts in
`requestIdleCallback` and the Telegraph Recall script loads when the lab section comes within
600px of the viewport, or on first pointer or focus in it.

Local asset sizes after Phase 1, same method as the baseline above: home HTML 71,865 bytes
(17,191 gzip); the two linked CSS files 42,975 bytes (9,561 gzip, up about 1 KB gzip for the
three generated theme blocks); eager script on the home page 2,031 bytes (1,020 gzip) instead
of the 16,997-byte (6,207 gzip) Telegraph script, which is now a lazy chunk of 17,075 bytes
(6,215 gzip). No mobile LCP, INP or CLS measurement was taken; the browser regression suite
needs the `playwright` package, which is not installed here, so it was not run.

### Phase 2, first two tasks (2026-10-29)

Hovered headings now grow (optical size 9, +0.02em tracking, scale 1.02 from the left) instead
of sharpening and tightening; the owner's rule is that hovered text expands, never shrinks.

GSAP 3.15 (ScrollTrigger, SplitText) is the motion toolkit, imported only in
`src/scripts/motion.ts`. `Base.astro` loads it after the `load` event when motion is allowed and
data saver is off, and again if the motion switch is turned on later. It takes over the elements
the CSS reveal observer has not shown yet (ScrollTrigger batch, token durations and staggers),
splits each section H2 into characters that rise when the heading enters the viewport (SplitText
`aria: "auto"` keeps the accessible name and reverts the split when done), and animates the stage-3
"Telegraph Recall" title character by character. Turning motion off reverts every split and
inline style and shows every reveal. A 250ms watchdog ticks GSAP by hand if
`requestAnimationFrame` stalls, so nothing it faded out can stay hidden. The hero keeps its
CSS-only kinetic words so the LCP element never waits for a script.

Sizes after this step: eager script on the home page 4.1 KB (1.6 KB gzip) in two small
bootstraps; the GSAP chunk 122 KB (48 KB gzip) and the Telegraph chunk 17 KB (6 KB gzip) load
lazily. Verified in the dev server: the chunk loads after `load`, headings and reveals complete,
the stage-3 title rises, motion off tears everything down. Not measured: mobile LCP, INP, CLS.
The built-in browser pane throttles `requestAnimationFrame` to about one frame per second, so
timing there is not representative; the watchdog is what let the checks complete.

### Restyle: signal field and glass keys (2026-10-29)

From three references the owner supplied (two grainy retro gradient fields in sunset orange,
red, black and teal and in orange, pink and peach; one glass "esc." keycap on black with
cyan/magenta refraction edges), the page background is now a **signal field**
(`src/scripts/field.ts`): a fullscreen WebGL quad at half resolution and at most 30 fps,
domain-warped fractal noise ramping through five `field-*` tokens per theme (colours sampled
from the references), pulled and brightened by the cursor, with per-pixel grain. Legibility is in
the shader: the field is mixed toward `bg` by `field-lane` (0.20) under the content column, which
is measured in pixels from the container width, and by `field-edge` (0.62) at the page edges; the
cursor bloom is zero inside the lane. On the brightest ramp stop under text, the lowest ratio is
`steel` at 4.6:1 in Prism and 5.0:1 in CRT (computed). Reduced motion renders one still frame;
data saver or no WebGL leaves a static CSS gradient of the same colours on `body`; the old prism
band is hidden while the field runs.

Every control is a **glass key**: `.btn`, the popup's stage tabs and `[ESC ×]`, the board cells
and the copy button share a dark `key-glass` dome with a top gloss, a bottom bevel, backdrop blur
and an iridescent `key-cyan` / `key-magenta` refraction ring that brightens and turns on hover
and flattens on press. The hard umber offset now belongs to cards, notes and stamps only. The
design system has the palette, a SignalField component (with the bundled shader) and a Key
component.

Not measured: GPU cost on a phone. The shader is cheap (five octaves of value noise at half
resolution, 30 fps cap) but it should be profiled on a representative device before the next
release; `field-edge` and the 0.5 resolution scale are the knobs if it runs hot.

### Phase 2, navigation slice (2026-10-29)

Four plan tasks landed together: view transitions, dynamic theming polish, stage deep links and
the retro micro-interactions site-wide.

**View transitions.** `Base.astro` renders Astro's `<ClientRouter />`, so moving between the home
page and a project page is a client-side swap wrapped in the View Transitions API. The root
animation in `global.css` is a CRT power-cycle: the old page collapses bright in 160ms, the new one
flickers in over 420ms with the popup's stage-flicker curve. Each project row's cover and title
carry `transition:name` (`cover-<id>`, `title-<id>`) and morph into the subpage hero; the hero
figure lost its `data-reveal` so the morph lands on a visible element. The nav, the signal-field
canvas, the cursor reticle and the `theme-color` meta persist across navigations (`transition:persist`),
so the WebGL context is created once per session and the nav keeps its state and listeners. Astro
rebuilds the `<html>` attributes from the new page, which never ran the theme script, so a
`astro:before-swap` handler copies `class`, `data-theme`, `data-motion`, `data-sound` and `data-crt`
onto the incoming document. Everything that binds to page elements now runs on `astro:page-load`
(reveals, tilt, magnetic buttons, the hero canvas, the project page's copy buttons and CRT toggle,
the scroll-spy); listeners on `window` and `document` are registered once. `motion.ts` reverts its
GSAP context before a swap and rebuilds it after; `telegraph-ui.ts` became an `init()` that the lazy
loader calls on every arrival at the home page, with its global listeners on an `AbortController`
that is aborted before the page leaves (timers, sequences and the popup are cancelled too). Reduced
motion disables the transition animations through both switches; the CV link opts out of the
router's hover prefetch and keeps its native download.

**Theming polish.** A theme change now cross-fades background, text and border colours for one lift
duration and flickers the page once (360ms), both skipped under reduced motion; the signal field
eases its palette toward the new theme over a few frames instead of snapping. The `theme-color`
meta follows the theme's `bg` (set before paint by the inline script, updated by the switch, kept
across navigations). With no saved theme the tokens already follow `prefers-color-scheme` live;
the nav label and the field follow it too.

**Stage deep links.** `/#lab?stage=welcome|animation-sequence|title-intro` scrolls to the lab and
opens the popup on that stage, on first load, on `hashchange` and after a client-side navigation
(the lazy loader imports the script at once when the hash targets the lab). While the popup is
open the URL follows the stage with `replaceState` (no history entries); closing restores the hash
the visitor arrived with, or leaves `#lab` after a deep link. Stage tabs carry `aria-keyshortcuts`
(`1`, `2`, `3`) and the close button `aria-keyshortcuts="Escape"`.

**Retro micro-interactions.** The phosphor click ripple is site-wide: one delegated listener in
`Base.astro` answers clicks on `.btn`, `.pill`, project cards, stage nodes and every `data-crt-ripple`
surface; the Telegraph section keeps only the telemetry (the PULSES counter). Sound is a site-wide,
opt-in switch (`html[data-sound="on"]`, `localStorage['portfolio-sound']`, default off): the cabinet's
Sound button sets it, and with it on every ripple also plays a 50ms synth click. The theme change
flicker is the scanline flicker the plan asked for.

Verified in headless Chrome (a 43-check script over the Chrome DevTools Protocol, run against the
dev server and the production build, since the built-in browser pane cannot complete a view
transition while hidden): the swap carries the html attributes, the nav and canvas are the same
nodes after navigation, the project page scripts re-run, going back re-binds the game and the hero
canvas, deep links open the right stage on load and across a navigation, the theme survives a
navigation with the correct `theme-color`, sound and ripple work, no console errors, and the CV PDF
is never prefetched. Screenshots of a mid-transition frame show the cover and title morphing.

Sizes after this step (production build, gzip): the router 5.7 KB, the layout script 1.9 KB, the nav
script 1.5 KB, the Telegraph loader 0.5 KB on every page; the lazy Telegraph chunk 6.7 KB, the field
2.5 KB, GSAP unchanged at 48 KB. Not measured: mobile LCP, INP and CLS, and the GPU cost of the field.
