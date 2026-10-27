---
title: Horde Hours
summary: A 3D survivors-like. Auto-firing abilities, pooled enemies and VFX, a ten-minute spawn director on a NavMesh, level-up cards, passives and a JSON save system.
genre: Survivors-like / action roguelite
status: playable
dates:
  start: "2026-01"
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
  - "Game feel (0.4.0): below a third of health a red vignette pulses with a heartbeat that quickens as it gets worse; the XP bar swells and flashes on a level-up; kills less than two seconds apart build a streak that is called out at 25, 50, 100 and every hundred after; damage numbers stack, so hits on one enemy within 0.3 s add to the number already showing, and past 45 numbers on screen plain hits are dropped while crits still get their own; gems pulled by the magnet start at a speed set by their distance and accelerate, so near and far ones land in about the same short time; explosive projectiles shake the camera. A Screen effects switch in both settings screens turns off the shake, the vignette, the bar pulse and the streak callouts. The rules (streak, stacking, magnet) are plain classes with tests; the scene wiring is done by an editor script and pinned by tests too."
  - "Rules under test (0.4.0): the XP curve, the upgrade-offer builder (an owned item offered at its next level only below its cap, a new one only while a slot is free, picks without repeats) and the damage and crit roll moved out of their components into plain C# classes with EditMode tests, the way the other two games are tested. The damage tests found a bug: the roll used Unity's integer `Random.Range`, whose upper bound is exclusive, so no hit ever dealt a weapon's maximum damage. 58 EditMode tests in all."
  - "Web performance pass (0.3.1): a load test that jumps a run to 8:00, keeps the player alive and measures frame time, managed allocations per frame and where the frame goes (scripts, physics, NavMesh, animation) once about 175 enemies are on the field; it runs headlessly in the editor for before-and-after comparisons and as a separate browser build with an on-screen readout. It showed the scripts were not the bottleneck, so the pass is mostly the engine's side: no physics tests between enemies, half the shadow-map passes, no full-screen colour copy, pools filled during the opening seconds instead of mid-fight, and sound effects on a fixed set of voices instead of a new object per hit. Written with Claude Code under my direction."
  - "Enemy roles, elites and a boss (0.3.0): the four enemy types used to be the same chaser with different health. Now slimes are a fast, fragile swarm; bats circle the player and dive in; skeletons hold six to ten metres away and throw a spinning bone; zombies are slow, tanky and barely move when hit. Where each role walks is a pure function (orbit with a breathing radius, keep-distance band) with its own tests, refreshed a few times a second per enemy and staggered, instead of every agent re-pathing every frame. From 5:00 some spawns are elites: larger, gold-tinted, four times the health, more gems. At 9:00 the boss arrives: a giant variant of the zombie with a health bar across the HUD and a charge it telegraphs by stopping and glowing before it dashes along a locked line; its rhythm is a small pure state machine, also tested. Surviving to 10:00 still wins. Written with Claude Code under my direction."
  - "Continue (0.2.6): the save system, until now reachable only from the pause menu, is a real feature. Quitting to the menu writes a save; the menu shows Continue while one exists; choosing it loads the arena and restores position, health, level, XP, kills, the build and the clock a frame after the scene starts. The spawn director skips its own clock to the saved time without spawning the minutes in between (a pure method with a test), so a run continued at 4:52 faces 4:52 enemies and still ends at 10:00. A death or the escape deletes the save. Written with Claude Code under my direction."
  - "Results and settings (0.2.5): the end-of-run panel now shows how long the run lasted against the ten-minute goal, the level reached, the kills and the build (every weapon and passive as an icon with its level), the wording from a pure class with its own tests. Master, music and effects sliders in the pause menu and in a new Settings screen on the main menu, stored in PlayerPrefs and read by the audio manager and the menu music, plus a controls card for keyboard and gamepad. A mix pass: effects a notch under the music, XP gems (the most frequent sound) quieter than hits, the hit-sound cooldown kept, and the music ducks under the level-up cards and the results. Four music files that nothing played and no licence covered were deleted. Written with Claude Code under my direction."
  - "Spawn director (0.2.0): a pure-C# model that turns the run clock into spawns — an interval that shrinks over ten minutes, a live cap that grows, per-minute health and damage multipliers applied on spawn, a type mix per phase and a burst of one type every minute — driven by a ScriptableObject schedule and covered by 7 EditMode tests. Written with Claude Code under my direction, from my plan."
  - "Enemy behaviour (before 0.3.0): NavMeshAgent chase, contact damage with interval, physics knockback that hands control back to the agent, hit-flash and dissolve-death via a Shader Graph material."
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
  - Unity Test Framework (NUnit)
  - Claude Code
  - TextMesh Pro
