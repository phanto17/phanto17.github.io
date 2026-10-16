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
  - Enemy state machines
  - Data-driven weapons & rooms
  - Original systems end to end
myContribution:
  - "Foundation (October 2026): a fresh Unity 6 project started from the empty Universal 2D template, so every later commit is diffable against a known-empty start. Assembly definitions for runtime and editor code, an Input System actions asset (move, attack, interact, pause; keyboard and gamepad), the Kenney Tiny Dungeon sheet sliced into 132 sprites with Tile assets and a palette, a playground room on Tilemaps with a merged composite wall collider, a pixel-perfect camera (320×180 reference, 16 px per unit) and a Rigidbody2D-driven player mover."
  - "Reproducible setup: the whole foundation is created by one idempotent editor script that runs headlessly from the command line — no hand-edited scene or project YAML."
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
2. **Combat core** — `IDamageable`, health with events, hit-stop and knockback, `WeaponData` ScriptableObjects (arc, damage, cooldown), overlap-box hitboxes.
3. **Enemy AI** — `EnemyDefinition` assets and a state machine (Idle / Patrol / Chase / Attack / Flee) with sight checks; two or three enemy types and one boss.
4. **Rooms** — hand-made room templates stitched into a floor, doors, a locked door and key, an exit.
5. **Progression & save** — XP and levels, coins, a weapon shop, JSON saves reusing the `ISaveSystemElement` pattern from Horde Hours.
6. **UI & feel** — HUD, death screen, floating text pool, screen shake, sound.
7. **Web build** — itch.io page, screenshots, credits.

<span class="todo">TODO: replace this page with the real write-up once the rework ships.</span>
