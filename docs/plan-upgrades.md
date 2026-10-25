# Upgrade plan — the three playable games

Written 2026-10-21 from a read of each project's scripts, data assets, scenes, build output and design notes
(not from the site copy). Scope: Horde Hours, Push Comes to Shove, Cinderhold. The team projects are not
mine alone to change and stay text-only on the site by the 2026-10-11 decision; Eternity Keeper is a tool
with its own roadmap. Hours assume the same workflow as sessions 2–6 (Claude Code builds, I review and
playtest).

## Findings that change the priorities

1. **Push Comes to Shove does not push.** `Melee Attack` and `Ranged Attack` have `PushAmount 0` (they did
   at the 2026-10-12 baseline too), and `Line Attack` — the only pushing attack, push 1 — is assigned to no
   unit prefab. Pits exist, but nothing can shove a unit into one. The title, the itch tagline
   ("push enemies into pits"), the site summary and "The game" paragraph all describe a mechanic the
   player cannot trigger. This is a site-consistency problem first and a design problem second; fix the
   game (P1) and then the copy, or fix the copy now.
2. **Horde Hours runs out of content at 1:38.** `WaveManager` has four fixed waves (51 slimes at 0:00,
   31 bats at 0:40, 21 skeletons at 1:20, 31 zombies at 1:30, one every 0.25 s); the last enemy spawns at
   about 1:38 and nothing spawns after that. With no win state, a run is a 2-minute fight followed by an
   empty arena. The HUD timer and kill count suggest an endless survival game that is not there.
3. **Horde Hours' save is write-only.** `SaveSystemManager.SaveGame()` runs when quitting to the menu;
   `LoadGame()` has no caller and the menu has no Continue. The site describes the load path
   ("restores abilities by name … on load") as a mechanism; it is never exercised in play.
4. **Push Comes to Shove has no audio, no menu and no pause.** The only `AudioSource` reference is in
   `EnemyController`; the game boots straight into deployment. Its 36 MB build is mostly the four
   character sheets (2266 × 1888, not a multiple of 4 → stored uncompressed RGBA32, ≈17 MB of VRAM each).
5. **Cinderhold is complete but placeholder-sounding.** 99 tests, pixel font, two floors, boss, shop,
   saves, pause, death and win screens — and synthesised SFX, no music, no settings screen.

Every game ships without a volume/settings UI; none has an in-browser HUD screenshot on its itch page.

---

## Horde Hours (SurvivorLike)

**Snapshot.** 6 abilities × 5 levels, 4 passives, 1 power-up, 4 enemy prefabs (slime, bat, skeleton,
zombie) with NavMesh chase + contact damage, XP gems, 3-card level-up, HUD (XP, level, timer, kills),
pause (resume/quit), menu (Play/Credits/Controls/Quit), one looping track (SLD Audio "Happy Harmony"),
8 SFX, save system (see finding 3), object pooling, 0 tests, 28 MB web build. Assets are store packs.

