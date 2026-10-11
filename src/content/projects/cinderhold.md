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
  - "TODO — the rework has not started. The current prototype (June–July 2025) follows a beginner tutorial and is not presented as my work. The list below is the plan; each item moves up here only when it is built."
tools:
  - Unity 6000.6 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
media: []
credits:
  - { asset: "Tiles & characters (planned)", author: "Kenney", url: "https://kenney.nl", license: "CC0" }
---

## The game

Cinderhold will be a short top-down dungeon crawler: fight through a handful of rooms, pick up coins and keys, upgrade your weapon between floors, and face a boss with a telegraphed attack pattern. Small on purpose — the goal is a complete, polished loop that runs in the browser.

## The plan

The first version of this project was a tutorial follow-along, and I'm not going to pretend otherwise. The rework replaces every system with my own:

1. **Foundation** — fresh Unity 6 project, Input System actions, assembly definition, Kenney tileset, git with LFS.
2. **Combat core** — `IDamageable`, health with events, hit-stop and knockback, `WeaponData` ScriptableObjects (arc, damage, cooldown), overlap-box hitboxes.
3. **Enemy AI** — `EnemyDefinition` assets and a state machine (Idle / Patrol / Chase / Attack / Flee) with sight checks; two or three enemy types and one boss.
4. **Rooms** — hand-made room templates stitched into a floor, doors, a locked door and key, an exit.
5. **Progression & save** — XP and levels, coins, a weapon shop, JSON saves reusing the `ISaveSystemElement` pattern from Horde Hours.
6. **UI & feel** — HUD, death screen, floating text pool, screen shake, sound.
7. **Web build** — itch.io page, screenshots, credits.

<span class="todo">TODO: replace this page with the real write-up once the rework ships.</span>
