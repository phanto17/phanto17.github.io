# itch.io page — Push Comes to Shove

Paste into the project page. Settings: Kind = HTML, "This file will be played in the browser",
viewport 960 × 600, fullscreen button on, mobile off, "SharedArrayBuffer support" off
(the build uses no threads). Classification: Game · Strategy. Tags: turn-based, tactics,
grid, puzzle, pixel-art, singleplayer, unity. Pricing: free (no payments).

## Short description (tagline)

Read the board, push enemies into pits, and set up the perfect turn before they get theirs. A small deterministic tactics game.

## Description

**Push Comes to Shove** is a small turn-based tactics game on an isometric grid, made solo in Unity.

Deploy your squad of four on your side of the board, then take turns with the enemy. Every unit gets two actions a turn: move along a path, or attack. Soldiers strike adjacent enemies and get struck back; archers shoot in straight lines; some attacks push. Pushing is the point:

- shove an enemy into a wall for extra damage,
- into an ally so both get hurt,
- or into a pit to remove it outright.

Damage is fixed, never rolled, so every outcome is yours to work out. Enemies don't telegraph before your turn — on their turn they reveal their intent one at a time, and then act. Clear the board to win.

### Controls

Mouse only. Pick a mode (Place / Move / Attack) with the buttons, click a unit, click a target. Right-click cancels. **End Turn** when you're done.

### About

A gameplay-programming prototype: a deterministic grid engine with BFS pathing and push resolution, attacks as ScriptableObject strategies shared by the player and the AI, and a paced enemy turn. The systems are unit-tested. Write-up and source: https://phanto17.github.io/projects/push-comes-to-shove/

### Credits

- Isometric Sandbox tiles: [Kenney](https://kenney.nl), CC0
- Characters (Humans, Orc, Elf, Goblin): [Sanctum Pixel](https://sanctumpixel.itch.io) — the *Top Down Pixel Art Characters* packs
- Animated damage numbers and their Alphapix font: [PixelBattleText](https://assetstore.unity.com/packages/2d/gui/pixelbattletext-189358) by Psychic Fur
- UI font: [Pixellari](https://www.dafont.com/pixellari.font) by Zacchary Dempsey-Plante
- Design and code: Tymoteusz Jaskólski

Inspired by *Into the Breach* and *King's Bounty*.