| # | Title | Description | Objective | Hours |
|---|---|---|---|---|
| H1 | Spawn director and run end | Replace the fixed wave list with a director: a per-minute enemy mix and spawn rate curve, waves that repeat with health/damage multipliers, a hard cap on live enemies with a spawn queue. Add a run goal: survive to 10:00 (win screen) or die (as now). Keep the data in a ScriptableObject so the curve is tunable without code. | A run has a shape — rising pressure, a finish line — instead of 98 seconds of spawns and silence. The HUD timer means something. | 6 |
| H2 | Enemy roles and a boss | Give the four prefabs roles instead of identical chasers: slime swarm (fast, fragile), bat (erratic orbit), skeleton (ranged bone throw using the existing projectile code), zombie (slow, tanky, knockback-resistant). An elite variant (scaled, tinted, more XP) from minute 5 and a boss at 10:00 using the largest existing model. | Each wave asks for a different answer; the final minute is an event, not more of the same. | 5 |
| H3 | Results and settings UI | A results screen on death/win: time, kills, level, the build (ability icons + levels) and a Play Again. A settings panel in the menu and pause: master/music/SFX sliders bound to the `AudioManager` fields that already exist, persisted in PlayerPrefs. Controls card with keyboard and gamepad. | The run ends with a readable summary; sound can be turned down in a browser tab. | 4 |
| H4 | Audio mix pass | The itch notes admit "no sound-mix pass". Set per-clip volumes, duck music under the level-up screen, keep the hit-SFX cooldown, add a level-up sting and a distinct boss/elite cue, a menu track. Use only tracks whose licence is on file (four of the five WAVs in `Audio/Music` are unreferenced and unattributed — delete them or document them). | Fights sound layered rather than clipped; every shipped clip is credited. | 2 |
| H5 | Game feel | Low-health vignette and heartbeat, level-up pulse on the XP bar, kill-streak feedback, damage-number stacking at high enemy counts, gem magnet acceleration curve, screen shake on explosions. All behind a "screen effects" toggle in H3. | Feedback scales with the chaos instead of drowning in it. | 3 |
| H6 | Web performance | `EnemyMovement.Update` calls `SetDestination` on every agent every frame; stagger it (every 0.2–0.3 s, offset per agent). Verify the live-enemy cap from H1 in the browser profiler, pool damage popups, check GC allocations per frame, confirm the 1024 px texture cap holds for the 16 MB TGAs and that audio is Vorbis. | Steady frame rate in Chrome at the H1 enemy cap. | 3 |
| H7 | Make the save real, or remove it | Option A (recommended): call `LoadGame()` when Game1 starts with a pending save, add Continue to the menu, delete the save on death/win. Option B: delete the save system and the site sentence. | No dead code behind a documented feature. | 2 |
| H8 | EditMode tests | Extract the XP curve, the offer builder (owned below cap → level N+1, unowned only while a slot is free) and damage/crit maths into pure classes and test them, the way the other two games are tested. | The portfolio's three games show the same testing discipline. | 3 |

**Not worth developing:** more arenas or biomes (the arena is store-pack scenery; a second one adds
hours and no systems), meta-progression/unlocks between runs, co-op, replacing the purchased art.
The rat model credit stays an owner task (find the modeller or swap the asset).

Total: **28 h**.

---

## Push Comes to Shove (IntotheMewgenics)

**Snapshot.** One level (`Level 1 Data`, ClearBoard; SurviveTurns is coded but unused), squad of 4 from
two player types (Human Soldier: melee 4, 14 HP; Elf Archer: ranged 3, 9 HP), 4 enemies from two types
(Orc, Goblin — same stats as their mirrors), weaknesses (+50 %), melee retaliation, cardinal BFS paths,
pits, on-turn enemy intent reveal, phase banner, result screen + Play Again, HD-2D look pass, hit flash,
animated sprites. 23 EditMode tests. No audio, menu, pause or settings. 36 MB web build.

| # | Title | Description | Objective | Hours |
|---|---|---|---|---|
| P1 | Make pushing real | Decide the rule and ship it: (a) melee hits shove 1 tile (`Melee Attack` PushAmount 1) so soldiers and orcs push into walls, allies and pits — recommended, it makes the title true with one data change plus tuning; (b) additionally a dedicated pusher unit later (P5). Playtest pit kills and wall damage, add tests for the new default, then rewrite the site/itch sentences to describe exactly what pushes. | The public copy and the game agree; the headline mechanic is playable. | 3 |
| P2 | Front end | Title screen (Play, How to play, Settings, Credits, Quit), Esc pause with resume/restart/quit, a how-to-play card (actions, retaliation, weakness, push outcomes, pits), settings with volume sliders (needs P3). | The game no longer boots into deployment with no explanation. | 4 |
| P3 | Audio from nothing | CC0 SFX (Kenney audio packs): footstep per tile, melee hit, arrow, retaliation, push/collision thud, pit fall, UI hover/click, turn-start, victory/defeat stings; one battle loop and one menu loop (CC0). An `AudioManager` with a mixer and PlayerPrefs volumes; credits on the itch page and the site. | A silent tactics game becomes one with feedback; the itch "audio" disclosure stays honest. | 4 |
| P4 | Level set and flow | Four hand-made levels as `LevelData` + tilemap prefabs: a teaching level, a pit-heavy level that rewards pushes, a SurviveTurns level (the objective is already implemented), a finale with more enemies. Level sequence with "Next level", a final victory screen, level select from the menu. | A 20-minute game with a difficulty curve instead of one board. | 6 |
| P5 | Roster and counters | Two new unit types from the purchased Sanctum packs: a goblin shaman with the unused `Line Attack` (1 dmg, push 1, line), and an orc brute (push 2, slow, high HP). Mirror one for the player side. Weakness web so every type has a counter; EditMode tests for the new attacks. | Composition decisions during deployment matter. | 4 |
| P6 | Attack preview and feel | Hovering a target shows the full outcome before confirming: damage with weakness, retaliation damage you will take, push direction and what it hits. End-turn confirmation when units still have actions. Collision shake, dust on pit fall, unit death animation, a short camera push-in on kills. | Perfect-information play is perfect in the UI too; outcomes feel physical. | 4 |
| P7 | Build size | Pad or trim the four 2266 × 1888 sheets to a multiple of 4 (or pack them in a Sprite Atlas), enable DXT/ASTC compression, disable mipmaps on pixel art, remove the PixelBattleText demo scene from the build. Expected: 36 MB → roughly 12 MB, and ~60 MB less VRAM. | Loads in a third of the time on itch. | 2 |

