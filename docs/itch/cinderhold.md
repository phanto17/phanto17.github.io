# itch.io page — Cinderhold

Same procedure as `push-comes-to-shove-guide.md` (HTML project, **1280 × 720**, fullscreen on,
autostart off, SharedArrayBuffer off, theme colours from the Prism system). Differences below.

- **Build:** `D:\UnityProjects\Cinderhold\Builds\Cinderhold-web-0.4.0.zip` (0.4.0 = a new Floor 2 with keys, locked doors, a checkpoint and armoured slimes; Cinderclaw's floor is now Floor 3; 0.3.0 = the dodge, 2D lighting, the boss entrance, death bursts, floor fades; 0.2.1 added settings and the controls card on top of 0.2.0's recorded audio and music; 0.1.2 added the Kenney pixel UI font; 0.1.0 shipped without wall collision, never use it)
- **Cover:** `docs/itch/assets/cinderhold-cover-630x500.png`
- **Screenshots:** `D:\UnityProjects\Cinderhold\Builds\Shots\floor1-spawn.png`, `floor1-exit.png`,
  `floor2-locks.png`, `floor2-exit.png`, `floor3-boss.png` (1280 × 720, captured from the scenes without the HUD); add one in-browser shot
  with the HUD if you can.
- **Known rough edges in 0.4.0:** three short floors; a death restarts at the last checkpoint with the floor's enemies back
  (the death screen says so now).

## Title / slug

`Cinderhold` · `phanto-official.itch.io/cinderhold` (live since 2026-10-16; build 0.4.0 since 2026-10-27; the Credits block and the controls below are on the page — the tagline and description still need the 0.4.0 text below)

## Short description (tagline)

A short top-down dungeon crawler. Read the telegraph, dodge, strike. Three floors, locked doors, a smith, and a guardian at the bottom.

## Description

**Cinderhold** is a small 2D dungeon crawler made solo in Unity.

Every enemy shows where it will hit before it swings: a red mark on the floor is your cue to dodge through it and punish. Kill slimes, bats and rats for XP and coins, level up for more health, spend coins at the smith for a bigger weapon, and find the way down. The second floor is locked: find the keys its monsters guard. The guardian on the third floor seals the exit until it falls.

### Controls

**WASD** or arrow keys to move. **Space / J** or left mouse to attack. **Shift / K** or right mouse to dodge. **E** to interact (smith, exits). **Esc** pauses; the pause panel has volume and screen-shake settings (arrows or stick to change) and a controls card. Gamepad: left stick, X to attack, B or RB to dodge, A to interact, Start to pause. Progress saves automatically when you level up, buy a weapon or reach a new floor; a death restarts from the last checkpoint.

### What this is

A gameplay-programming project: weapons and enemies as data (ScriptableObjects), a small enemy state machine (patrol, chase, attack with telegraph, flee), pooled hit feedback, a JSON save system and floors authored as ASCII maps. Technical write-up: https://phanto17.github.io/projects/cinderhold/

Feedback welcome in the comments — especially on readability of the attacks and the difficulty of the guardian.

### Credits

- Tiles, characters and items: [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) by Kenney (CC0)
- Fonts: [Kenney Mini and Kenney Mini Square](https://kenney.nl/assets/kenney-fonts) by Kenney (CC0); Liberation Sans (SIL Open Font License) ships inside Unity's TextMesh Pro resources
- Sound effects: [Impact Sounds](https://kenney.nl/assets/impact-sounds), [RPG Audio](https://kenney.nl/assets/rpg-audio), [Interface Sounds](https://kenney.nl/assets/interface-sounds) and [Music Jingles](https://kenney.nl/assets/music-jingles) by Kenney (CC0)
- Music: [Dark Forest Theme](https://opengameart.org/content/dark-forest-theme) and [Dramatic Boss Encounter](https://opengameart.org/content/dramatic-boss-encounter) by cynicmusic — pixelsphere.org (CC0)
- Design and code: Tymoteusz Jaskólski. Most of the code was written with an AI assistant (Claude Code) under my direction: I specified the systems, reviewed the changes and did the testing.

### Devlog — 0.4.0: keys and a third floor

There is a new second floor between the first one and Cinderclaw's, who now waits on the third. Its doors are locked: two keys lie in side rooms, guarded by armoured slimes (tougher, and they barely budge when hit). Halfway through, a waystone lights up when you pass it and saves your run, so a death past it restarts there with the doors you opened still open.

### Devlog — 0.3.0: dodge and light

You can dodge now (Shift, K, right mouse, or B / RB): a quick dash through enemies with a moment of invulnerability, on a short cooldown shown by the weapon icon. Enemy attacks are a little faster and wider to match, so the red mark is something to dodge, not to walk away from. The floors are dark and lit by flickering sconces, a light you carry and the portal's glow. Cinderclaw gets an entrance, with its name, a shake and a health bar, and its room turns red when the fight starts. Enemies burst apart in their own colours, and floors fade into each other.

### Devlog — 0.2.1: sound and settings

Cinderhold now has recorded sound and music. Every effect is a CC0 clip from Kenney's packs (swings, hits, an armour clank when you are hit, bell tolls for deaths, coins, XP, the smith, the portal, pause). Two loops by cynicmusic: a dark guitar theme on the floors and a drums-and-violin track that takes over when Cinderclaw notices you and fades out when it falls. Esc now opens settings (master, music, effects, screen shake; arrows or the stick to change) and a controls card, and the death screen explains what a retry does.

### Tags

`Dungeon Crawler`, `Action`, `2D`, `Pixel Art`, `Singleplayer`, `Unity`, `Short`, `Top-Down`, `Roguelite`

Genre: Action. AI disclosure: graphics no (Kenney assets), audio no (Kenney and cynicmusic, CC0), **code yes** (AI-assisted) — answer truthfully in the itch form.
