---
title: Cinderhold
summary: A 2D top-down dungeon crawler with telegraphed enemy attacks — data-driven weapons, enemy state machines, JSON saves, and floors stitched from hand-made rooms every run, with locked doors a check keeps fair.
genre: 2D dungeon crawler / roguelite
status: playable
itchUrl: https://phanto-official.itch.io/cinderhold
dates:
  start: "2026-10"   # rework start; the original tutorial-based prototype dates from Jun–Jul 2025
role: Solo — design & programming
engine: Unity 6 · URP 2D
order: 3
highlights:
  - Data-driven melee + tested health model
  - Enemy state machines, boss as data
  - Loot, shop and JSON saves, all tested
  - Room generator with a fairness check
myContribution:
  - "Foundation (October 2026): a fresh Unity 6 project started from the empty Universal 2D template, so every later commit is diffable against a known-empty start. Assembly definitions for runtime and editor code, an Input System actions asset (move, attack, interact, pause; keyboard and gamepad), the Kenney Tiny Dungeon sheet sliced into 132 sprites with Tile assets and a palette, a playground room on Tilemaps with a merged composite wall collider, a pixel-perfect camera (320×180 reference, 16 px per unit) and a Rigidbody2D-driven player mover."
  - "Reproducible setup: the whole foundation is created by one idempotent editor script that runs headlessly from the command line — no hand-edited scene or project YAML."
  - "Combat core: weapons are ScriptableObjects (damage, knockback, hit-stop, windup / active / recovery / cooldown, reach, hitbox, swing arc). A `MeleeAttacker` swings any of them: after the windup it checks an oriented overlap box every frame of the active window and hits each `IDamageable` once per swing. Health lives in a plain C# `HealthPool` (clamping, invulnerability frames, death exactly once) wrapped by a thin component, so the rules are unit-tested without Unity. Feedback without extra assets: 50 ms hit-stop on the unscaled clock, colour flash and squash, ease-out knockback that movement scripts yield to, and a weapon sprite sweeping the arc. Attack input is buffered for 150 ms."
  - "Enemy AI: each enemy type is an `EnemyDefinition` asset (look, health, speeds, sight, attack pattern, cowardice) applied to one generic prefab at spawn. Behaviour is a small state machine whose states — Idle, Patrol, Chase, Attack, Flee, Recover — are plain C# objects that only see an interface: senses (sight range with hysteresis, line of sight against walls, a short memory of the last seen position, an alert after being hit) and actuators (move, stop, swing). Attacks are telegraphed on the floor from the weapon's hitbox during the windup, followed by a pause that is the player's punish window. Cowards flee at low health, recover out of sight, and cannot flee again for a while so they end up fighting. The boss, Cinderclaw, is the same brain with a cycling attack pattern (slam, slam, sweep); no boss-specific code."
  - "Progression and persistence: enemies carry XP and coin rewards as data and drop pickups that fly to the player; a plain C# progress model handles levels (each level adds max health and refills), XP carry-over and coins; a smith's station in the room sells better weapons through a small interaction layer (nearest usable object in range, one Interact action). Saving is a version plus a list of named JSON blobs — every component with state worth keeping writes its own small record — behind a swappable store: PlayerPrefs in the browser build, memory in tests. One session object decides when to load and autosave, so gameplay code never writes files."
  - "Interface and feel: a screen-space HUD (health pips, XP bar and level, coins, equipped weapon, interaction prompt) driven by the same events the gameplay raises, a death screen that restarts from the last autosave, pause on a single game clock that also owns hit-stop so the two can never cancel each other, pooled floating damage numbers, camera shake scaled by what happened, and sound effects that were at first synthesised from square, saw, sine and noise waves at start — no audio files, no licences to track, and one class to swap when recorded sounds arrived. None of the effects are known to the gameplay code; they subscribe to global events."
  - "Tests: EditMode tests cover the health pool, cooldown, hitbox geometry, every AI state transition through a fake context, the attack pattern, the level curve and progress model, the shop rules, the save format, the game clock, the sound synthesis, the audio library, the settings list, the dodge and its invulnerability window, the key ring and the saved state of keys and doors, a check that no floor can strand the player, and the room generator over 300 seeds per floor (105 tests); PlayMode tests instantiate the real prefabs and data and check the sword kill loop, enemy chasing and biting, the bat's flee-and-recover, loot collection after a kill, level-up healing, shop purchases, a full save/load round trip, the HUD, death screen, pause and damage popups against the real prefabs, the dodge, the lights and the boss encounter on the real floors, the keys, locked doors and checkpoint on a generated Floor 2, and a render of a generated floor with its torches on and off to prove they light it (41 tests). Both suites run headlessly from the command line like the builds."
  - "Floors and the run: floors authored as text (whole maps until 0.4.0, room templates since 0.5.0) and built by the same editor script, a smith on each, an exit sealed by the guardian on the last floor, a win screen, and checkpoints on arrival so the build can boot into the floor a save belongs to."
  - "First playtest (a recorded run with commentary) drove a revision pass: the walls had no collision in the web build because a composite collider built by script produced no geometry at runtime, which a scene-level test now guards; mouse attacks aim at the cursor; damage numbers moved from world space to the HUD so they are legible at the pixel scale; enemies got health bars; health, enemy pacing and heart drops were tuned after a 36-second first death; a short controls hint appears on each floor."
  - "Recorded audio (0.2.0): every sound is now a CC0 clip from Kenney's Impact, RPG, Interface and Music Jingles packs, chosen so that none of them is a sound of my other two games (swings are cloth whooshes, the player's hurt is a plate-armour clank, deaths are tolls on a bell pitched down, the boss roars with a slowed door creak). A library asset in Resources maps each sound id to its clips, level, pitch and jitter; the synthesised versions stay behind it as a fallback, so an id without a recording still sounds. Two cynicmusic loops (CC0): a brooding guitar theme on the floors and a drums-and-violin track that crossfades in when Cinderclaw notices you and out again when it dies; the floor loop carries through portals because the music player survives scene loads. New sounds for the portal, the escape, pausing and the boss, and three persisted volumes (master, music, effects) for the settings screen to come."
  - "Settings (0.2.1): the pause panel holds master, music and effects volume and a screen-shake toggle, driven by the Move action so keyboard and gamepad work without a mouse or an EventSystem; the list is a plain C# model (select, adjust, clamp, wrap) with the drawing kept apart, values persist in PlayerPrefs, and the same panel carries a controls card for both input schemes. The death screen now says what a retry does: the floor restarts from the last checkpoint, enemies return, your level, coins and weapon stay."
  - "Dodge (0.3.0): Shift, K, right mouse, or B / RB on a pad dashes about two and a half tiles through enemies with hits ignored for a quarter of a second, on a cooldown shown as a gauge by the weapon icon. The rhythm (dash, window, cooldown) is a plain C# model with tests, and the window is a new rule on the health pool: grant invulnerability for at least this long, never shortening a longer one. A hit the window swallows says \"Dodged\". Walls still stop the dash, which a PlayMode test checks on the real floor. Enemy windups were shortened and their hit boxes widened, so the red mark is answered by dodging rather than by walking away."
  - "Light and feel (0.3.0): the floors went dark (a dim, cool global 2D light) and are lit by flickering sconces placed from the text maps, a warm light the player carries, a portal that glows brighter once it opens and a red light in the boss room that swells when Cinderclaw notices you. The boss gets an entrance: its name across the screen, a camera shake and a health bar that stays until it falls, all driven by one encounter component the bar, the light and the music cue listen to. Enemies burst into chips in their own colour from a single particle system, and moving between floors fades through black."
  - "Keys and a third floor (0.4.0): a new Floor 2 between the first floor and Cinderclaw's, so the boss stays last. Two locked doors, two keys guarded in side rooms, a waystone halfway that lights up and saves the run, and an armoured slime (the slime's sprite in iron, over twice the health, barely pushed) that is only a new data asset and a tint. A locked door sits on the wall layer, so it stops bodies, dashes and enemy sight until a key is spent on it. Keys, doors and the waystone each save one flag under their map cell, so a restart from the waystone keeps opened doors open and spent keys gone, and a death before it puts the key back. The map build refuses a floor where some order of spending keys could lock the exit away: it tries every order with a flood fill, and a test pins the rule with a trap map. The key and padlock are 16 px pixel art drawn by the setup script in the tileset's own palette, since the pack has no key."
  - "Generated floors (0.5.0): Floors 1 and 2 are stitched from ten hand-made 10×7 room templates when they load, so each run has a new layout; Cinderclaw's floor stays hand-made. A seeded walk on a small grid lays a line of rooms from the spawn to the exit, side rooms hang off it, and rooms share walls with a doorway in the middle. On Floor 2 two doorways on the line are locked and each key goes in a room the player reaches before its door, with the waystone just past the first lock. Every layout must pass the same flood-fill check the hand-made floors did (no order of spending keys strands the player), plus: the exit really is locked away, no room is sealed off, enough enemies survive the thinning. A layout that fails is thrown away and the next seed is tried; a test runs 300 seeds per floor. The run's seed is saved, so a death, a reload or the waystone bring back the same floor with the doors you opened, and a new game rolls a new one. The tests that walked the player into a wall at a known spot now look up a fitting spot on whatever map was generated."
  - "Most of the code was written with an AI assistant (Claude Code) under my direction: I set the scope and the order of the systems, decided the design rules (telegraphed attacks, data over code, one clock), reviewed every change and its tests, and chose what to cut. The commits say so."
  - "The earlier prototype (June–July 2025) followed a beginner tutorial and is not presented as my work; it is kept only as a frozen reference."