**Not worth developing:** the deferred lit-sprite pass (P2 of the HD-2D plan — cosmetic, risks board
readability, and the design doc already parked it); the full perspective-camera HD-2D conversion
(rebuilds picking and highlights for no gameplay gain); the campaign/roster meta loop; reviving the
Break mechanic (superseded by the on-turn reveal); commander abilities.

Total: **27 h**.

---

## Cinderhold

**Snapshot.** Two floors from ASCII maps, slime/bat/rat + boss Cinderclaw, telegraphed attacks,
weapons shop, XP/levels, JSON saves (PlayerPrefs on web), HUD with enemy health bars and damage numbers,
pause, death and win screens, Kenney pixel fonts, 99 tests, 13 MB build. SFX synthesised in code,
no music, no settings screen.

| # | Title | Description | Objective | Hours |
|---|---|---|---|---|
| C1 | Recorded audio and music | Replace `SfxSynth` calls behind the same interface with CC0 clips (Kenney RPG/impact/UI packs): swing, hit, enemy hurt/death per type, pickup, level-up, shop, portal, boss roar. Two CC0 loops (floors, boss). AudioMixer with music/SFX groups. Credits on the site, itch and `DESIGN.md`. | The one placeholder left in the game is gone. | 3 |
| C2 | Settings and controls | Volume sliders and a screen-shake toggle in pause and death screens, persisted in PlayerPrefs; a controls card with keyboard and gamepad glyphs. | Standard options for a browser game. | 2 |
| C3 | Dodge | A short dash with i-frames on a cooldown (new input action, keyboard + gamepad), tests on the `HealthPool` invulnerability window, telegraph timings re-tuned so dodging is the answer to the red mark rather than walking away. | The telegraph system gets its evasive verb; fights become reads instead of retreats. | 3 |
| C4 | Floor 3 with doors and keys | A third ASCII floor using the existing pipeline: locked door tiles, a key pickup, an armoured slime variant (data only), a mid-floor checkpoint. Save and floor tests extended. | Twice the length with one new mechanic, not just more rooms. | 4 |
| C5 | 2D lights and feel | URP 2D lights: torch glow on wall sconces, a soft player light, a red tint in the boss arena; death particles per enemy type, screen shake on heavy hits (toggle from C2), fade between floors, a boss health bar and intro beat. | The art reads as a dungeon, not a tile demo; big moments land. | 3 |
| C6 | Death and retry wording | Make the death screen say what happens ("Retry floor — enemies return, your level and weapons stay") and offer "Back to menu". | No surprise on restart (a playtest question). | 1 |
| C7 | Room generator (plan 5.1) — optional | Hand-made room templates stitched into a floor with doors and a key/lock; replaces the fixed floors for replay and gives the write-up a second technical section. | Replayable floors. Only after C1–C5; worth it for the technical story, not for playability. | 6 |

**Not worth developing:** VFX Graph or 3D lighting (the pixel buffer is the look), a story or dialogue,
online leaderboards.

Total: **16 h** (+6 optional).

---

## Cross-cutting (every game)

