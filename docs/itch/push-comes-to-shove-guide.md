# itch.io page guide — Push Comes to Shove

Everything you need to publish the game, in the order the itch.io forms ask for it. The
page should look like a corner of the portfolio: dark warm background, cream text, coral
links, one prism band in the banner. Assets are in `docs/itch/assets/`.

## 0. Before you open itch.io

| Have ready | Where |
|---|---|
| The build | `D:\UnityProjects\IntotheMewgenics\Builds\PushComesToShove-web-0.1.0.zip` (35 MB; `index.html` at the zip root, as itch requires) |
| Cover image 630×500 | `docs/itch/assets/cover-630x500.png` |
| Banner 960×300 (theme header) | `docs/itch/assets/banner-960x300.png` |
| Background 1920×1080 (optional) | `docs/itch/assets/background-1920x1080.jpg` |
| 3–5 screenshots, 1280×720 PNG | **Take these yourself** — see §7; the ones on the site are 800 px captures |
| Optional GIF ≤ 3 MB | See §7 |
| Page text | §4 below (also `docs/itch/push-comes-to-shove.md`) |

Account: use the same handle as GitHub, **phanto17**, so the two link cleanly. In *Settings →
Profile* add the portfolio URL `https://phanto17.github.io` and the YouTube channel.

## 1. Create the project

Dashboard → **Create new project**.

| Field | Value |
|---|---|
| Title | `Push Comes to Shove` |
| Project URL | `phanto17.itch.io/push-comes-to-shove` (edit the slug if itch suggests something else) |
| Short description or tagline | `Read the board, push enemies into pits, and set up the perfect turn before they get theirs. A small deterministic tactics game.` |
| Classification | Games |
| Kind of project | **HTML** |
| Release status | **In development** (it is a prototype with one level; "Released" over-promises) |
| Pricing | **No payments** |

## 2. Uploads

1. **Upload files** → pick the zip.
2. Tick **"This file will be played in the browser"** on that upload.
3. Leave "Hide this file" unticked. Version note: `0.1.0 — first web build`.

## 3. Embed options (shown once the file is marked playable)

| Option | Value | Why |
|---|---|---|
| Embed in page | selected | the game is small enough for the page |
| Viewport dimensions | **1280 × 720** | matches the build's canvas |
| Automatically start on page load | **off** | a click first lets the browser start audio |
| Fullscreen button | **on** | |
| Enable scrollbars | off | |
| Mobile friendly | **off** | mouse-only |
| Orientation | Landscape | |
| SharedArrayBuffer support | **off** | the build has no threads; the extra headers it adds can break the loader |