media:
  - { type: image, src: /media/horde-hours/fireball.webp, alt: "The player in a grass arena with a fireball bursting on a slime, HUD with timer, kills and ability slots", caption: "Fig. 1 — a run in the web build" }
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
  - { asset: "Impact Sounds, Interface Sounds and Music Jingles (stings, UI ticks, enemy death)", author: "Kenney", url: "https://kenney.nl/assets", license: "CC0" }
  - { asset: "Crystal Cave (menu theme)", author: "cynicmusic", url: "https://pixelsphere.org", license: "CC0, credit requested" }
  - { asset: "Hints Stars Points & Rewards Sound Effects – Lite Pack", author: "Cyberwave Orchestra", url: "https://assetstore.unity.com/packages/audio/sound-fx/hints-stars-points-rewards-sound-effects-lite-pack-295538", license: "Asset Store EULA" }
  - { asset: "League Gothic font", author: "The League of Moveable Type", url: "https://www.theleagueofmoveabletype.com/league-gothic", license: "SIL OFL" }
  - { asset: "Caslon Antique font", author: "Typographer Mediengestaltung", url: "https://www.1001fonts.com/caslon-antique-font.html", license: "1001Fonts Free For Commercial Use" }
  - { asset: "Ability icons", author: "AI-generated", license: "n/a (generated)" }
---

## The game

Horde Hours is a top-down 3D survivors-like. You move; your weapons fire on their own at the nearest enemies. Enemies come in a trickle that never stops and thickens over ten minutes, with a crowd of one type every minute: slimes swarm, bats circle and dive, skeletons keep their distance and throw bones, zombies push through. From five minutes in some of them are elites, and at nine minutes a boss arrives; they drop XP gems when they die, and every level-up pauses the game to offer three upgrade cards: a new weapon, a new passive, or a level for one you already have. Survive to 10:00 and you win; lose your health before that and the run ends with how long you lasted and how many you took down.

My goal for this 3D survivors-like was to balance player power progression with time-based difficulty scaling by architecting a modular, data-driven ability system using Unity's ScriptableObjects. This project taught me how to tie independent mechanics into a cohesive core loop while scoping features to prioritize scalable functionality.

## Technical breakdown

### 1. Abilities as data

Every weapon is a ScriptableObject asset derived from `Ability`: name, icon, VFX prefab, cooldown, range, damage range, damage type, targeting mode and level cap. Concrete subclasses override `Execute` — a projectile spawns a pooled `MoveTo` object and aims it, an aura attaches a pulsing `DamagingAura` to the player, a whip spawns an `AreaDamage` volume in front of the player. The controller clones the assets at runtime so each run has its own levels and cooldown timers, and passives mutate a cloned `UnitStatistics` sheet that every ability reads through. Adding a weapon means adding an asset, not touching the controller.

The whole loop is one method on the player. Every frame, each ability ticks its own cooldown; when it is ready, it asks for a target and executes:

```csharp
private void HandleAbility(Ability ability) {
    ability.cooldownTimer -= Time.deltaTime;

    if (ability.cooldownTimer > 0) return;

    GameObject target = GetTargetForAbility(ability);

    bool targetFound = target != null;
    bool isNonTargetedAbility = ability.targetingMode == TargetingMode.Self || ability.targetingMode == TargetingMode.Directional;

    if (targetFound || isNonTargetedAbility) {
        ability.Execute(runtimeStatistics, gameObject, target);
        ability.cooldownTimer = ability.cooldown * runtimeStatistics.cooldownMultiplier;
    }
}
```
<p class="excerpt-caption">AbilitiesController.cs — <code>HandleAbility</code>, unedited.</p>

Damage is rolled in one place that every weapon shares, so a passive that raises the damage multiplier or crit chance improves every weapon at once:

```csharp
public int GetDamage(UnitStatistics stats, out bool isCritical) {
    float baseDamage = Random.Range(minDamage, maxDamage);
    float multiplier = stats.damageMultiplier;

    isCritical = Random.value <= stats.critChance;

    if (isCritical) {
        multiplier *= stats.critMultiplier;
    }
    return Mathf.RoundToInt(baseDamage * multiplier);
}
```
<p class="excerpt-caption">Ability.cs — <code>GetDamage</code>, unedited.</p>

<figure class="diagram">
<svg viewBox="0 0 760 320" role="img" aria-labelledby="ab-t ab-d">
<title id="ab-t">One frame of the ability loop</title>
<desc id="ab-d">For every ability clone, HandleAbility counts the cooldown down, finds a target with an overlap sphere, and calls Execute. Each subclass decides what happens: a pooled projectile, an aura that ticks, a whip area or an instant hit. All of them roll damage with GetDamage against the run's cloned stat sheet, which passives modify. After executing, the cooldown restarts, scaled by the cooldown multiplier.</desc>
<defs><marker id="ab-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b9a68f"/></marker><marker id="ab-ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f2b180"/></marker></defs>
<path d="M664 60 C664 22 288 22 288 58" fill="none" stroke="#f2b180" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#ab-ah2)"/>
<text x="476" y="24" text-anchor="middle" class="mono" font-size="11" fill="#f2b180">cooldown restarts: base × cooldownMultiplier</text>
<g font-size="12.5" fill="#b9a68f">
<rect x="24" y="60" width="160" height="72" rx="10" fill="#3a3224" stroke="#5d412b"/>
<text x="38" y="84" class="mono" font-size="12" fill="#f6d370">Update()</text><text x="38" y="104">for every ability</text><text x="38" y="121">(a per-run clone)</text>
<rect x="208" y="60" width="160" height="72" rx="10" fill="#3a3224" stroke="#5d412b"/>
<text x="222" y="84" class="mono" font-size="12" fill="#f6d370">HandleAbility</text><text x="222" y="104">cooldown −= Δt</text><text x="222" y="121">not ready → skip</text>
<rect x="392" y="60" width="176" height="72" rx="10" fill="#3a3224" stroke="#5d412b"/>
<text x="406" y="84" class="mono" font-size="12" fill="#f6d370">GetTargetForAbility</text><text x="406" y="104">OverlapSphere(range)</text><text x="406" y="121">closest or random enemy</text>
<rect x="592" y="60" width="144" height="72" rx="10" fill="#3a3224" stroke="#f27c52"/>
<text x="606" y="84" class="mono" font-size="12" fill="#f27c52">Execute(stats…)</text><text x="606" y="104">the subclass decides</text><text x="606" y="121">what happens</text>
</g>
<line x1="186" y1="96" x2="204" y2="96" stroke="#b9a68f" stroke-width="1.6" marker-end="url(#ab-ah)"/>
<line x1="370" y1="96" x2="388" y2="96" stroke="#b9a68f" stroke-width="1.6" marker-end="url(#ab-ah)"/>
<line x1="570" y1="96" x2="588" y2="96" stroke="#b9a68f" stroke-width="1.6" marker-end="url(#ab-ah)"/>
<line x1="664" y1="134" x2="664" y2="164" stroke="#b9a68f" stroke-width="1.6" marker-end="url(#ab-ah)"/>
<g font-size="12.5" fill="#f3e6d3">
<rect x="392" y="168" width="344" height="28" rx="8" fill="#2f291b" stroke="#5d412b"/><text x="404" y="187"><tspan class="mono" fill="#f6d370">Projectile</tspan><tspan dx="10">pooled MoveTo: pierce, bounce, explode</tspan></text>
<rect x="392" y="204" width="344" height="28" rx="8" fill="#2f291b" stroke="#5d412b"/><text x="404" y="223"><tspan class="mono" fill="#f6d370">Aura</tspan><tspan dx="10">DamagingAura, rolls damage per tick</tspan></text>
<rect x="392" y="240" width="344" height="28" rx="8" fill="#2f291b" stroke="#5d412b"/><text x="404" y="259"><tspan class="mono" fill="#f6d370">Whip</tspan><tspan dx="10">AreaDamage volume in front</tspan></text>
<rect x="392" y="276" width="344" height="28" rx="8" fill="#2f291b" stroke="#5d412b"/><text x="404" y="295"><tspan class="mono" fill="#f6d370">Instant</tspan><tspan dx="10">hit on the target</tspan></text>
</g>
<rect x="24" y="168" width="320" height="136" rx="10" fill="#3a3224" stroke="#9fd3a8"/>
<text x="38" y="192" class="mono" font-size="12" fill="#9fd3a8">UnitStatistics — runtime clone</text>
<g font-size="12.5" fill="#b9a68f"><text x="38" y="216">damageMultiplier · critChance · critMultiplier</text><text x="38" y="236">cooldownMultiplier · range, speed, magnet…</text><text x="38" y="262" fill="#f3e6d3">passives write here: PassiveItem.Apply()</text><text x="38" y="284">every weapon reads it</text></g>
<line x1="288" y1="166" x2="288" y2="136" stroke="#9fd3a8" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#ab-ah)"/>
<line x1="346" y1="236" x2="388" y2="236" stroke="#9fd3a8" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#ab-ah)"/>
<text x="350" y="228" class="mono" font-size="10" fill="#9fd3a8">GetDamage</text>
</svg>
<figcaption>Fig. — one frame of the ability loop. Ability assets are cloned per run, so levels and cooldown timers never leak between runs.</figcaption>
</figure>

