---
title: Horde Hours
summary: A 3D survivors-like. Auto-firing abilities, pooled enemies and VFX, timed waves on a NavMesh, level-up cards, passives and a JSON save system.
genre: Survivors-like / action roguelite
status: playable
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
media:
  - { type: image, src: /media/horde-hours/fireball.webp, alt: "The player in a grass arena with a fireball bursting on a slime, HUD with timer, kills and ability slots", caption: "Fig. 1 — a run in the web build (800 px capture — TODO recapture at 1280)" }
  - { type: image, src: /media/horde-hours/arena.webp, alt: "Four slimes closing in on the player across the arena", caption: "Fig. 2 — the first wave arrives" }
  - { type: image, src: /media/horde-hours/menu.webp, alt: "Horde Hours main menu with Play and Credits buttons", caption: "Fig. 3 — the menu built for the web release" }
itchUrl: https://phanto-official.itch.io/horde-hours
credits:
  - { asset: "Character Pack: Free Sample", author: "Supercyan", url: "https://assetstore.unity.com/packages/3d/characters/humanoids/character-pack-free-sample-79870", license: "Asset Store EULA" }
  - { asset: "Character Pack: Zombie Sample", author: "Supercyan", url: "https://assetstore.unity.com/packages/3d/characters/humanoids/fantasy/character-pack-zombie-sample-131604", license: "Asset Store EULA" }
  - { asset: "Level 1 Monster Pack", author: "PI Entertainment Limited", url: "https://assetstore.unity.com/packages/3d/characters/creatures/level-1-monster-pack-77703", license: "Asset Store EULA" }
  - { asset: "Stylized Free Skeleton", author: "ThunderForgeStudio", url: "https://assetstore.unity.com/packages/3d/characters/creatures/stylized-free-skeleton-298650", license: "Asset Store EULA" }
  - { asset: "FREE – RPG Weapons", author: "Blink", url: "https://assetstore.unity.com/packages/3d/props/weapons/free-rpg-weapons-199738", license: "Asset Store EULA" }
  - { asset: "Simple Gems and Items Ultimate Animated Customizable Pack", author: "BenjaTheMaker", url: "https://assetstore.unity.com/packages/3d/props/simple-gems-and-items-ultimate-animated-customizable-pack-73764", license: "Asset Store EULA" }
  - { asset: "Comic Explosion Effect", author: "CartoonVFX9x", url: "https://assetstore.unity.com/packages/vfx/particles/fire-explosions/comic-explosion-effect-317348", license: "Asset Store EULA" }
  - { asset: "(Free) StylizedVFX Fire Pack", author: "Hun0FX", url: "https://assetstore.unity.com/packages/vfx/particles/fire-explosions/free-stylizedvfx-fire-pack-321082", license: "Asset Store EULA" }
  - { asset: "Slash Effects FREE", author: "Matthew Guz", url: "https://assetstore.unity.com/packages/vfx/particles/spells/slash-effects-free-295209", license: "Asset Store EULA" }
  - { asset: "Hit Impact Effects FREE", author: "Travis Game Assets", url: "https://assetstore.unity.com/packages/vfx/particles/hit-impact-effects-free-218385", license: "Asset Store EULA" }
  - { asset: "VFX – Impact and Hit – Light Version", author: "Cartoon VFX by Wallcoeur", url: "https://assetstore.unity.com/packages/vfx/particles/vfx-impact-and-hit-light-version-335800", license: "Asset Store EULA" }
  - { asset: "Zap VFX – URP", author: "Vefects", url: "https://assetstore.unity.com/packages/vfx/particles/spells/zap-vfx-urp-303479", license: "Asset Store EULA" }
  - { asset: "Stylized Grass Texture", author: "LowlyPoly", url: "https://assetstore.unity.com/packages/2d/textures-materials/glass/stylized-grass-texture-153153", license: "Asset Store EULA" }
  - { asset: "Free – Casual & Relaxing Game Music Pack (track \"Happy Harmony\")", author: "SLD Audio", url: "https://assetstore.unity.com/packages/audio/music/free-casual-relaxing-game-music-pack-262740", license: "Asset Store EULA" }
  - { asset: "Hints Stars Points & Rewards Sound Effects – Lite Pack", author: "Cyberwave Orchestra", url: "https://assetstore.unity.com/packages/audio/sound-fx/hints-stars-points-rewards-sound-effects-lite-pack-295538", license: "Asset Store EULA" }
  - { asset: "Rat model (mesh and texture)", author: "TODO: original modeller unknown; the file was rigged through Mixamo" }
  - { asset: "Flair dance animation (retargeted)", author: "Mixamo (Adobe)", url: "https://www.mixamo.com", license: "Mixamo terms, royalty-free" }
  - { asset: "League Gothic font", author: "The League of Moveable Type", url: "https://www.theleagueofmoveabletype.com/league-gothic", license: "SIL OFL" }
  - { asset: "Caslon Antique font", author: "Typographer Mediengestaltung", url: "https://www.1001fonts.com/caslon-antique-font.html", license: "1001Fonts Free For Commercial Use" }
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

### What changed for the web build (October 2026)

- A real main menu (Play, Credits, Quit) replaced the empty first scene.
- The Static Field effect used VFX Graph, which browsers don't support; it is now a particle-system ring driven by the same `DamagingAura` logic.
- The XP-magnet range check was inverted, so the magnet passive did nothing. Fixed, along with a frame-rate-dependent wave timer, a save field that was written backwards, and a pointer lock the game never needed.
- Forward+ rendering switched to Forward, audio moved to Vorbis, textures capped at 1024 px for the web.
