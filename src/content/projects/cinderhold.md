---
title: Cinderhold
summary: A 2D top-down dungeon crawler I'm rebuilding from scratch — data-driven weapons, enemy state machines, room-based floors and JSON saves.
genre: 2D dungeon crawler / roguelite
status: planned
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
  - "Tests: EditMode tests cover the health pool, cooldown, hitbox geometry, every AI state transition through a fake context, the attack pattern, the level curve and progress model, the shop rules and the save format (62 tests); PlayMode tests instantiate the real prefabs and data and check the sword kill loop, enemy chasing and biting, the bat's flee-and-recover, loot collection after a kill, level-up healing, shop purchases and a full save/load round trip (12 tests). Both suites run headlessly from the command line like the builds."
  - "The earlier prototype (June–July 2025) followed a beginner tutorial and is not presented as my work; it is kept only as a frozen reference. Each item of the plan below moves up here when it is built."
tools:
  - Unity 6000.6 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
media: []
credits:
  - { asset: "Tiny Dungeon tileset and characters", author: "Kenney", url: "https://kenney.nl/assets/tiny-dungeon", license: "CC0" }
---

## The game

Cinderhold will be a short top-down dungeon crawler: fight through a handful of rooms, pick up coins and keys, upgrade your weapon between floors, and face a boss with a telegraphed attack pattern. Small on purpose — the goal is a complete, polished loop that runs in the browser.

## The plan

The first version of this project was a tutorial follow-along, and I'm not going to pretend otherwise. The rework replaces every system with my own:

1. **Foundation** — fresh Unity 6 project, Input System actions, assembly definitions, Kenney tileset, git with LFS. *Done.*
2. **Combat core** — `IDamageable`, health with events, hit-stop and knockback, `WeaponData` ScriptableObjects (arc, damage, cooldown), overlap-box hitboxes. *Done.*
3. **Enemy AI** — `EnemyDefinition` assets and a state machine (Idle / Patrol / Chase / Attack / Flee) with sight checks; three enemy types and one boss. *Done.*
4. **Rooms** — hand-made room templates stitched into a floor, doors, a locked door and key, an exit.
5. **Progression & save** — XP and levels, coins, a weapon shop, JSON saves reusing the `ISaveSystemElement` pattern from Horde Hours. *Done.*
6. **UI & feel** — HUD, death screen, floating text pool, screen shake, sound.
7. **Web build** — itch.io page, screenshots, credits.

<span class="todo">TODO: replace this page with the real write-up once the rework ships.</span>