- Settings/volume UI (H3, P2, C2) — the same pattern three times; build it once and port it.
- Gamepad verified in the browser for all three (Cinderhold has bindings; Horde Hours preselects cards for a controller; Push Comes to Shove is mouse-only — acceptable for tactics).
- itch pages: one in-browser screenshot with the HUD per game; AI-disclosure answers consistent across the three.
- Site: short gameplay clips (owner records), and the Push Comes to Shove text corrected as part of P1.

## Progress

- **2026-10-21 — P1 done.** Melee shoves one tile (`PushSetup.All`), four pits on Level 1, amber landing-cell preview for the player's aim and the enemy's intent, shoves glide instead of snapping, seven `ShoveTests`. Build 0.2.0 (35 MB) — itch re-upload pending. Site and itch copy rewritten to the shipped rule. Owner playtested 2026-10-22: the shove and the amber preview work.
- **2026-10-22 — P3, P6, P2 done** (audio from CC0 packs, feel pass, front end) and **P7** (36 → 24 MB). Build 0.3.0 made.
- **2026-10-22 — review round** from the owner's recording: first-hit arrows, selection kept across modes, skinned buttons, readable menus with Polish letters, fixed sliders, animated result screen, deploy counter, selection and card blinks, audio swaps. Random board generation deferred (owner left it to me; playability first). Build 0.3.1 live on itch.io since 2026-10-22 (verified byte-identical).

- **2026-10-22 — H1 done.** `SpawnDirectorModel` (pure C#, own asmdef) + `SpawnSchedule` asset + `SpawnDirector` in Game1 (WaveManager disabled), per-spawn health/damage scaling via `EnemyScaling`, YOU SURVIVED at 10:00, HUD timer shows the goal. 7 EditMode tests (the project had none). Build 0.2.0 (28 MB); itch re-upload pending. Also found: the pause menu has Save and Load buttons wired in the scene, so the save is not write-only — H7 becomes a menu Continue only.

- **2026-10-22 — Horde Hours review round (0.2.1)** from the owner's recording: Zap shaders target 3.5 (were magenta on WebGL), night lighting + player lamp, level-up dim, inventory cornered, pointer lock on click, menu restyled with music, four stings. 12 EditMode tests. Build 0.2.1 (29 MB); itch re-upload pending. Not done: the aura/ring look (left as is), pause-panel restyle. **Fix round 0.2.2:** inventory back to its original place (the corner ran under the XP bar), a lamp for the level-up rats, the level-up sting removed (the game's own sound stays), stings/ticks and the menu theme ("Crystal Cave") chosen to differ from Push Comes to Shove. **0.2.3:** the timer ("00:19 / 10:00") wrapped onto the XP bar; now one line, 760 px wide, under the bar. **0.2.4:** the dancing rats and their assets (unknown-modeller Mixamo rig) removed at the owner's request, so that credit line is gone too; the pointer lock is re-taken inside the level-up card click and the Resume click (browsers only grant it inside a gesture). 0.2.4 live on itch.io since 2026-10-22 (verified byte-identical).