tools:
  - Unity 6000.6 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
  - TextMesh Pro
  - Unity Test Framework (EditMode + PlayMode, run headlessly)
  - Claude Code
media:
  - { type: image, src: /media/cinderhold/floor1-spawn.webp, alt: "A generated Floor 1 of Cinderhold: the knight in the spawn room under two lit sconces, a crate and a barrel, doorways in the brick walls it shares with the neighbouring rooms, and a slime in the next room", caption: "Fig. 1 — a generated Floor 1, the spawn room (rendered from the scene at the game's 4× framing)" }
  - { type: image, src: /media/cinderhold/floor1-exit.webp, alt: "The exit room of the same floor: the glowing exit under two sconces, two barrels, a block of wall inside the room, and darkness outside the rooms", caption: "Fig. 2 — the way down, at the end of the line of rooms" }
  - { type: image, src: /media/cinderhold/floor2-locks.webp, alt: "A generated Floor 2: a door with a gold padlock in the west wall, the grey waystone in the room behind it, a dark teal armoured slime and a green slime, two bats, the smith's anvil in a room above and a key glinting in the next room", caption: "Fig. 3 — a generated Floor 2: the first locked door, the waystone behind it, and armoured slimes" }
  - { type: image, src: /media/cinderhold/floor3-boss.webp, alt: "Floor 3's guardian room: the large red Cinderclaw next to the sealed exit", caption: "Fig. 4 — Cinderclaw seals the last exit until it falls" }