### 2. One pool for everything

Enemies, projectiles, hit VFX, damage popups and gems all go through one `ObjectPoolManager` that builds a `UnityEngine.Pool.ObjectPool` per prefab and keys it by prefab name. Spawning returns an inactive instance and activates it; despawning deactivates and releases. Each pooled script resets its own state in `OnEnable` (timers, collected flags, agent warp) so an instance can be reused without a special reset call. Death effects run a flash-and-fade before the enemy is returned to the pool.

### 3. Level-up offers and saves

`LevelUpManager` turns every enemy kill into XP, drives the XP curve, and builds the three-card offer from the ability and passive databases: owned items appear as "level N+1" only below their cap, unowned ones only while a slot is free. Since 0.4.0 the curve and the offer rules are plain classes the manager calls, so both are tested without a scene. The screen pauses time, unlocks the cursor and preselects the first card for controller play. The save system finds every `ISaveSystemElement` in the scene, lets each write into one `SaveData` object, serialises it to JSON in the persistent data path and restores abilities by name from the database on load.

### What changed in 0.4.0 (October 2026)

The game reacts more as the run gets busier, and less in the way. Low health turns the screen edges red to the beat of a heartbeat, a level-up makes the XP bar swell, kill streaks are called out at 25, 50 and 100, damage numbers on one enemy add up instead of piling into a column, gems accelerate into you, and explosions shake the camera; a Screen effects switch turns the visual ones off. Under the hood the XP curve, the upgrade offers and the damage roll became plain classes with tests, and the tests caught a roll that could never reach a weapon's top damage. 58 EditMode tests.

### What changed in 0.2.0 (October 2026)

The web build had a hole I only saw when auditing the three games: four fixed waves, 134 enemies, and the last one spawned at 1:38. After that the arena was empty and the timer kept counting, with no win state. 0.2.0 replaces the wave list with a spawn director. A plain C# model takes the run clock and returns names to spawn: the interval between spawns shrinks from 1.1 s to 0.22 s over ten minutes, the live cap grows from 60 to 200, enemies get +15 % health and +8 % damage per minute (applied on spawn, since pooled enemies are reused), the type mix changes by phase (slimes first, bats from 1:00, skeletons from 2:30, zombies from 4:30), and every minute a crowd of one type pours in on top of the trickle. The curve lives in a `SpawnSchedule` asset. Survive to 10:00 and the game-over panel says YOU SURVIVED; the HUD timer now counts toward that goal. The model has no Unity dependency, so it is tested by simulating whole runs: spawns still arrive in the last minute, the last minute is far busier than the first, the cap holds, the mix shifts, the burst lands.

### What changed in 0.2.1 (October 2026)

