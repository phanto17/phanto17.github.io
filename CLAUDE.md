# Portfolio – Tymoteusz Jaskólski

Live, public game-dev portfolio website. It is both a university course assignment
(Collegium Da Vinci, Game Development) and the site I will send to studios.

## Who I am / specialization

- **Junior Gameplay Programmer (Unity / C#)** – this must match my CV exactly and be
  obvious to a visitor within a few seconds of landing on the home page.
- BA Game Development student, Collegium Da Vinci, Poznań (2024 – present).
- Links: GitHub `github.com/phanto17` (username changed from `tmtjsk` on 2026-10-11) · YouTube `youtube.com/@phanto.official` · itch.io `phanto-official.itch.io` · email `tmtjsk@gmail.com`.
- Interests to reflect in "About me": gameplay systems and AI, tactics/roguelite design,
  the psychology of games (my YouTube channel "phanto").

## Assignment requirements (all must be met before submission)

1. **About me** – who I am, specialization, professional interests, career goals in games.
2. **Games** – commercial released games. I have none: omit this section.
3. **Experience** – game-dev-related work: where, how long, team, project, role, what I learned.
   I have no game-dev employment. Taskscape Ltd internship (Jan 2026 – present: web dev,
   video production, Git, Azure DevOps, task estimation) **is included, framed around
   transferable skills** (decided 2026-10-11).
4. **Personal / passion projects – REQUIRED, at least 3 PLAYABLE projects.**
   Each one gets its **own subpage** with:
   - description of the game,
   - detailed description of my contribution,
   - tools used,
   - visuals: screenshots, GIFs, short videos, process art,
   - **link to itch.io where it can be played.**
5. **CV download** – `public/CV_Tymoteusz_Jaskolski_EN.pdf`.
6. Optional extras that strengthen the profile: technical breakdowns, devlog, contact.

**Never invent experience, features, numbers or contributions.** If something is unclear, ask me.

## Content inventory

### Personal projects (candidates for section 4)

| Project | Path | Unity | Notes |
|---|---|---|---|
| SurvivorLike → public title **Horde Hours** | `D:\UnityProjects\SurvivorLike 4\SurvivorLike` | 6000.0.38f1, URP 17, Cinemachine 3, Input System | Vampire-Survivors-like. Build scenes: MenuScene (built from code by `HordeHoursSetup.BuildMenuScene`, 2026-10-15), Game1. My code: `Assets/_Game` (abilities, waves, object pooling, level-up, save system, HUD). Third-party (all confirmed 2026-10-15, listed with publishers on the site page): Asset Store packs by Supercyan, PI Entertainment, ThunderForgeStudio, Blink, BenjaTheMaker, CartoonVFX9x, Hun0FX, Matthew Guz, Travis Game Assets, Cartoon VFX by Wallcoeur, Vefects, LowlyPoly, SLD Audio (music "Happy Harmony"), Cyberwave Orchestra; rat character from Mixamo; fonts League Gothic (OFL) and Caslon Antique (1001Fonts FFC); AI-generated icons. **Retro Floral (personal use only) and Gondens DEMO were removed from the game on 2026-10-15** – never reintroduce them. Static Field visual is a Particle System since 2026-10-15 (VFX Graph and PPv2 packages removed). **Spawn director since 2026-10-22 (0.2.0):** `Assets/_Game/Scripts/Director` (`HordeHours.Director` asmdef, pure `SpawnDirectorModel`), `Scripts/Core/SpawnDirector.cs` + `SpawnSchedule.cs` (asset `Assets/Data/Director/Default Schedule.asset`), `EnemyScaling`; `Assets/_Game/Editor/DirectorSetup.cs` wires Game1 (WaveManager component disabled, kept). Tests in `Assets/_Game/Tests/Editor` (`HordeHours.Tests.Editor` asmdef). Pause menu has Save/Load buttons (the save IS loaded from there). **Review round 0.2.1 (2026-10-22):** `Assets/_Game/Editor/ReviewSetup.cs` (Zap shaders `#pragma target 3.5` — 4.5 is magenta on WebGL; night lighting: moonlight 0.32, Trilight ambient, fog, no skybox, warm point `Lamp` under `Player_Root`; LevelUpScreen `Dim`; InventoryPanel kept in place (owner's call); `RatLight` under `RatDancing` for the level-up rats; `CursorLock` on the player; Kenney stings (STEEL02 / STEEL01 / impactMining — **not the Push Comes to Shove clips**, owner's call) + cynicmusic "Crystal Cave" menu theme in `Assets/Audio`; the level-up plays only the owner's own sound), menu rebuilt by `HordeHoursSetup.BuildMenuScene` (generated glow/vignette sprites in `Assets/Sprites/UI`, `MenuButtonFeel`). Web build zips `Builds/HordeHours-web-0.1.0.zip` (was live 2026-10-16 → 2026-10-22), `0.2.0.zip`, `0.2.1.zip`, `0.2.2.zip` `0.2.3.zip` and `0.2.4.zip` (timer on one line under the XP bar; rats removed with their assets — no rat credit any more; pointer lock re-taken inside the card/Resume click; 29 MB) — **0.2.4 is live on itch.io since 2026-10-22 (verified byte-identical)**; **0.2.5 (2026-10-25, H3+H4: `Assets/_Game/Editor/SettingsSetup.cs` — results panel via `RunResultsScreen`/`RunSummary`, `VolumePrefs` sliders in pause and a menu Settings screen, mix defaults + ducking, four unattributed WAVs deleted) — live on itch.io since 2026-10-25 (verified byte-identical, frame html/20018331)**; **0.2.6 (2026-10-25, H7: `Editor/ContinueSetup.cs` — menu Continue in a layout column, `ContinueLoader`, director `SkipTo`, save deleted on death/win; **web save in PlayerPrefs** — the persistentDataPath file never reached IndexedDB) — live on itch.io since 2026-10-25 (verified byte-identical, upload html/20021818; the first upload 20021333 had a Cloudflare-cached 404 on its data file and was replaced)**; **0.3.0 (2026-10-25, H2: `Assets/_Game/Editor/RolesSetup.cs` — enemy roles via `EnemyMovement.role`/`EnemySteering`, skeleton `EnemyRanged` + `BoneProjectile` (BTM Skull and Bones), elites via `EliteMarker` from 5:00, `Boss_Enemy` zombie variant with `BossBrain`/`ChargeCycle` at 9:00 + `BossHealthBar`; local-only preview build `Builds/WebPreview` with an early boss) — live on itch.io since 2026-10-25 (verified byte-identical, upload html/20022525)**; **0.3.1 (2026-10-25, H6: `Editor/PerfSetup.cs` + `PerfBench`/`PerfBenchRunner`/`PerfAudit` — Enemy×Enemy physics off, 2 shadow cascades, no opaque texture, pool prewarm, pooled SFX voices; local-only `Builds/WebBench` load-test build with an overlay) — live on itch.io since 2026-10-26 (verified byte-identical, upload html/20051695)**; itch: `https://phanto-official.itch.io/horde-hours`. |
| Into the Mewgenics → public title **Push Comes to Shove** | `D:\UnityProjects\IntotheMewgenics` | 6000.3.10f1, URP 2D, Input System | Deterministic grid tactics (Into the Breach / King's Bounty inspired). Same project as "Turn-Based Tactics Prototype" on my CV. Design docs: `Docs/DESIGN.md`, `Docs/PLAN-core-loop.md`. Has Unity MCP installed (strip before building). Third-party (confirmed 2026-10-14): Kenney Isometric Sandbox tiles (CC0); Sanctum Pixel *Top Down Pixel Art Characters* packs – Humans, Orc, Elf, Goblin (purchased, credit optional, no resale); PixelBattleText by Psychic Fur (free, Asset Store EULA, bundles the Alphapix font); UI font Pixellari by Zacchary Dempsey-Plante (100 % free, credit requested). The dafont "Pixel" font (krolesz94, personal use only) is **not** in the project. Damage is fixed since 2026-10-12 (Melee 4 / Ranged 3 / Line 1). **Melee shoves 1 tile since 2026-10-21 (build 0.2.0); before that nothing in the game pushed (Melee/Ranged PushAmount 0 at baseline, Line Attack on no prefab) — the `Assets/Editor/PushSetup.cs` script sets the data, creates `Sprites/Tiles/Pit.asset` (Kenney water tile, Hazard cell) and places 4 pits on the board `Level 1 Data` points at (`Battlefield.prefab`; `Lvl1.prefab` is unused); `Tests/EditMode/ShoveTests.cs` pins it.** **Audio since 2026-10-22 (0.3.0):** Kenney Impact / RPG / Interface / Music Jingles (CC0) and two cynicmusic loops (CC0, credit pixelsphere.org) in `Assets/Audio`, built by `Assets/Editor/AudioSetup.cs` from `_thirdparty`; `Scripts/Audio` (`SfxId`, `AudioLibrary`, `AudioManager`, `ButtonSfx`). The polish pass (audio → feel → front end → build size) shipped as `Builds/PushComesToShove-web-0.3.0.zip` (24 MB; sheets padded to 2268 px + cap 4096 so they block-compress — the 2048 cap had resampled them to 2048×1706, not ÷4, hence RGBA32) on 2026-10-22, then a review round from the owner's recording (first-hit arrows, selection kept across modes, `UiSkinSetup.cs` skinning every button with the riveted plate + Pixellari rebuilt with Polish letters) as `0.3.1.zip`; **0.3.1 is live on itch.io since 2026-10-22 (verified byte-identical).** **Level set 0.4.0 (2026-10-25, P4):** `Assets/Editor/LevelSetup.cs` builds boards from ASCII maps into `Prefabs/Levels` + `Data/Levels`, catalog `Assets/Resources/Levels.asset` (First Shove → The Crossing = `Level 1 Data` → Drowned Fields → Hold the Line (survive 5) → The Warband), rocks (`Data/Cell Templates/Rock.asset`, `Sprites/Tiles/Rock.asset` + `Rock Raised.asset`), `LevelFlow`/`LevelProgress` in `Scripts/GridSystem/LevelCatalog.cs`, `Tests/EditMode/LevelTests.cs`; `WebBuild.BuildPreview` = local-only all-levels build in `Builds/WebPreview` (never upload); `Builds/PushComesToShove-web-0.4.0.zip` — **live on itch.io since 2026-10-25 (verified byte-identical, upload html/20031719)**; 0.3.1 was live 2026-10-22 → 2026-10-25. The itch page now uses a signed `html_url/<id>` embed link that answers `{"status":"extracting"}` until itch has unpacked the zip — wait for `complete` before requesting any build file. itch.io page: `https://phanto-official.itch.io/push-comes-to-shove` (itch handle is **phanto-official** since 2026-10-16; the old `fanto1` URLs redirect). "Mewgenics" is the title of an existing commercial game – never use it publicly. |
| **Cinderhold** (rework of DungeonForge) | `D:\UnityProjects\Cinderhold` (new, 2026-10-16); old tutorial prototype frozen at `D:\UnityProjects\DungeonForge` (git baseline `20ca45d`, reference only, never reuse) | 6000.6.3f1, URP 17.6 2D renderer, Input System 1.20, Tilemap + Extras | 2D top-down dungeon crawler built from Unity's empty Universal 2D template (git baseline `bc9729c`). Foundation done 2026-10-16: `Assets/_Game` layout, asmdefs `Cinderhold` / `Cinderhold.Editor`, `Cinderhold.inputactions` (Move/Attack/Interact/Pause, keyboard + gamepad), Kenney **Tiny Dungeon** (CC0, sliced `td_000…td_131`, Tile assets + palette), Playground scene (Pixel Perfect Camera 320×180 at 16 PPU, Walls composite collider, `PlayerMovement`), `WebBuild.cs`. Everything is created by the idempotent headless editor script `Assets/_Game/Editor/CinderholdSetup.cs` (`-executeMethod Cinderhold.EditorTools.CinderholdSetup.All`). Combat core done 2026-10-16 (`Scripts/Combat`: `HealthPool` pure C# + `Health`, `WeaponData` SO, `MeleeAttacker` OverlapBox swing, `KnockbackReceiver`, `HitStop`, `HitFlash`, `DeathSequence`; prefabs Player + Slime; `Assets/_Game/Tests/Editor` EditMode tests, run headlessly with `-runTests -testPlatform EditMode`). Enemy AI done 2026-10-16 (`Scripts/Enemies`: `EnemyDefinition` → `EnemyStats`, pure-C# states behind `IEnemyContext`, `EnemyBrain`, `AttackPattern`, `AttackTelegraph`; one inactive `Enemy.prefab` configured at spawn; data Slime / Bat / Rat / boss Cinderclaw). Progression & save done 2026-10-16 (`Scripts/Progression`: `PlayerProgress`/`LevelCurve`/`Shop` pure + `PlayerProgression`, `PlayerLoadout`, `Pickup`, `LootDropper`, `ShopStation`; `Scripts/Save`: `SaveSystem` + `ISaveSystemElement` + `ISaveStore` (PlayerPrefs on web); `Scripts/Interaction`; `Core/GameSession` autosave policy; TMP essentials imported into `Assets/TextMesh Pro`). UI & feel done 2026-10-16 (`Prefabs/HUD.prefab` built by the setup script; `Scripts/UI`: `HudController`, `DeathScreen`, `PauseController`; `Core/GameClock`; `Effects/FloatingTextPool`; `Audio/SfxSynth` procedural SFX, since 2026-10-22 only the fallback behind `Audio/AudioLibrary` (Resources) + `SfxPlayer` + `MusicPlayer` + `AudioVolumes` — Kenney Impact/RPG/Interface/Jingles clips (CC0, none shared with the other two games) and cynicmusic "Dark Forest Theme" (floors) / "Dramatic Boss Encounter" (boss, via the `boss` flag on `EnemyDefinition`) in `Assets/_Game/Audio`, built by `CinderholdSetup.CreateAudio`; `Player/PlayerDeath`). Floors done 2026-10-16: `Floor1`/`Floor2` scenes generated from ASCII maps in `Editor/CinderholdSetup.Floors.cs` (only these two are in the build; `Playground` is a dev scene), `ExitPortal` + `WinScreen` + `FloorTracker`; **no CompositeCollider2D on tilemaps** (empty at runtime when built by script in 6000.6 — use `TilemapCollider2D` alone, playtest 2026-10-16); world-space text is illegible at 320×180 — all text goes on the HUD canvas; web build zips `Builds/Cinderhold-web-0.1.1.zip` and `0.1.2.zip` (0.1.0 had no wall collision — never ship it); itch copy `docs/itch/cinderhold.md`; public on itch.io since 2026-10-16: `https://phanto-official.itch.io/cinderhold` (0.1.2 since 2026-10-17), site page playable. Credits: Kenney Tiny Dungeon (CC0), Kenney Fonts — Kenney Mini / Mini Square, the UI fonts since 2026-10-17 (CC0), Liberation Sans shipped inside TMP resources (OFL), Kenney audio packs (CC0), cynicmusic loops (CC0). Web builds `Builds/Cinderhold-web-0.2.0.zip` (recorded audio, 2026-10-22, never uploaded) and `0.2.1.zip` (settings + controls card in the pause panel via `SettingsModel`/`SettingsPanel`/`FeelSettings`, death-screen wording; 2026-10-25) — 0.2.1 was live 2026-10-25 → 2026-10-26 (frame html/20009683); 0.1.2 was live 2026-10-17 → 2026-10-25. **0.3.0 (2026-10-26, C3 + C5):** dodge (`Player/DodgeModel` + `PlayerDodge`, `Dodge` action, `HealthPool.GrantInvulnerability`, HUD gauge), 2D lighting (`Scripts/Lighting`: `TorchFlicker`, `BossArena`; `t` = sconce in the floor maps), `Enemies/BossEncounter` + `UI/BossBar`, `Effects/DeathBursts`, `UI/ScreenFade`; `Builds/Cinderhold-web-0.3.0.zip` — **live on itch.io since 2026-10-26 (verified byte-identical, upload html/20052674)**. The itch page credits block was pasted by 2026-10-26; the page description and controls still read as 0.2.1 (no dodge) until the owner pastes them. **The site page says most code was written with Claude Code under my direction** (same honesty line as Eternity Keeper). Design notes: `Docs/DESIGN.md`. |

| **Eternity Keeper** (tool, not a game) | `D:\PillarsEditor\eternity-keeper` (repo `phanto17/eternity-keeper`, fork of `aybrkaknc/eternity-keeper`, GPL-3.0) | Java 8 + JCEF, Maven; own `CLAUDE.md` with strict toolchain and save-safety rules – **read it before touching that repo** | Pillars of Eternity save editor. My work Jul 12 – Oct 9 2026: ~90 commits (identities `tjaskol`, `boogiewoogie`), ~44 k lines added incl. tests, releases 1.0.0-beta (2026-10-06) and 1.0.1-beta (2026-10-09), PR #1 open upstream, Reddit announcements. 708 JUnit tests, CI + Package workflows. **Most code was written with Claude Code under my direction – the site and CV must say so** (the repo and Reddit posts already do). Site page: `src/content/projects/eternity-keeper.md` (kind: tool). Screenshots copied to `public/media/eternity-keeper/`. |

IntotheMewgenics (since 2026-10-12, baseline `443e37a`), SurvivorLike (since 2026-10-15, baseline
`8a41e19`), Cinderhold (since 2026-10-16, baseline `bc9729c`) and the frozen DungeonForge (`20ca45d`) are
under git with LFS (local repos, no remotes). All three live projects build for Web headlessly via
`Assets/.../Editor/WebBuild.cs`. Third-party packs downloaded for projects live in `D:\UnityProjects\_thirdparty\`.
Full audit: `docs/audit-2026-10-11.md`. Only Unity **6000.6.3f1** is installed; **Web Build Support is
installed on it** (2026-10-11). All three projects run on 6000.6.3f1.

**Never run `git` commands that rely on the shell's current directory** – one session wrote a Unity
baseline commit into the Eternity Keeper repo because the cwd was not what `cd` implied (2026-10-12;
reverted). Always use `git -C <absolute path>` and absolute file paths.

### Team projects (git-verified contribution; Activities, not Projects, for now)

| Project | Path | Facts |
|---|---|---|
| Mansion of Grief | `D:\UnityProjects\Mansion-of-grief` (repo `IvanLiaskovski/Mansion-of-grief`, MIT) | First-person horror, Unity 6000.0.51f1 / URP. Team of 4, Oct 2025 – Jul 2026. Mine: `BearAI` state machine (patrol/roar/chase, FOV + raycast, URP danger vignette, hurt/retreat, jumpscare), pause + main menu, inventory, shadow / keypad / pressure-plate / mirror-beam puzzles, `LevelStartManager`, `PlayerHealth`. **Not mine:** FPS controller, flashlight/battery (teammate). On the CV since 2026-10-17 as "Mansion of Grief", team project Oct 2025 – Jul 2026, with only the git-verified claims (the old CV called it a personal "First-Person Survival Horror", Feb 2025, and claimed the FPS controller and flashlight). The old "I tracked my work in Jira" line was dropped: no Jira evidence in the repo. |
| Garden Simulator VR | `D:\UnityProjects\GardenSimVR` (repo `IvanLiaskovski/GardenSimVR`, fork of lecturer template) | VR garden sim, Unity 2022.3.52f1, XR Interaction Toolkit. Mine (Jun 27 – Jul 5 2026): inventory / vendor / shop economy, crate deposit, collect-on-grab, pest infestation + bug swarm, mushroom spawner, fruit cluster. On the CV since 2026-10-17 (economy layer only). VR-only → video, no playable link. |

### Activities (short entries, no playable requirement)

- **TagTheGame** – team project, Unity 6 / URP, 3D multiplayer "bomb tag" (Oct 2026 – present):
  bomb-fuse & explosion mechanic, host-authoritative multiplayer architecture design,
  team Git LFS / PR workflow. Networking not implemented yet.
- **Animal Shelter** – team project, Unreal Engine 5.6, Blueprints / C++, **February 2026** (CV corrected
  2026-10-17; it used to say May 2026). Teammates: Andrzej "BappoEatTaco", Julia "Yuchan". **My part was small:
  minor UI work plus ideas for mechanics and the dog species** – the site and the CV say no more than
  that (the old CV line claiming mechanics, concept-to-prototype and Git coordination was replaced
  2026-10-17); the project used Unity Version Control, not Git. Path `D:\AnimalShelter`. Top-down shelter
  management sim: animals (cat, dog, guinea pig, hamster) with hunger/hygiene/mental/training needs,
  cages, food bowls, office computer UI (animal & people lists, adoption matchmaker, finances), NPC
  behaviour tree + dialogue tables, day cycle, save system, drivable car + rescue map with objectives,
  Mutable-based character customisation, CommonUI/Enhanced Input. C++ module: five CommonUI helper
  classes (button selection group, input-mode statics, UI action router override, world-to-screen
  projection). Version control: Unity Version Control (Plastic) cloud repo, branch
  `/main/game_loop/MapPickup`; no local history and no `cm` client → **my contribution cannot be
  derived from files; ask me.** Team folders: Andrzej, Julia, tmtjs. Third-party: Fab packs
  (Box_Cage, Dog), UE mannequins/LevelPrototyping, "Man" modular character pack.
- **phanto** – my English YouTube channel on the psychology of video games (Jul 2026 – present).
- **E-sports organisation** – organising team, Academic Counter-Strike 2 Championships of
  Poznań and Wielkopolska (AZS Collegium Da Vinci, June 2026).

Team projects: ask me before publishing any team footage or code; credit teammates.
**Decision 2026-10-11: no team footage or code on the site for now** (text entries only); revisit later.

### CV consistency

The site and `public/CV_Tymoteusz_Jaskolski_EN.pdf` must agree on titles, dates and project
names. If they diverge, tell me – don't silently change either. Since 2026-10-17 the CV is generated
from `docs/cv/cv-en.html` (A4, two pages, DejaVu Sans) with headless Chrome — the print command is in the
file's header comment. Edit the HTML, reprint, never hand-edit the PDF.

## Tech & deployment

- **Astro**, fully static. Projects live in a content collection (one Markdown/MDX file per
  project → its own subpage). Schema fields: title, summary, genre, status, dates, role,
  myContribution, tools, media, itchUrl, githubUrl (optional), credits.
- Hosted on **GitHub Pages** from repo `phanto17/phanto17.github.io`, deployed by GitHub Actions on push to `main` → live at
  `https://phanto17.github.io`. `gh` CLI 2.102 is installed (`C:\Program Files\GitHub CLI`).
- Unity builds do **not** go in this repo – they go to itch.io.
- Media: WebP/AVIF images, MP4/WebM instead of large GIFs, lazy loading, keep the repo small.
- Responsive down to phone width; good contrast; every animation respects
  `prefers-reduced-motion`.

## Site status (2026-10-11)

Astro 7.3.8 scaffold is in place and builds clean (`npm run build`, `astro check` 0 errors):
home (hero, About, Projects, Activities, Experience, Contact), `/projects/<id>/` subpages from
`src/content/projects/*.md`, GitHub Actions deploy workflow. **Live at https://phanto17.github.io
since 2026-10-11** (repo `phanto17/phanto17.github.io`, Pages build type = workflow; every push to
`main` redeploys in ~5 min). Local git identity: Tymoteusz Jaskólski <tmtjsk@gmail.com>. Open `TODO`
markers on the site are deliberate placeholders. Session plan with hours: `docs/plan-sessions.md`
(sessions 2–4 complete; all three projects playable on itch.io since 2026-10-16; session 6 polish done 2026-10-16/17 — no TODO markers left on the site; career goals and the Horde Hours design intent are the owner's own words; CV regenerated 2026-10-17; remaining owner tasks: optional gameplay clips). Tools: `tools/check-links.mjs` (run after `npm run build`), `tools/make-og.py` (Open Graph images), `tools/serve-web.mjs`, `tools/extract-unitypackage.py`.

## Working rules

- Commit or push only when I ask. (Pushing to `main` publishes the site.)
- **Before changing any Unity project**, propose putting it under git (Unity `.gitignore`,
  Git LFS for binaries, baseline commit) and wait for my OK.
- In Unity, prefer Editor operations (MCP / editor scripts) over hand-editing `.unity` /
  `.prefab` YAML.
- WebGL builds: check that the WebGL Build Support module is installed for that exact Unity
  version; follow itch.io's current requirements for Unity WebGL uploads.
- Keep a credits list per project for every third-party asset.
- Writing: English, first person, concrete (what I built, how, why). No filler, no invented
  metrics.
- **Plans:** every task you propose must have **title, description, objective, estimated hours**.

## Visual style — "Prism" (direction B revised, chosen 2026-10-11, pending final confirmation)

Full spec with tokens, scale and rationale: `docs/design-system.md`. Reference mockup:
`mockups/direction-B-prism.html`. Reference images: `references/`.

- **Tone:** dark room, warm film grain, one blurred prism light band per hero/section.
  Editorial "field notes" structure: numbered projects, figures with captions, margin notes,
  pull quotes. Glow only on H1, primary button and hovers.
- **Palette:** bg `#1a1713`, vignette `#0b070b`, surface `#2f291b`, raised `#3a3224`,
  border `#5d412b`; text `#f3e6d3` / `#b9a68f` / `#a79a88` (third tone raised from `#8a7a66` for WCAG AA, 2026-10-16), metadata `#979ca4`;
  accent coral `#f27c52`, peach `#f2b180`, gold `#f6d370`, brick `#a95c3d`, teal `#4e6367`.
  Prism gradient: `#e95c3a → #f27c52 → #f6d370 → #9fd3a8 → #8fc3df → #cab5ce → #faa193`.
- **Fonts:** Fraunces (display, `SOFT 100, WONK 1`), DM Sans (body), DM Mono (labels).
- **Spacing:** 8 px base, container 1040 px, gutters 24/16 px, sections 80/56 px.
- **Radii:** 6 / 10 / 16 / 24 px, pills 999 px.
- **Motion:** 200–250 ms hover lifts and glows; prism drift optional; everything off under
  `prefers-reduced-motion`. No parallax.