credits:
  - { asset: "Tiny Dungeon tileset and characters", author: "Kenney", url: "https://kenney.nl/assets/tiny-dungeon", license: "CC0" }
  - { asset: "Kenney Fonts: Kenney Mini and Kenney Mini Square (UI)", author: "Kenney", url: "https://kenney.nl/assets/kenney-fonts", license: "CC0" }
  - { asset: "Liberation Sans (TextMesh Pro's bundled default font, shipped but not used for display)", author: "Red Hat", url: "https://github.com/liberationfonts/liberation-fonts", license: "SIL Open Font License" }
  - { asset: "Impact Sounds, RPG Audio, Interface Sounds, Music Jingles (sound effects)", author: "Kenney", url: "https://kenney.nl/assets", license: "CC0" }
  - { asset: "Dark Forest Theme (floor music)", author: "cynicmusic", url: "https://opengameart.org/content/dark-forest-theme", license: "CC0, credit to pixelsphere.org requested" }
  - { asset: "Dramatic Boss Encounter (boss music)", author: "cynicmusic", url: "https://opengameart.org/content/dramatic-boss-encounter", license: "CC0, credit to pixelsphere.org requested" }
---

## The game

Cinderhold is a short top-down dungeon crawler. You fight down three floors of slimes, bats and rats, level up for more health, buy a heavier weapon from the smith with the coins they drop, find the keys to the second floor's locked doors, and face Cinderclaw, the guardian that seals the last exit. The first two floors are put together from hand-made rooms each run, so no two runs share a layout. Every enemy attack is marked on the floor before it lands: dodge through the red mark, then punish. It is small on purpose, a complete loop that runs in the browser.

