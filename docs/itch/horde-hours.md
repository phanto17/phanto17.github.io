# itch.io page — Horde Hours

Same procedure as `push-comes-to-shove-guide.md` (HTML project, 1280 × 720, fullscreen on,
autostart off, SharedArrayBuffer off, theme colours from the Prism system). Differences below.

- **Build:** `D:\UnityProjects\SurvivorLike 4\SurvivorLike\Builds\HordeHours-web-0.1.0.zip` (27 MB)
- **Cover:** `docs/itch/assets/horde-hours-cover-630x500.png`; a banner in the same style can be generated on request
- **Screenshots:** take 3–5 at 1280×720 as described in the guide (§7); the level-up card screen and a crowded wave are the best shots
- **Known rough edges in 0.1.0:** no sound-mix pass, no win condition (by design), several pack authors still missing from the credits

## Title / slug

`Horde Hours` · `fanto1.itch.io/horde-hours`

## Short description (tagline)

Survive the night against an endless horde. Your weapons fire on their own; you move, dodge, and choose what to level up.

## Description

**Horde Hours** is a small 3D survivors-like made solo in Unity.

Move, and your weapons fire at the nearest enemies by themselves. Enemies arrive in waves and chase you across the arena; every kill drops experience, and every level-up stops time to offer three cards: a new weapon, a new passive, or a level for one you already have. The run ends when your health hits zero. There is no win screen — the score is how long you lasted and how many you took down.

### Controls

**WASD** or arrow keys to move. Weapons fire automatically. **Esc** pauses (save and load are in the pause menu). Mouse for the menus and the level-up cards.

### Weapons and passives

Axe, Fireball, Lightning Strike, Galactic Aura, Static Field, Whip — each with five levels. Passives: Exppresso, Gym Membership, Hot Cheesy Taco, Rubber Band.

### What this is

A gameplay-programming prototype: a ScriptableObject ability framework, a single object pool for enemies, projectiles, VFX and pickups, a wave spawner on NavMesh, a level-up offer system and a JSON save system. Technical write-up: https://phanto17.github.io/projects/horde-hours/

Feedback welcome in the comments — especially on weapon feel and difficulty.

### Credits

- Characters: [Character Pack: Free Sample](https://assetstore.unity.com/packages/3d/characters/humanoids/character-pack-free-sample-79870) and [Zombie Sample](https://assetstore.unity.com/packages/3d/characters/humanoids/fantasy/character-pack-zombie-sample-131604) by Supercyan
- Enemies: [Level 1 Monster Pack](https://assetstore.unity.com/packages/3d/characters/creatures/level-1-monster-pack-77703) by PI Entertainment Limited · [Stylized Free Skeleton](https://assetstore.unity.com/packages/3d/characters/creatures/stylized-free-skeleton-298650) by ThunderForgeStudio
- Weapons and items: [FREE – RPG Weapons](https://assetstore.unity.com/packages/3d/props/weapons/free-rpg-weapons-199738) by Blink · [Simple Gems and Items](https://assetstore.unity.com/packages/3d/props/simple-gems-and-items-ultimate-animated-customizable-pack-73764) by BenjaTheMaker
- Effects: [Comic Explosion Effect](https://assetstore.unity.com/packages/vfx/particles/fire-explosions/comic-explosion-effect-317348) by CartoonVFX9x · [(Free) StylizedVFX Fire Pack](https://assetstore.unity.com/packages/vfx/particles/fire-explosions/free-stylizedvfx-fire-pack-321082) by Hun0FX · [Slash Effects FREE](https://assetstore.unity.com/packages/vfx/particles/spells/slash-effects-free-295209) by Matthew Guz · [Hit Impact Effects FREE](https://assetstore.unity.com/packages/vfx/particles/hit-impact-effects-free-218385) by Travis Game Assets · [VFX – Impact and Hit – Light Version](https://assetstore.unity.com/packages/vfx/particles/vfx-impact-and-hit-light-version-335800) by Cartoon VFX by Wallcoeur · [Zap VFX – URP](https://assetstore.unity.com/packages/vfx/particles/spells/zap-vfx-urp-303479) by Vefects
- Environment: [Stylized Grass Texture](https://assetstore.unity.com/packages/2d/textures-materials/glass/stylized-grass-texture-153153) by LowlyPoly · rat model from Sketchfab (TODO author)
- Audio: "Happy Harmony" from [Free – Casual & Relaxing Game Music Pack](https://assetstore.unity.com/packages/audio/music/free-casual-relaxing-game-music-pack-262740) by SLD Audio · [Hints Stars Points & Rewards – Lite Pack](https://assetstore.unity.com/packages/audio/sound-fx/hints-stars-points-rewards-sound-effects-lite-pack-295538) by Cyberwave Orchestra
- Fonts: League Gothic (OFL), Caslon Antique, Retro Floral (dafont)
- Ability icons: AI-generated
- Design and code: Tymoteusz Jaskólski

### Tags

`Survivors-like`, `Roguelite`, `Action`, `3D`, `Singleplayer`, `Unity`, `Short`, `Top-Down`, `Bullet Heaven`, `Arcade`

Genre: Action. AI disclosure: ability icons are AI-generated (graphics: yes); code was AI-assisted if that was the case — answer truthfully.