- **2026-10-22 — C1 done.** `AudioLibrary` in Resources + `SfxPlayer` with the synth as fallback, `MusicPlayer` crossfade (floor loop → boss loop on Cinderclaw's aggro, back on its death), `AudioVolumes` in PlayerPrefs instead of a mixer, new sounds (portal, escape, pause, boss roar/death) on new static events, `boss` flag on `EnemyDefinition`. Kenney clips chosen to differ from both other games; cynicmusic "Dark Forest Theme" and "Dramatic Boss Encounter" downloaded with the owner's OK. 82 EditMode + 27 PlayMode tests. Build 0.2.0 (superseded by 0.2.1 before upload). Owner played the whole run on 2026-10-25: sounds good.
- **2026-10-25 — C2 + C6 done.** Settings rows (master, music, effects, screen shake) and a controls card in the pause panel, driven by the Move action (no EventSystem — keyboard and gamepad alike), `SettingsModel` pure + `SettingsPanel`, `FeelSettings` in PlayerPrefs, `CameraFollow` honours the toggle; death screen wording ("Back to menu" dropped: the game has no menu scene). 85 EditMode + 29 PlayMode tests. Build 0.2.1 live on itch.io since 2026-10-25 (verified byte-identical).
- **2026-10-25 — H3 + H4 done.** `RunSummary` (pure, Director asmdef) + `RunResultsScreen` on the game-over panel (time of goal, level, kills, build icons with levels); `VolumePrefs` + `AudioSettingsPanel` sliders in the pause panel and a menu Settings screen (`SettingsSetup.All` builds them, `HordeHoursSetup.BuildMenuScene` the menu), `MenuMusicVolume`; mix defaults on the AudioManager prefab, music ducking (`SetDucked`) under level-up and results, the four unreferenced WAVs deleted. The boss/elite cue waits for H2 (there is no boss yet). 18 EditMode tests. Build 0.2.5 live on itch.io since 2026-10-25 (verified byte-identical).
- **2026-10-25 — H2 done (0.3.0).** `RolesSetup.All`: roles on the four prefabs via `EnemyMovement.role` + pure `EnemySteering` (Chase / Orbit / KeepDistance, staggered repath), `EnemyRanged` + pooled `BoneProjectile` (BTM Skull and Bones model) for skeletons, `EnemyKnockback.resistance` for zombies, `EliteMarker` (from 5:00, 4 → 10 %, ×1.4 size, ×4 health, ×1.5 damage, 5 gems, gold tint via property block), `Boss_Enemy` = zombie prefab variant ×2.6 with `BossBrain` + pure `ChargeCycle` (telegraphed charge), at 9:00 once (never after a Continue past 9:00), `BossHealthBar` on the HUD, `HealthController.gemDrops`; Kenney cues STEEL04 / STEEL10 / impactMetal_heavy_001 / impactWood_heavy_001 (unused elsewhere) — the H4 boss/elite cue is done with it. Local preview build with elites at 0:20 and the boss at 0:45 (`RolesSetup.PreviewOn/Off`, never uploaded). 32 EditMode tests. Build 0.3.0, live on itch.io since 2026-10-25 (verified byte-identical, upload html/20022525). Boss name "THE HORDE LORD" is a placeholder (one field on `BossBrain`). Found while checking the preview build: Game1's `SpawnDirector.schedule` had been empty since H1, so the game ran on `DirectorSettings.Default()` (same numbers, so play was unaffected, but tuning the asset did nothing); now wired by `RolesSetup` and pinned by a test.
- **2026-10-25 — H7 done (option A).** `ContinueSetup.All`: Continue button first in a vertical layout column on the menu (shown by `MainMenuManager.Start` while `SaveSystemManager.HasSave()`), `ContinueLoader` in Game1 restores the save a frame after start when the menu asked, `SpawnDirector` implements `ISaveSystemElement` and skips its model to the saved time (`SpawnDirectorModel.SkipTo`, tested), `GameOverManager` deletes the save on death/win. Found while testing: the web save was a file in persistentDataPath, which the browser never flushed, so it vanished on reload — the save now lives in PlayerPrefs on the web (a file elsewhere), verified across a reload in the preview. 21 EditMode tests. Build 0.2.6 live on itch.io since 2026-10-25 (verified byte-identical and loading in a browser; re-uploaded once after a cached 404).

## Beyond this plan (owner, 2026-10-25)

After playing Cinderhold 0.2.0 the owner said the game has the potential to grow well past this list: animations, better-looking visuals, balance, NPCs, deeper lore, quests, challenges, more levels, a responsive environment — a more ambitious approach in general, for every game. Agreed direction: finish the items above first, then plan the further development of each game as its own document, with the work done in the Unity Editor rather than headless scripts where that is faster. Each of those plans needs title, description, objective and hours per task.

## Suggested order

1. **P1** — the copy must match the game before anything else is published.
2. **H1** — the biggest playability hole.
3. **P3 + P2** — silence and no menu are the next most visible gaps.
4. **H3 + H4**, then **C1 + C2** — settings and sound everywhere.
5. **P4**, then **H6 + H7**, then **C3 + C5**.
6. **P5 + P6 + P7**, **H2 + H5 + H8**, **C4**.
7. Optional: **C7**.

Totals: Horde Hours 28 h · Push Comes to Shove 27 h · Cinderhold 16 h (+6) · **71 h**, or about 50 h
if the "polish" rows (H5, P6, C5) and the optional generator are left out.