The first version of this project, in 2025, was a tutorial follow-along. It is kept only as a frozen reference and nothing from it is reused; the current game started in October 2026 from Unity's empty 2D template.

## Technical breakdown

### 1. Enemies as small state machines

Each enemy type is an `EnemyDefinition` asset (sprite, health, speeds, sight range, an attack pattern and how cowardly it is) applied to one generic prefab at spawn. Behaviour is six states. They are plain C# objects that only see an interface of senses and actions, so every transition is tested against a fake instead of a scene.

<figure class="diagram">
<svg viewBox="0 0 760 320" role="img" aria-labelledby="sm-t sm-d">
<title id="sm-t">Enemy state machine</title>
<desc id="sm-d">Idle and Patrol alternate on timers. Seeing the player or being hit starts a Chase. In range and in sight, Chase becomes Attack; when the target steps out of range, Attack returns to Chase. Losing sight for longer than the enemy's memory returns Chase to Idle. At low health, a cowardly enemy Flees; when it is far enough away or cornered it Recovers, an idle that ignores the player, then patrols again.</desc>
<defs><marker id="sm-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b9a68f"/></marker></defs>
<g fill="#3a3224" stroke="#5d412b">
<rect x="40" y="60" width="120" height="44" rx="10"/>
<rect x="40" y="196" width="120" height="44" rx="10"/>
<rect x="320" y="128" width="120" height="44" rx="10"/>
<rect x="600" y="60" width="120" height="44" rx="10" stroke="#f27c52"/>
<rect x="600" y="196" width="120" height="44" rx="10" stroke="#cab5ce"/>
<rect x="320" y="250" width="120" height="44" rx="10"/>
</g>
<g class="mono" font-size="13" fill="#f6d370" text-anchor="middle">
<text x="100" y="87">IDLE</text><text x="100" y="223">PATROL</text><text x="380" y="155">CHASE</text>
<text x="660" y="87" fill="#f27c52">ATTACK</text><text x="660" y="223" fill="#cab5ce">FLEE</text><text x="380" y="277">RECOVER</text>
</g>
<g fill="none" stroke="#b9a68f" stroke-width="1.5" marker-end="url(#sm-ah)">
<line x1="84" y1="106" x2="84" y2="192"/>
<line x1="116" y1="194" x2="116" y2="108"/>
<line x1="162" y1="90" x2="316" y2="138"/>
<line x1="162" y1="212" x2="316" y2="162"/>
<path d="M380 126 Q300 30 164 62"/>
<line x1="442" y1="140" x2="596" y2="92"/>
<path d="M620 106 Q560 172 444 162"/>
<line x1="660" y1="106" x2="660" y2="192"/>
<line x1="442" y1="166" x2="596" y2="210"/>
<line x1="598" y1="232" x2="444" y2="266"/>
<line x1="318" y1="268" x2="164" y2="230"/>
</g>
<g class="mono" font-size="10.5" fill="#b9a68f">
<text x="78" y="152" text-anchor="end">time up</text>
<text x="124" y="152">arrived</text>
<text x="234" y="140" text-anchor="middle">sees player or is hit</text>
<text x="286" y="50" text-anchor="middle">lost sight longer than memory</text>
<text x="515" y="80" text-anchor="middle">in range and in sight</text>
<text x="545" y="180" text-anchor="middle">out of range</text>
<text x="668" y="154">low health</text>
<text x="530" y="290" text-anchor="middle">far enough or cornered</text>
<text x="240" y="274" text-anchor="middle">time up</text>
</g>
</svg>
<figcaption>Fig. — the six states. Recover is an idle that ignores the player, so an enemy that has just fled is not pulled straight back into the fight.</figcaption>
</figure>

