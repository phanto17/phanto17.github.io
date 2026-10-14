---
title: Push Comes to Shove
summary: Deterministic grid tactics. Read the board, push enemies into pits and into each other, and set up the perfect turn before they get theirs.
genre: Turn-based tactics / puzzle
status: in-progress
dates:
  start: "2026-03"
role: Solo — design & programming
engine: Unity 6 · URP 2D
order: 2
highlights:
  - BFS pathing & push resolution (unit-tested)
  - Attacks as ScriptableObject strategies
  - Paced enemy AI with intent reveal
myContribution:
  - "Grid model built from a Tilemap: `RuntimeCellData` per cell with walkable / hazard flags from `CellData` ScriptableObjects, 0-based indexing independent of the tilemap origin."
  - "Cardinal breadth-first reachability and shortest-path routing that treats walls, hazards and occupied cells as blockers — units walk around obstacles tile by tile instead of teleporting."
  - "Push resolution: pushes resolve farthest-first; hitting a wall or the map edge deals collision damage, hitting another unit damages both, and a unit shoved onto a hazard tile is destroyed."
  - "`Attack` as a ScriptableObject strategy (Melee, Ranged, Line): each decides what it can target and which cells it hits, so the player's attack mode and the enemy AI share one rule set. Instant `Execute` for tests, animated coroutine for play (swing → projectile → hit → counter-attack)."
  - "Melee retaliation, no friendly fire, and typed weaknesses that add +50% damage."
  - "Enemy AI: attack if a clear shot exists, otherwise move to the best firing cell, otherwise advance; the whole enemy turn is a paced coroutine that reveals each enemy's intent (green route, red cells) just before it acts."
  - "Turn manager with deployment and battle phases, a two-action-per-unit economy, win/lose per level objective (clear the board or survive N turns), result overlay and restart."
  - "State-pattern interaction modes (place, move, attack) with phase-gated buttons; roster and enemy info cards built from code; frame-by-frame sprite animator; hit-flash via a custom sprite shader and MaterialPropertyBlock."
  - "23 EditMode tests over grid maths, pathing, pushes, retaliation, weaknesses and the AI's friendly-fire check, using a test-only grid constructor."
  - "Design docs: vision and pillars, mechanic comparison against Into the Breach, King's Bounty and Octopath Traveler, and a staged plan for the HD-2D look."
tools:
  - Unity 6000.3 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
  - Unity Test Framework (NUnit)
  - TextMesh Pro
  - Shader Graph / HLSL
media:
  - { type: image, src: /media/push-comes-to-shove/enemy-turn.webp, alt: "Enemy turn: a goblin's green movement path is revealed before it acts", caption: "Fig. 1 — enemy turn: one enemy's intent at a time (web build, 800 px capture — TODO recapture at 1280)" }
  - { type: image, src: /media/push-comes-to-shove/deploy.webp, alt: "Deployment phase with the blue player zone and four placed units", caption: "Fig. 2 — deploying the squad in the player's zone" }
  - { type: image, src: /media/push-comes-to-shove/move-range.webp, alt: "A selected soldier with its reachable tiles highlighted in green", caption: "Fig. 3 — path-aware move range of the selected unit" }
# itchUrl: TODO after the WebGL build is published on itch.io
credits:
  - { asset: "Isometric Sandbox tile sheet", author: "Kenney", url: "https://kenney.nl", license: "CC0" }
  - { asset: "Humans — Top Down Pixel Art Character Assets", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io/humans-top-down-pixel-art-character-assets", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "Orc — Top Down Pixel Art Characters", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io/orc-top-down-pixel-art-characters", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "Elf and Goblin — Top Down Pixel Art Characters", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "PixelBattleText (animated damage numbers, bundles the Alphapix font)", author: "Psychic Fur", url: "https://assetstore.unity.com/packages/2d/gui/pixelbattletext-189358", license: "Free, Unity Asset Store EULA" }
  - { asset: "Pixellari font (UI)", author: "Zacchary Dempsey-Plante", url: "https://www.dafont.com/pixellari.font", license: "100% free, credit requested" }
---

## The game

Push Comes to Shove is a small turn-based tactics game on an isometric grid. You deploy a squad of four on your side of the board, then alternate turns with the enemy. Each unit has two actions a turn: move along a cardinal path, or attack. Melee units strike adjacent enemies and get struck back; archers shoot in straight lines; some attacks push. Pushing is the point: shove an enemy into a wall for extra damage, into an ally so both get hurt, or into a pit to remove it outright. Enemies don't telegraph before your turn — on their turn they reveal their intent one at a time, and then act. Clear the board (or survive the required number of turns) to win.

The design pillar is one line: **read the board, set up the perfect turn.** Damage is fixed, not rolled, so every outcome is yours to compute.

<span class="todo">TODO: 2–3 sentences on why I pivoted from pre-turn telegraphs to on-turn intent reveal, and what it did to the feel.</span>

## Technical breakdown

### 1. Grid, pathing and pushes — all tested

The grid is a plain C# class over a 2D array of cells, with a second internal constructor that builds it without a Tilemap. That constructor is what the EditMode tests use: they build a 5×5 grid in memory, block some cells with throwaway units and assert on reachability, shortest paths and push outcomes. Movement is a breadth-first flood in four directions that stops at walls, hazards and occupied cells, so the highlighted "reachable" area is exactly the set of tiles the unit can actually walk to. Pushes walk the affected cells farthest-first so a chain of shoves resolves without a unit being moved onto a cell that is about to be vacated.

<span class="todo">TODO: code excerpt of `Grid.Bfs` or `Attack.PushUnit`, and a GIF of a push into a pit.</span>

### 2. One attack rule set for player and AI

Each attack type is a ScriptableObject with two questions: *can I aim at that cell?* and *which cells do I hit?* The player's attack mode uses them to draw the red preview; the enemy AI uses the same two calls to decide whether a shot is clear (and refuses shots that would hit a teammate). Resolution lives in the base class: snapshot targets, apply damage and weakness bonus, apply pushes, then let a surviving adjacent melee defender counter once. There is an instant path for tests and a coroutine path for play that plays the swing, flies the projectile, lands the hit and then the counter.

### 3. A readable enemy turn

The enemy turn is a coroutine that iterates enemies in board order. For each action it decides (attack if clear, else move to the best firing cell, else advance toward the nearest player), draws that intent on the board, waits a beat so you can read it, resolves it with the same animated attack path the player uses, and clears the indicator. Only one enemy's intent is ever on screen, so routes never overlap into a blob. The turn manager gates player input until the coroutine finishes.

### What's next

A second level, audio, and the web build. The HD-2D look pass (post-processing, depth backdrop, grounding shadows, animated sprites) is done; lit sprite materials are still to come.
