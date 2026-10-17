# itch.io page — Cinderhold

Same procedure as `push-comes-to-shove-guide.md` (HTML project, **1280 × 720**, fullscreen on,
autostart off, SharedArrayBuffer off, theme colours from the Prism system). Differences below.

- **Build:** `D:\UnityProjects\Cinderhold\Builds\Cinderhold-web-0.1.2.zip` (0.1.2 adds the Kenney pixel UI font; 0.1.0 shipped without wall collision, never use it)
- **Cover:** `docs/itch/assets/cinderhold-cover-630x500.png`
- **Screenshots:** `D:\UnityProjects\Cinderhold\Builds\Shots\floor1-spawn.png`, `floor1-exit.png`,
  `floor2-boss.png` (1280 × 720, captured from the scenes without the HUD); add one in-browser shot
  with the HUD if you can.
- **Known rough edges in 0.1.1:** placeholder synthesised sound, no music, two floors only, a death
  restarts at the last checkpoint with the floor's enemies back.

## Title / slug

`Cinderhold` · `phanto-official.itch.io/cinderhold` (live since 2026-10-16; build 0.1.2 since 2026-10-17)

## Short description (tagline)

A short top-down dungeon crawler. Read the telegraph, dodge, strike. Two floors, a smith, and a guardian at the bottom.

## Description

**Cinderhold** is a small 2D dungeon crawler made solo in Unity.

Every enemy shows where it will hit before it swings: a red mark on the floor is your cue to step aside and punish. Kill slimes, bats and rats for XP and coins, level up for more health, spend coins at the smith for a bigger weapon, and find the way down. The guardian on the second floor seals the exit until it falls.

### Controls

**WASD** or arrow keys to move. **Space / J** or left mouse to attack. **E** to interact (smith, exits). **Esc** pauses. Gamepad: left stick, X to attack, A to interact, Start to pause. Progress saves automatically when you level up, buy a weapon or reach a new floor; a death restarts from the last checkpoint.

### What this is

A gameplay-programming project: weapons and enemies as data (ScriptableObjects), a small enemy state machine (patrol, chase, attack with telegraph, flee), pooled hit feedback, a JSON save system and floors authored as ASCII maps. Technical write-up: https://phanto17.github.io/projects/cinderhold/

Feedback welcome in the comments — especially on readability of the attacks and the difficulty of the guardian.

### Credits

- Tiles, characters and items: [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) by Kenney (CC0)
- Fonts: [Kenney Mini and Kenney Mini Square](https://kenney.nl/assets/kenney-fonts) by Kenney (CC0); Liberation Sans (SIL Open Font License) ships inside Unity's TextMesh Pro resources
- Sound effects: generated procedurally in code (no recorded audio)
- Design and code: Tymoteusz Jaskólski. Most of the code was written with an AI assistant (Claude Code) under my direction: I specified the systems, reviewed the changes and did the testing.

### Tags

`Dungeon Crawler`, `Action`, `2D`, `Pixel Art`, `Singleplayer`, `Unity`, `Short`, `Top-Down`, `Roguelite`

Genre: Action. AI disclosure: graphics no (Kenney assets), audio no (procedural), **code yes** (AI-assisted) — answer truthfully in the itch form.
