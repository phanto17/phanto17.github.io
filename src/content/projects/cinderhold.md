---
title: Cinderhold
summary: A 2D top-down dungeon crawler with telegraphed enemy attacks — data-driven weapons, enemy state machines, a weapon shop, JSON saves and two hand-made floors.
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
myContribution:
  - "Foundation (October 2026): a fresh Unity 6 project started from the empty Universal 2D template, so every later commit is diffable against a known-empty start. Assembly definitions for runtime and editor code, an Input System actions asset (move, attack, interact, pause; keyboard and gamepad), the Kenney Tiny Dungeon sheet sliced into 132 sprites with Tile assets and a palette, a playground room on Tilemaps with a merged composite wall collider, a pixel-perfect camera (320×180 reference, 16 px per unit) and a Rigidbody2D-driven player mover."
  - "Reproducible setup: the whole foundation is created by one idempotent editor script that runs headlessly from the command line — no hand-edited scene or project YAML."
  - "Combat core: weapons are ScriptableObjects (damage, knockback, hit-stop, windup / active / recovery / cooldown, reach, hitbox, swing arc). A `MeleeAttacker` swings any of them: after the windup it checks an oriented overlap box every frame of the active window and hits each `IDamageable` once per swing. Health lives in a plain C# `HealthPool` (clamping, invulnerability frames, death exactly once) wrapped by a thin component, so the rules are unit-tested without Unity. Feedback without extra assets: 50 ms hit-stop on the unscaled clock, colour flash and squash, ease-out knockback that movement scripts yield to, and a weapon sprite sweeping the arc. Attack input is buffered for 150 ms."
  - "Enemy AI: each enemy type is an `EnemyDefinition` asset (look, health, speeds, sight, attack pattern, cowardice) applied to one generic prefab at spawn. Behaviour is a small state machine whose states — Idle, Patrol, Chase, Attack, Flee, Recover — are plain C# objects that only see an interface: senses (sight range with hysteresis, line of sight against walls, a short memory of the last seen position, an alert after being hit) and actuators (move, stop, swing). Attacks are telegraphed on the floor from the weapon's hitbox during the windup, followed by a pause that is the player's punish window. Cowards flee at low health, recover out of sight, and cannot flee again for a while so they end up fighting. The boss, Cinderclaw, is the same brain with a cycling attack pattern (slam, slam, sweep); no boss-specific code."
  - "Progression and persistence: enemies carry XP and coin rewards as data and drop pickups that fly to the player; a plain C# progress model handles levels (each level adds max health and refills), XP carry-over and coins; a smith's station in the room sells better weapons through a small interaction layer (nearest usable object in range, one Interact action). Saving is a version plus a list of named JSON blobs — every component with state worth keeping writes its own small record — behind a swappable store: PlayerPrefs in the browser build, memory in tests. One session object decides when to load and autosave, so gameplay code never writes files."
  - "Interface and feel: a screen-space HUD (health pips, XP bar and level, coins, equipped weapon, interaction prompt) driven by the same events the gameplay raises, a death screen that restarts from the last autosave, pause on a single game clock that also owns hit-stop so the two can never cancel each other, pooled floating damage numbers, camera shake scaled by what happened, and sound effects that were at first synthesised from square, saw, sine and noise waves at start — no audio files, no licences to track, and one class to swap when recorded sounds arrived. None of the effects are known to the gameplay code; they subscribe to global events."
  - "Tests: EditMode tests cover the health pool, cooldown, hitbox geometry, every AI state transition through a fake context, the attack pattern, the level curve and progress model, the shop rules, the save format, the game clock, the sound synthesis and the audio library (82 tests); PlayMode tests instantiate the real prefabs and data and check the sword kill loop, enemy chasing and biting, the bat's flee-and-recover, loot collection after a kill, level-up healing, shop purchases, a full save/load round trip, and the HUD, death screen, pause and damage popups against the real prefabs (27 tests). Both suites run headlessly from the command line like the builds."
  - "Floors and the run: two hand-made floors authored as text maps and built into scenes by the same editor script, a smith on each, an exit sealed by the guardian on the second floor, a win screen, and checkpoints on arrival so the build can boot into the floor a save belongs to."
  - "First playtest (a recorded run with commentary) drove a revision pass: the walls had no collision in the web build because a composite collider built by script produced no geometry at runtime, which a scene-level test now guards; mouse attacks aim at the cursor; damage numbers moved from world space to the HUD so they are legible at the pixel scale; enemies got health bars; health, enemy pacing and heart drops were tuned after a 36-second first death; a short controls hint appears on each floor."
  - "Recorded audio (0.2.0): every sound is now a CC0 clip from Kenney's Impact, RPG, Interface and Music Jingles packs, chosen so that none of them is a sound of my other two games (swings are cloth whooshes, the player's hurt is a plate-armour clank, deaths are tolls on a bell pitched down, the boss roars with a slowed door creak). A library asset in Resources maps each sound id to its clips, level, pitch and jitter; the synthesised versions stay behind it as a fallback, so an id without a recording still sounds. Two cynicmusic loops (CC0): a brooding guitar theme on the floors and a drums-and-violin track that crossfades in when Cinderclaw notices you and out again when it dies; the floor loop carries through portals because the music player survives scene loads. New sounds for the portal, the escape, pausing and the boss, and three persisted volumes (master, music, effects) for the settings screen to come."
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
  - { type: image, src: /media/cinderhold/floor1-spawn.webp, alt: "Floor 1 of Cinderhold: the knight at the spawn room with a slime and a bat nearby, grey brick walls and a doorway", caption: "Fig. 1 — Floor 1, the first room (rendered from the scene at the game's 4× framing)" }
  - { type: image, src: /media/cinderhold/floor1-exit.webp, alt: "The lower room of Floor 1 with the smith's anvil, a crate, a barrel and the glowing exit stairs", caption: "Fig. 2 — the smith and the way down" }
  - { type: image, src: /media/cinderhold/floor2-boss.webp, alt: "Floor 2's guardian room: the large red Cinderclaw next to the sealed exit", caption: "Fig. 3 — Cinderclaw seals the last exit until it falls" }
