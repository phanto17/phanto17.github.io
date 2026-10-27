# itch.io page — Push Comes to Shove

Paste into the project page. Settings: Kind = HTML, "This file will be played in the browser",
viewport 960 × 600, fullscreen button on, mobile off, "SharedArrayBuffer support" off
(the build uses no threads). Classification: Game · Strategy. Tags: turn-based, tactics,
grid, puzzle, pixel-art, singleplayer, unity. Pricing: free (no payments).

## Short description (tagline)

itch.io limits the tagline to 120 characters; keep it under that.

Shove enemies into pits and walls; set up the perfect turn before they take theirs. A small deterministic tactics game.

## Description

**Push Comes to Shove** is a small turn-based tactics game on an isometric grid, made solo in Unity.

Five levels. On each board, deploy your squad on your side, then take turns with the enemy. Every unit gets two actions a turn: move along a path, or attack. Soldiers' hits shove the target one tile; archers shoot in straight lines; rangers fire a piercing shot that hits and shoves every enemy in a row. Watch for red brutes, whose blows shove two tiles. Pushing is the point:

- shove an enemy into a wall for extra damage,
- into an ally so both get hurt,
- or into a pit to remove it outright.

A shoved unit is out of reach and can't strike back; one pinned against a wall takes the collision and does. Amber tiles show where a shove lands before you commit.

Damage is fixed, never rolled, so every outcome is yours to work out. Enemies don't telegraph before your turn — on their turn they reveal their intent one at a time, and then act. Clear the board to win, or on one level hold out for five turns. Grey rocks block movement, arrows and shoves.

### Controls

Mouse only. Pick a mode (Place / Move / Attack) with the buttons, click a unit, click a target. Right-click cancels. **End Turn** when you're done.

### About

A gameplay-programming prototype: a deterministic grid engine with BFS pathing and push resolution, attacks as ScriptableObject strategies shared by the player and the AI, and a paced enemy turn. The systems are unit-tested. Write-up and source: https://phanto17.github.io/projects/push-comes-to-shove/

### Credits

- Isometric Sandbox tiles: [Kenney](https://kenney.nl), CC0
- Characters (Humans, Orc, Elf, Goblin): [Sanctum Pixel](https://sanctumpixel.itch.io) — the *Top Down Pixel Art Characters* packs (the brute, harrier and ranger use the packs' own alternative palettes)
- Animated damage numbers and their Alphapix font: [PixelBattleText](https://assetstore.unity.com/packages/2d/gui/pixelbattletext-189358) by Psychic Fur
- UI font: [Pixellari](https://www.dafont.com/pixellari.font) by Zacchary Dempsey-Plante
- Sound effects and stings: [Impact Sounds, RPG Audio, Interface Sounds, Music Jingles](https://kenney.nl/assets) by Kenney (CC0)
- Music: [Battle Theme A](https://opengameart.org/content/battle-theme-a) and [Mysterious Ambience](https://opengameart.org/content/mysterious-ambience-song21) by cynicmusic — pixelsphere.org (CC0)
- Design and code: Tymoteusz Jaskólski. Most of the code was written with an AI assistant (Claude Code) under my direction: I specified the systems, reviewed the changes and did the testing.

Inspired by *Into the Breach* and *King's Bounty*.

Devlog posts are skipped on itch from here on (owner, 2026-10-27): each game's further development gets its own project. Public: 0.2.0 and 0.3.0; the drafts below are kept for reference.

## Devlog post for 0.6.0 (2026-10-27)

**0.6.0 — see the whole outcome.** Hovering an attack now puts a tag over every unit it would touch: how much each loses, KO if it dies, PIT if it goes in the water. Enemies' tags are amber, your units' red, and that includes the counter-blow you would take and where it would shove you. When an enemy reveals its move, your squad gets the same tags. The counter also works the same everywhere now: it always carries its weakness bonus and its shove.

## Devlog post for 0.5.0 (2026-10-27)

**0.5.0 — new units.** Your squad can now include a ranger, whose piercing shot hits every enemy in a row and shoves each of them a tile. The raiders bring two new types: red brutes, slow and tough, whose blows shove you two tiles, and blue harriers with the same piercing shot. Brutes are weak to piercing shots. The attack card now shows two-tile shoves and line pushes correctly. You'll meet them from Drowned Fields on.

## Devlog post for 0.4.0 (2026-10-25)

**0.4.0 — five levels.** One board became a short campaign: First Shove teaches the push with a squad of two, The Crossing is the old board, Drowned Fields floods most of the ground, Hold the Line asks you to survive five turns behind a rock ridge, and The Warband is the finale. Each level opens with a briefing, a win unlocks the next one, and the Levels screen lets you replay any you have reached. Rocks are new: they stop movement, arrows and shoves, and the enemies now walk round them instead of waiting behind them.

## Devlog post for 0.3.0 (2026-10-22)

**0.3.0 — sound, feel, menus.** The game has audio now: footsteps, blows, arrows, shoves, collisions, pit falls, a deployment loop that turns into a battle theme, and a sting for the result. Hover an enemy in Attack mode and the card tells you the outcome in numbers: your damage, the shove result, the counter you would take. Shoves have weight, collisions shake the camera, kills punch in. A title screen, Esc pause, how-to-play and volume settings. And the download is a third smaller (24 MB).

## Devlog post for 0.2.0 (2026-10-21)

**0.2.0 — the shove is real.** Until now no unit in the build had a pushing attack, so the pits were scenery and the title was a promise. Melee hits now shove the target one tile: into a wall for collision damage, into an ally so both get hurt, into a pit to remove it. A shoved unit can't strike back; a pinned one does. Level 1 has four pits down the middle, and amber tiles show where a shove lands, for you and for the enemy's revealed intent.