The build was made with Gzip compression **and** the decompression fallback on, which is
what itch.io needs (its CDN doesn't send `Content-Encoding` for `.unityweb`). No extra setting.

## 4. Details

**Description** — paste as Markdown (click the `</>`-free "Markdown" toggle if the editor is in
rich-text mode; otherwise paste and set the headings by hand):

```markdown
**Push Comes to Shove** is a small turn-based tactics game on an isometric grid, made solo in Unity.

Deploy your squad of four on your side of the board, then take turns with the enemy. Every unit gets two actions a turn: move along a path, or attack. Soldiers strike adjacent enemies and get struck back; archers shoot in straight lines; some attacks push. Pushing is the point:

- shove an enemy into a wall for extra damage,
- into an ally so both get hurt,
- or into a pit to remove it outright.

Damage is fixed, never rolled, so every outcome is yours to work out. Enemies don't telegraph before your turn: on their turn they reveal their intent one at a time, and then act. Clear the board to win.

### Controls

Mouse only. Pick a mode with the buttons (**Unit Placing** while deploying, then **Move Units** / **Attack**), click a unit, click a target. Right-click cancels a selection. **End Turn** when you're done. Press the fullscreen button for the best view.

### What this is

A gameplay-programming prototype: a deterministic grid engine with BFS pathing and push resolution, attacks as ScriptableObject strategies shared by the player and the AI, and a paced enemy turn. The systems are unit-tested. Technical write-up: https://phanto17.github.io/projects/push-comes-to-shove/

One level for now. Feedback welcome in the comments — especially on how readable the enemy turn is.

### Credits

- Isometric Sandbox tiles: [Kenney](https://kenney.nl), CC0
- Human and Orc characters: [Sanctum Pixel](https://sanctumpixel.itch.io) — *Humans – Top Down Pixel Art Character Assets* and *Orc – Top Down Pixel Art Characters*
- Elf and Goblin characters: TODO confirm the pack
- Animated damage numbers: [PixelBattleText](https://assetstore.unity.com/packages/2d/gui/pixelbattletext-189358) by Psychic Fur
- UI font: [Pixellari](https://www.dafont.com/pixellari.font) by Zacchary Dempsey-Plante
- Design and code: Tymoteusz Jaskólski

Inspired by *Into the Breach* and *King's Bounty*.
```

One TODO credit left: confirm where the Elf and Goblin sheets come from (Sanctum Pixel sells
matching packs; check your itch.io purchases).

| Field | Value |
|---|---|
| Genre | **Strategy** |
| Tags (max 10) | `Turn-based Strategy`, `Tactical`, `Pixel Art`, `Isometric`, `Singleplayer`, `Unity`, `Short`, `Puzzle`, `2D`, `Turn-Based Combat` |
| AI generation disclosure | Answer truthfully. Graphics: **no** (Kenney + a purchased pack). Audio: none. Code: the project was built with AI assistance (Claude Code / Unity MCP), so if the form offers a "code" category, tick it; otherwise mention it in the description's "What this is" paragraph. The portfolio page will say the same. |
| App store links | none |
| Custom noun | leave "game" |
| Community | **Comments** |
| Visibility | **Restricted** while you check it, then **Public** |

**Metadata** (right column after saving): Made with → Unity; Average session → A few minutes;
Languages → English; Inputs → Mouse; Accessibility → leave empty; Links → the portfolio page.

## 5. Images

- **Cover image**: `cover-630x500.png` (itch recommends 630×500; it also serves as the thumbnail everywhere).
- **Screenshots**: 3–5 PNGs at 1280×720, in this order: a push into a pit (or the attack preview), the enemy intent path, deployment, the roster/HUD. Captions aren't shown, so make each frame self-explanatory.
- **GIF** (optional but worth it): one 6–10 s loop of select → push → unit falls into the pit, under 3 MB. itch shows GIFs in the screenshot column and animates them.

## 6. Theme (page → **Edit theme**, top of the page editor)

| Setting | Value |
|---|---|
| Background color | `#1a1713` |
| Text color | `#f3e6d3` |
| Link color | `#f27c52` |
| Button color | `#f27c52` |
| Button text color | `#1a1713` |
| Header: image | upload `banner-960x300.png`, align **left**, no title text (the banner has it) |
| Font (text / headers) | pick a serif option if the list has one (Lora or Playfair Display look closest to the site's Fraunces); otherwise keep the default sans — the banner carries the display type |
| Background image | optional: `background-1920x1080.jpg`, repeat **no**, position **top**, with "Background color" still set so the page below the image stays dark |
| Screenshots | sidebar **right**, so the game embed stays wide |
| Custom CSS | not available on free accounts; nothing needed |

Preview, then **Save**. On a phone the banner scales down; check that the title stays readable.

## 7. Taking the screenshots and the GIF

1. Serve the build locally (`node D:\Portfolio\tools\serve-web.mjs D:\UnityProjects\IntotheMewgenics\Builds\Web 8768`) or use the Restricted itch page.
2. In Chrome press F12 → device toolbar → set **1280 × 720**, DPR 1 → the `⋮` menu → **Capture screenshot** gives an exact 1280×720 PNG. Or use the game's fullscreen button and crop.
3. GIF: ScreenToGif or ShareX, record the 1280×720 region, export at 640×360, 15 fps, ≤ 3 MB.
4. Drop the 1280×720 PNGs into `D:\Portfolio\public\media\push-comes-to-shove\` as well and tell me; I'll convert them to WebP and swap them into the site.

## 8. Publish and hand over

1. Set visibility to **Restricted**, open the page in a private window, press **Run game**, play one turn.
2. Switch to **Public**.
3. Send me the URL. I'll set `itchUrl` and `status: playable` on the site, which also lights up the "play on itch.io" pill on the home page.

## Checklist

- [ ] zip uploaded, "played in the browser" ticked
- [ ] 1280×720, fullscreen on, autostart off, SharedArrayBuffer off
- [ ] description pasted, Elf/Goblin credit confirmed
- [ ] genre, 10 tags, AI disclosure answered
- [ ] cover 630×500, 3–5 screenshots 1280×720, GIF optional
- [ ] theme colours and banner set
- [ ] metadata: Unity, mouse, English, portfolio link
- [ ] tested in a private window, then Public
- [ ] URL sent to me
