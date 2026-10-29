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
metrics:
  - 105 EditMode + 41 PlayMode tests
  - 300-seed flood-fill fairness check
  - Idempotent headless setup script
myContribution:
  - "Foundation & reproducible setup (October 2026): a fresh Unity 6 project started from the empty Universal 2D template created by one idempotent headless editor script — assembly definitions, Input System actions (keyboard + gamepad), Kenney Tiny Dungeon sliced into 132 sprites with Tile assets, a pixel-perfect camera (320×180 at 16 PPU) and no hand-edited scene YAML."
  - "Combat core: weapons are ScriptableObjects (damage, knockback, hit-stop, windup / active / recovery / cooldown, reach, hitbox, swing arc) driven by `MeleeAttacker` over `IDamageable` targets; health lives in a pure-C# `HealthPool` (clamping, invulnerability frames, dodge window, death once) wrapped by a thin component with 50 ms hit-stop, flash/squash and 150 ms input buffering."
  - "Enemy AI: each enemy type is an `EnemyDefinition` asset applied to one generic prefab at spawn. Behaviour is a six-state plain-C# state machine (Idle, Patrol, Chase, Attack, Flee, Recover) behind an `IEnemyContext` interface of senses and actuators, with telegraphed floor hitboxes and punish windows; the boss, Cinderclaw, uses the same brain with a cycling attack pattern."
  - "Generated floors & lock-fairness verifier (0.5.0): Floors 1 and 2 are stitched at load from ten hand-made 10×7 room templates via a seeded walk, with locked doors and keys placed before their locks; every generated layout must pass a flood-fill verifier proving no order of spending keys can strand the player (tested over 300 seeds per floor)."
  - "Progression, persistence & UI: pure-C# progress/level/shop models, versioned JSON save blobs over a swappable `ISaveStore` (PlayerPrefs on web, memory in tests), event-driven screen-space HUD, single `GameClock` owning both pause and hit-stop, and CC0 recorded audio backed by a procedural waveform synthesizer (`SfxSynth`) fallback."
  - "Tests: 105 EditMode tests and 41 PlayMode tests running headlessly from the command line, covering the health pool, AI state transitions, room generator over 300 seeds, save/load round trips, dodge invulnerability, locked-door checkpoints and torch lighting."
  - "Most of the code was written with Claude Code under my direction: I set the scope and the order of the systems, decided the design rules (telegraphed attacks, data over code, one clock), reviewed every change and its tests, and chose what to cut. The commits say so. The earlier June–July 2025 tutorial prototype is kept only as a frozen reference and not reused."
changelog:
  - "First playtest (a recorded run with commentary) drove a revision pass: the walls had no collision in the web build because a composite collider built by script produced no geometry at runtime, which a scene-level test now guards; mouse attacks aim at the cursor; damage numbers moved from world space to the HUD so they are legible at the pixel scale; enemies got health bars; health, enemy pacing and heart drops were tuned after a 36-second first death; a short controls hint appears on each floor."
  - "Recorded audio (0.2.0): every sound is now a CC0 clip from Kenney's Impact, RPG, Interface and Music Jingles packs, chosen so that none of them is a sound of my other two games (swings are cloth whooshes, the player's hurt is a plate-armour clank, deaths are tolls on a bell pitched down, the boss roars with a slowed door creak). A library asset in Resources maps each sound id to its clips, level, pitch and jitter; the synthesised versions stay behind it as a fallback, so an id without a recording still sounds. Two cynicmusic loops (CC0): a brooding guitar theme on the floors and a drums-and-violin track that crossfades in when Cinderclaw notices you and out again when it dies; the floor loop carries through portals because the music player survives scene loads."
  - "Settings (0.2.1): the pause panel holds master, music and effects volume and a screen-shake toggle, driven by the Move action so keyboard and gamepad work without a mouse or an EventSystem; the list is a plain C# model (select, adjust, clamp, wrap) with the drawing kept apart, values persist in PlayerPrefs, and the same panel carries a controls card for both input schemes. The death screen now says what a retry does: the floor restarts from the last checkpoint, enemies return, your level, coins and weapon stay."
  - "Dodge (0.3.0): Shift, K, right mouse, or B / RB on a pad dashes about two and a half tiles through enemies with hits ignored for a quarter of a second, on a cooldown shown as a gauge by the weapon icon. The rhythm (dash, window, cooldown) is a plain C# model with tests, and the window is a new rule on the health pool: grant invulnerability for at least this long, never shortening a longer one. A hit the window swallows says \"Dodged\". Walls still stop the dash, which a PlayMode test checks on the real floor."
  - "Light and feel (0.3.0): the floors went dark (a dim, cool global 2D light) and are lit by flickering sconces placed from the text maps, a warm light the player carries, a portal that glows brighter once it opens and a red light in the boss room that swells when Cinderclaw notices you. The boss gets an entrance: its name across the screen, a camera shake and a health bar that stays until it falls, all driven by one encounter component the bar, the light and the music cue listen to."
  - "Keys and a third floor (0.4.0): a new Floor 2 between the first floor and Cinderclaw's, so the boss stays last. Two locked doors, two keys guarded in side rooms, a waystone halfway that lights up and saves the run, and an armoured slime (the slime's sprite in iron, over twice the health, barely pushed) that is only a new data asset and a tint. The map build refuses a floor where some order of spending keys could lock the exit away: it tries every order with a flood fill, and a test pins the rule with a trap map."
tools:
  - Unity 6000.6 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
  - TextMesh Pro
  - Unity Test Framework (EditMode + PlayMode, run headlessly)
  - Claude Code
media:
  - { type: image, src: /media/cinderhold/cover.avif, alt: "Cinderhold pixel-art key art: the knight mid-dodge with afterimages escaping Cinderclaw's glowing red floor telegraph in a torchlit dungeon", caption: "Fig. 1 — Cinderhold key art: dodging Cinderclaw's telegraphed slam" }
  - { type: image, src: /media/cinderhold/hud-live.avif, alt: "Live 0.5.0 WebGL build on a generated Floor 1 showing the knight under flickering wall sconces, health pips, level bar, sword and Dodge cooldown gauge", caption: "Fig. 2 — 0.5.0 web build: generated Floor 1 with full HUD and Dodge gauge" }
  - { type: image, src: /media/cinderhold/floor1-spawn.avif, alt: "A generated Floor 1 of Cinderhold: the knight in the spawn room under two lit sconces, a crate and a barrel, doorways in the brick walls it shares with the neighbouring rooms, and a slime in the next room", caption: "Fig. 3 — a generated Floor 1, the spawn room (rendered from the scene at the game's 4× framing)" }
  - { type: image, src: /media/cinderhold/floor1-exit.avif, alt: "The exit room of the same floor: the glowing exit under two sconces, two barrels, a block of wall inside the room, and darkness outside the rooms", caption: "Fig. 4 — the way down, at the end of the line of rooms" }
  - { type: image, src: /media/cinderhold/floor2-locks.avif, alt: "A generated Floor 2: a door with a gold padlock in the west wall, the grey waystone in the room behind it, a dark teal armoured slime and a green slime, two bats, the smith's anvil in a room above and a key glinting in the next room", caption: "Fig. 5 — a generated Floor 2: the first locked door, the waystone behind it, and armoured slimes" }
  - { type: image, src: /media/cinderhold/floor3-boss.avif, alt: "Floor 3's guardian room: the large red Cinderclaw next to the sealed exit", caption: "Fig. 6 — Cinderclaw seals the last exit until it falls" }
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
