---
title: Horde Hours
summary: A 3D survivors-like. Auto-firing abilities, pooled enemies and VFX, timed waves on a NavMesh, level-up cards, passives and a JSON save system.
genre: Survivors-like / action roguelite
status: in-progress
dates:
  start: "2025-11"   # TODO: confirm start month
  end: "2026-02"
role: Solo — design & programming
engine: Unity 6 · URP
order: 1
highlights:
  - ScriptableObject ability framework
  - Name-keyed object pooling
  - Level-up offers + JSON saves
myContribution:
  - "Ability framework: an abstract ScriptableObject `Ability` with Projectile, Aura, Whip and Instant variants, instantiated per run so levels and cooldowns are per-player; damage rolls with crit chance from a cloned `UnitStatistics` sheet."
  - "Projectile behaviour (`MoveTo`): homing, piercing, bouncing with smart re-targeting to the nearest living enemy, and explosive variants with radial knockback."
  - "Passive items that additively modify the runtime stat sheet (damage, cooldown, range, speed, knockback, magnet range, extra bounces) and level up like weapons."
  - "Object pooling on top of `UnityEngine.Pool.ObjectPool`, keyed by prefab name, shared by enemies, projectiles, VFX, damage popups and XP gems; every pooled object resets itself in `OnEnable`."
  - "Wave spawner that places enemies on the NavMesh around the player on a timeline of waves."
  - "Enemy behaviour: NavMeshAgent chase, contact damage with interval, physics knockback that hands control back to the agent, hit-flash and dissolve-death via a Shader Graph material."
  - "Level-up flow: XP gems with a recoil-then-fly pickup animation, XP curve, a three-card upgrade screen that only offers valid options (free slots, level caps), controller/keyboard selection."
  - "Save system: `ISaveSystemElement` discovery, JSON save and load of level, XP, kills, position, abilities and passives, optional XOR obfuscation."
  - "HUD (XP bar, timer, kill counter, inventory slots, world-space health bars), pause menu with animated panel, game-over screen, Cinemachine helpers (dynamic FOV when moving, angle-based zoom)."
tools:
  - Unity 6000.0 (URP 17)
  - C#
  - Cinemachine 3
  - Input System
  - AI Navigation (NavMesh)
  - Shader Graph
  - TextMesh Pro
media: []
# itchUrl: TODO after the WebGL build is published
credits:
  - { asset: "Character Pack", author: "Supercyan" }
  - { asset: "Character Pack — Zombie Sample", author: "Supercyan" }
  - { asset: "BTM Items — Gems", author: "BTM Assets" }
  - { asset: "Explosions VFX", author: "TODO author" }
  - { asset: "Fire Effects (HunFX)", author: "TODO author" }
  - { asset: "Slash Effects FREE", author: "Matthew Guz" }
  - { asset: "RPG Weapons", author: "TODO author" }
  - { asset: "Static Field VFX", author: "TODO author" }
  - { asset: "VFX Pack Impact (Free Version)", author: "WALLCOEUR" }
  - { asset: "Zap VFX URP", author: "Vefects" }
  - { asset: "Stylized Grass Texture", author: "TODO author" }
  - { asset: "Dancing rat model", author: "TODO author (Sketchfab)" }
  - { asset: "Hints & Stars Lite SFX", author: "TODO author" }
  - { asset: "Music: Darkness, Forest, Happy, Mystery, Space Walk", author: "TODO authors (Pixabay)" }
  - { asset: "Fonts: Caslon Antique, Gondens (demo), League Gothic, Retro Floral", author: "TODO authors (dafont)" }
  - { asset: "Ability icons", author: "AI-generated" }
---

## The game

Horde Hours is a top-down 3D survivors-like. You move; your weapons fire on their own at the nearest enemies. Enemies arrive in timed waves and chase you across a NavMesh arena, drop XP gems when they die, and every level-up pauses the game to offer three upgrade cards: a new weapon, a new passive, or a level for one you already have. The run ends when your health hits zero. There is no win state — the score is how long you lasted and how many you took down.

<span class="todo">TODO: 2–3 sentences on the design intent (what feeling I was going for, what I learned).</span>

## Technical breakdown

### 1. Abilities as data

Every weapon is a ScriptableObject asset derived from `Ability`: name, icon, VFX prefab, cooldown, range, damage range, damage type, targeting mode and level cap. Concrete subclasses override `Execute` — a projectile spawns a pooled `MoveTo` object and aims it, an aura attaches a pulsing `DamagingAura` to the player, a whip spawns an `AreaDamage` volume in front of the player. The controller clones the assets at runtime so each run has its own levels and cooldown timers, and passives mutate a cloned `UnitStatistics` sheet that every ability reads through. Adding a weapon means adding an asset, not touching the controller.

<span class="todo">TODO: short code excerpt (Ability.GetDamage + AbilitiesController.HandleAbility) and a diagram of the flow.</span>

### 2. One pool for everything

Enemies, projectiles, hit VFX, damage popups and gems all go through one `ObjectPoolManager` that builds a `UnityEngine.Pool.ObjectPool` per prefab and keys it by prefab name. Spawning returns an inactive instance and activates it; despawning deactivates and releases. Each pooled script resets its own state in `OnEnable` (timers, collected flags, agent warp) so an instance can be reused without a special reset call. Death effects run a flash-and-fade before the enemy is returned to the pool.

### 3. Level-up offers and saves

`LevelUpManager` turns every enemy kill into XP, drives the XP curve, and builds the three-card offer from the ability and passive databases: owned items appear as "level N+1" only below their cap, unowned ones only while a slot is free. The screen pauses time, unlocks the cursor and preselects the first card for controller play. The save system finds every `ISaveSystemElement` in the scene, lets each write into one `SaveData` object, serialises it to JSON in the persistent data path and restores abilities by name from the database on load.

### Known issues I'm fixing for the web build

- The first build scene is an empty menu — a real main menu is being built.
- The Static Field effect used VFX Graph, which browsers don't support; it is being rebuilt as a particle system.
- The XP-magnet range check was inverted, so the magnet passive did nothing; fixed in the rework.