A review round from my own recording. The lightning strike rendered as a magenta sheet in the browser: the VFX pack's shaders declare shader model 4.5, which WebGL 2 cannot run, so they fell back to the error shader; they target 3.5 now and render. The game is called Horde Hours and the menu says "survive the night", but the arena was lit like noon, with a yellow sun and the default skybox. It is night now: a cool, low moonlight with soft shadows, a dark three-colour ambient, exponential fog that closes the distance, a solid dark sky, and a warm lamp that follows the player so the hero and the nearest enemies stay readable. The level-up cards sit on a full-screen dim instead of on the arena, and the rats that dance beside them (a 3D model filmed by a side camera) got a lamp of their own, since the night had turned them into silhouettes. The pointer locks on the first click, so the orbital camera can be turned with the mouse without the cursor leaving the game; every panel releases it. The menu lost its explanatory lines and flat squares for two generated radial glows, a vignette, a coral-shadowed title, outlined buttons that swell and tick on hover, and a CC0 menu theme (cynicmusic's "Crystal Cave"). New sounds for enemy death, victory and defeat (Kenney, CC0), chosen so none are the clips Push Comes to Shove uses; the level-up keeps the sound I had made for it. The scene and menu changes are pinned by 12 EditMode tests, lighting included, so a rebuild cannot quietly bring the sun back.

### What changed in 0.2.5 (October 2026)

The run ends with numbers instead of a headline: survived time against the goal, level, kills, and the build as icons with levels. Volume sliders (master, music, effects) live in the pause menu and in a Settings screen on the main menu; they persist, and the menu music follows them too. A controls card sits next to them. The mix got a pass: effects below the music, gems quieter than hits, music ducked under the level-up cards and the results panel. The unreferenced music files left over from early prototyping are gone, so every clip that ships is credited. 18 EditMode tests pin the scenes, the prefab and the wording.

### What changed in 0.3.1 (October 2026)

A performance pass for the browser, starting with a measurement instead of a guess. A small load test jumps the run to 8:00, keeps the player alive, waits until about 175 enemies are on the field and records 30 seconds: frame time, managed memory allocated per frame and the time spent in scripts, physics, NavMesh and animation. Run headlessly in the editor before and after the changes (two runs each), the average frame stayed at about 2.5 ms and the garbage went from about 0.9 KB a frame to 0.4–0.7 KB. So the game's own code was never the problem at the enemy cap, and most of the pass is about what the browser's single thread and the GPU have to do: enemies no longer test for collisions against each other (their bodies are kinematic and nothing needed it), the moonlight's shadows use two cascades instead of four, so every enemy is drawn into the shadow map half as often, the unused full-screen colour copy is gone, the pools are filled a few copies per frame during the quiet opening seconds instead of growing mid-fight, and sound effects play on a fixed set of voices instead of creating and destroying an object per hit. Damage numbers, the timer and the gem counter no longer build a string each time. The shipped textures were already capped at 1024 px and the audio is Vorbis. The GPU side cannot be measured headlessly; the browser build of the load test shows frame rate and allocations on screen. 36 EditMode tests.

### What changed in 0.3.0 (October 2026)

Four enemies with four jobs instead of one chaser in four costumes: a slime swarm that rushes, bats that circle and dive, skeletons that hang back and throw bones, zombies that soak damage and ignore knockback. Elites from 5:00, larger and gold, with four times the health and five gems. At 9:00 the Horde Lord, a giant zombie, walks in with its name and health across the top of the screen; every few seconds it stops, glows red and charges along the line it locked, so stepping aside during the glow is the answer. Steel-drum cues mark the boss's arrival and fall, a clank marks an elite. The steering and the charge rhythm are pure classes with tests; 32 EditMode tests in all.

### What changed in 0.2.6 (October 2026)

Continue on the main menu, shown while a save exists. Quit from the pause menu saves; Continue restores the run, including the spawn director's clock, so the pressure matches the minute you left at; a death or the escape deletes the save. The menu buttons sit in a layout column now, so a hidden Continue (or Quit, on the web) leaves no gap. 21 EditMode tests.

### What changed for the web build (October 2026)

- A real main menu (Play, Credits, Quit) replaced the empty first scene.
- The Static Field effect used VFX Graph, which browsers don't support; it is now a particle-system ring driven by the same `DamagingAura` logic.
- The XP-magnet range check was inverted, so the magnet passive did nothing. Fixed, along with a frame-rate-dependent wave timer, a save field that was written backwards, and a pointer lock the game never needed.
- Forward+ rendering switched to Forward, audio moved to Vorbis, textures capped at 1024 px for the web.