The attack state carries the pacing rule that makes fights readable: swing, wait the swing out, then pause before deciding again. That pause is the player's window to hit back.

```csharp
public override EnemyState Tick(IEnemyContext ctx, float dt)
{
    EnemyStats s = ctx.Stats;
    if (!ctx.HasTarget) return new IdleState(s.RandomIdleTime(ctx.Random01()));
    if (ctx.IsAttacking) return null;

    if (_swung)
    {
        _pause += dt;
        if (_pause < s.AttackPause) return null;
        if (ctx.CanFlee) return new FleeState();
        _swung = false;
        _pause = 0f;
    }

    if (ctx.DistanceToTarget > s.AttackRange * LeaveRangeFactor) return new ChaseState();

    Vector2 direction = ctx.TargetPosition - ctx.Position;
    if (ctx.TryAttack(direction)) _swung = true;
    return null; // weapon on cooldown: hold position and try again next tick
}
```
<p class="excerpt-caption">AttackState.cs — <code>Tick</code>, unedited. A state returns the next state, or null to keep running.</p>

The boss is the same brain with a longer weapon list (slam, slam, sweep). There is no boss-specific code.

### 2. Floors from rooms written as text

Floors started as whole text maps inside an editor script: walls, lit sconces, doorways, locked doors, keys, the checkpoint, props, the spawn, the smith, the exit and every enemy, built into scenes from the command line. Since 0.5.0 the first two floors are made from ten room templates in the same notation, stitched together when the floor loads.

```text
..........
.?......S.
..##..##..
..........
..##..##..
.S......?.
..........
```
<p class="excerpt-caption">One of the ten room templates. # wall · S slime · ? a spot where the spawn, the exit, a key, the waystone or the smith may go. The middle of each side stays clear for a doorway.</p>

The generator lays a line of rooms from the spawn to the exit on a 4×3 grid, hangs side rooms off it and opens doorways in the walls the rooms share. On the keys floor it locks two doorways on the line and puts each key in a room you reach before its door. Then it checks the result with the flood fill that guarded the hand-made floors: every order of spending keys on doors is tried, and if any leaves the exit out of reach, the layout is thrown away and the next one tried. The same check also refuses a floor whose exit can be reached without keys, a room nobody can get into, or a floor the thinning left nearly empty. The seed is saved with the run, so a retry brings back the same floor and the doors you opened stay open.

### 3. A playtest that became a test

The first recorded playtest showed the player walking straight through walls. The cause was a composite collider that, built by script, produced no geometry at runtime, and the unit tests could not see it because they never loaded a floor. The fix shipped with a test that loads Floor 1 and drives the player and an enemy into a wall, so the same failure cannot return unnoticed.

### What's next

This finishes the upgrade list I set for the game. The next plan is a wider one: animations, better visuals, balance and more to find on each floor.
