# itch.io page — Horde Hours

Same procedure as `push-comes-to-shove-guide.md` (HTML project, 1280 × 720, fullscreen on,
autostart off, SharedArrayBuffer off, theme colours from the Prism system). Differences below.

- **Build:** `D:\UnityProjects\SurvivorLike 4\SurvivorLike\Builds\HordeHours-web-0.2.5.zip` (0.2.x = the spawn director, the 10-minute run, night, menu, sounds; 0.2.5 = results panel, settings, mix pass; 0.2.4 live since 2026-10-22)
- **Cover:** `docs/itch/assets/horde-hours-cover-630x500.png`; a banner in the same style can be generated on request
- **Screenshots:** take 3–5 at 1280×720 as described in the guide (§7); the level-up card screen and a crowded wave are the best shots
- **Known rough edges in 0.2.5:** no boss or elite enemies yet, all four enemies chase the same way

## Title / slug

`Horde Hours` · `phanto-official.itch.io/horde-hours` (live since 2026-10-16)

## Short description (tagline)

Survive the night against an endless horde. Your weapons fire on their own; you move, dodge, and choose what to level up.

## Description

**Horde Hours** is a small 3D survivors-like made solo in Unity.

Move, and your weapons fire at the nearest enemies by themselves. Enemies come in a trickle that never stops and thickens for ten minutes, with a crowd of one type every minute, and chase you across the arena; every kill drops experience, and every level-up stops time to offer three cards: a new weapon, a new passive, or a level for one you already have. Survive to 10:00 and you win; lose your health before that and the run ends with how long you lasted and how many you took down.

### Controls

**WASD** or arrow keys to move, mouse to turn the camera. Weapons fire automatically. **Esc** pauses: volume sliders, a controls card, save and load are in the pause menu. Mouse for the menus and the level-up cards; a gamepad works for moving, the camera and picking cards.

### Weapons and passives

Axe, Fireball, Lightning Strike, Galactic Aura, Static Field, Whip — each with five levels. Passives: Exppresso, Gym Membership, Hot Cheesy Taco, Rubber Band.

### What this is

A gameplay-programming prototype: a ScriptableObject ability framework, a single object pool for enemies, projectiles, VFX and pickups, a wave spawner on NavMesh, a level-up offer system and a JSON save system. Technical write-up: https://phanto17.github.io/projects/horde-hours/

Feedback welcome in the comments — especially on weapon feel and difficulty.

### Devlog — 0.2.5: results and settings

The end of a run now shows the numbers: how long you lasted of the ten minutes, your level, your kills, and the build you ended with. Master, music and effects sliders are in the pause menu and in the new Settings screen on the main menu, and they are remembered. The mix is balanced (gems quieter, music ducks under the level-up cards), and a controls card lists keyboard and gamepad.

### Credits

- Characters: [Character Pack: Free Sample](https://assetstore.unity.com/packages/3d/characters/humanoids/character-pack-free-sample-79870) and [Zombie Sample](https://assetstore.unity.com/packages/3d/characters/humanoids/fantasy/character-pack-zombie-sample-131604) by Supercyan
- Enemies: [Level 1 Monster Pack](https://assetstore.unity.com/packages/3d/characters/creatures/level-1-monster-pack-77703) by PI Entertainment Limited · [Stylized Free Skeleton](https://assetstore.unity.com/packages/3d/characters/creatures/stylized-free-skeleton-298650) by ThunderForgeStudio
- Weapons and items: [FREE – RPG Weapons](https://assetstore.unity.com/packages/3d/props/weapons/free-rpg-weapons-199738) by Blink · [Simple Gems and Items](https://assetstore.unity.com/packages/3d/props/simple-gems-and-items-ultimate-animated-customizable-pack-73764) by BenjaTheMaker
- Effects: [Comic Explosion Effect](https://assetstore.unity.com/packages/vfx/particles/fire-explosions/comic-explosion-effect-317348) by CartoonVFX9x · [(Free) StylizedVFX Fire Pack](https://assetstore.unity.com/packages/vfx/particles/fire-explosions/free-stylizedvfx-fire-pack-321082) by Hun0FX · [Slash Effects FREE](https://assetstore.unity.com/packages/vfx/particles/spells/slash-effects-free-295209) by Matthew Guz · [Hit Impact Effects FREE](https://assetstore.unity.com/packages/vfx/particles/hit-impact-effects-free-218385) by Travis Game Assets · [VFX – Impact and Hit – Light Version](https://assetstore.unity.com/packages/vfx/particles/vfx-impact-and-hit-light-version-335800) by Cartoon VFX by Wallcoeur · [Zap VFX – URP](https://assetstore.unity.com/packages/vfx/particles/spells/zap-vfx-urp-303479) by Vefects
- Environment: [Stylized Grass Texture](https://assetstore.unity.com/packages/2d/textures-materials/glass/stylized-grass-texture-153153) by LowlyPoly (Adobe)
- Audio: "Happy Harmony" from [Free – Casual & Relaxing Game Music Pack](https://assetstore.unity.com/packages/audio/music/free-casual-relaxing-game-music-pack-262740) by SLD Audio · [Hints Stars Points & Rewards – Lite Pack](https://assetstore.unity.com/packages/audio/sound-fx/hints-stars-points-rewards-sound-effects-lite-pack-295538) by Cyberwave Orchestra
- Stings and UI ticks: Impact Sounds, Interface Sounds and Music Jingles by [Kenney](https://kenney.nl/assets) (CC0)
- Menu theme: [Crystal Cave](https://opengameart.org/content/crystal-cave-song18) by cynicmusic — pixelsphere.org (CC0)
- Fonts: [League Gothic](https://www.theleagueofmoveabletype.com/league-gothic) by The League of Moveable Type (OFL) · [Caslon Antique](https://www.1001fonts.com/caslon-antique-font.html) by Typographer Mediengestaltung (1001Fonts FFC)
- Ability icons: AI-generated
- Design and code: Tymoteusz Jaskólski

### Tags

`Survivors-like`, `Roguelite`, `Action`, `3D`, `Singleplayer`, `Unity`, `Short`, `Top-Down`, `Bullet Heaven`, `Arcade`

Genre: Action. AI disclosure: ability icons are AI-generated (graphics: yes); code was AI-assisted if that was the case — answer truthfully.