credits:
  - { asset: "Tiny Dungeon tileset and characters", author: "Kenney", url: "https://kenney.nl/assets/tiny-dungeon", license: "CC0" }
  - { asset: "Kenney Fonts: Kenney Mini and Kenney Mini Square (UI)", author: "Kenney", url: "https://kenney.nl/assets/kenney-fonts", license: "CC0" }
  - { asset: "Liberation Sans (TextMesh Pro's bundled default font, shipped but not used for display)", author: "Red Hat", url: "https://github.com/liberationfonts/liberation-fonts", license: "SIL Open Font License" }
  - { asset: "Impact Sounds, RPG Audio, Interface Sounds, Music Jingles (sound effects)", author: "Kenney", url: "https://kenney.nl/assets", license: "CC0" }
  - { asset: "Dark Forest Theme (floor music)", author: "cynicmusic", url: "https://opengameart.org/content/dark-forest-theme", license: "CC0, credit to pixelsphere.org requested" }
  - { asset: "Dramatic Boss Encounter (boss music)", author: "cynicmusic", url: "https://opengameart.org/content/dramatic-boss-encounter", license: "CC0, credit to pixelsphere.org requested" }
---

## The game

Cinderhold is a short top-down dungeon crawler. You fight down two floors of slimes, bats and rats, level up for more health, buy a heavier weapon from the smith with the coins they drop, and face Cinderclaw, the guardian that seals the last exit. Every enemy attack is marked on the floor before it lands: step out of the red mark, then punish. It is small on purpose, a complete loop that runs in the browser.

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

### 2. Floors written as text

Both floors are text maps inside an editor script, built into scenes from the command line: walls, doorways, props, the spawn, the smith, the exit and every enemy. Changing a floor means editing a few characters and re-running one build step.

```text
####################
#.........#........#
#..S......#...B....#
#.........D........#
#....P....#........#
#.........#....S...#
#######D########...#
#.........$........#
#..B...............#
#........x...S....E#
#........b.........#
####################
```
<p class="excerpt-caption">Floor 1 as authored. # wall · D doorway · P spawn · $ smith · E exit · S slime · B bat · x crate · b barrel.</p>

### 3. A playtest that became a test

The first recorded playtest showed the player walking straight through walls. The cause was a composite collider that, built by script, produced no geometry at runtime, and the unit tests could not see it because they never loaded a floor. The fix shipped with a test that loads Floor 1 and drives the player and an enemy into a wall, so the same failure cannot return unnoticed.

### What's next

Recorded sound in place of the synthesised placeholders, and a room generator that stitches hand-made rooms into floors.
