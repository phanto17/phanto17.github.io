---
title: Push Comes to Shove
summary: Deterministic grid tactics. Read the board, push enemies into pits and into each other, and set up the perfect turn before they get theirs.
genre: Turn-based tactics / puzzle
status: playable
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
  - "Push resolution: pushes resolve farthest-first and can carry a unit more than one tile; hitting a wall or the map edge deals collision damage, hitting another unit damages both, and a unit shoved onto a hazard tile is destroyed."
  - "`Attack` as a ScriptableObject strategy (Melee, Ranged, Line): each decides what it can target and which cells it hits, so the player's attack mode and the enemy AI share one rule set. Instant `Execute` for tests, animated coroutine for play (swing → projectile → hit → counter-attack)."
  - "Melee retaliation, no friendly fire, and typed weaknesses that add +50% damage: blades, arrows and (since 0.5.0) piercing shots, with every unit type countered by one on the other side."
  - "Roster and counters (0.5.0): three new units from the purchased character sheets, recoloured with the palettes the sheets ship as swatches. The red orc Brute is slow and tough and its heavy blow shoves two tiles. The blue goblin Harrier and, on the player's side, the purple elf Ranger fire the piercing shot, the line attack that had sat unused since the prototype: it hits every foe in a row until a rock, passes allies and shoves each foe one tile. A third damage kind, pierce, is the brute's weakness. To keep the previews honest with two-tile shoves and several units pushed at once, the attack now plays its shoves on a copy of the board (damage first, far units first, collisions and pits) and both the amber landing tiles and the outcome numbers read that simulation."
  - "Enemy AI: attack if a clear shot exists, otherwise move to the best firing cell, otherwise advance by walking distance (a breadth-first distance field from the squad, so enemies go round rocks and pits instead of pressing against them); the whole enemy turn is a paced coroutine that reveals each enemy's intent (green route, red cells) just before it acts."
  - "Turn manager with deployment and battle phases, a two-action-per-unit economy, win/lose per level objective (clear the board or survive N turns), result overlay and restart."
  - "Five levels (0.4.0): boards written as ASCII maps and turned into tilemap prefabs by an editor script, with hand-placed deployment tiles, enemies and squad size, rocks that block movement, arrows and shoves, a level catalog, unlocks saved in PlayerPrefs, a briefing card per level, a level select and Next Level on the result screen."
  - "State-pattern interaction modes (place, move, attack) with phase-gated buttons; roster and enemy info cards built from code; frame-by-frame sprite animator; hit-flash via a custom sprite shader and MaterialPropertyBlock."
  - "68 EditMode tests over grid maths, pathing, pushes, retaliation, weaknesses, first-hit arrows, the piercing shot, the brute's two-tile shove, the attack preview, the AI's friendly-fire check and route round walls, the unlock rules, every level being winnable on paper (room for the squad, every enemy able to walk to it) the counter web (every enemy in the levels has a counter in the squad, and the other way round) and the shipped data, using a test-only grid constructor."
  - "Most of the code was written with an AI assistant (Claude Code) under my direction: I specified the systems, reviewed the changes and did the testing. The October 2026 upgrade (the shove, audio, feel, front end, review round, the level set) was done that way from a plan I approved step by step."
  - "Design docs: vision and pillars, mechanic comparison against Into the Breach, King's Bounty and Octopath Traveler, and a staged plan for the HD-2D look."
tools:
  - Unity 6000.3 (URP 17, 2D renderer)
  - C#
  - Tilemap
  - Input System
  - Unity Test Framework (NUnit)
  - TextMesh Pro
  - Claude Code
  - Shader Graph / HLSL
media:
  - { type: image, src: /media/push-comes-to-shove/enemy-turn.webp, alt: "Enemy turn: a goblin's green movement path is revealed before it acts", caption: "Fig. 1 — enemy turn: one enemy's intent at a time (web build)" }
  - { type: image, src: /media/push-comes-to-shove/deploy.webp, alt: "Deployment phase with the blue player zone and four placed units", caption: "Fig. 2 — deploying the squad in the player's zone" }
  - { type: image, src: /media/push-comes-to-shove/move-range.webp, alt: "A selected soldier with its reachable tiles highlighted in green", caption: "Fig. 3 — path-aware move range of the selected unit" }
itchUrl: https://phanto-official.itch.io/push-comes-to-shove
credits:
  - { asset: "Isometric Sandbox tile sheet", author: "Kenney", url: "https://kenney.nl", license: "CC0" }
  - { asset: "Humans — Top Down Pixel Art Character Assets", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io/humans-top-down-pixel-art-character-assets", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "Orc — Top Down Pixel Art Characters", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io/orc-top-down-pixel-art-characters", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "Elf and Goblin — Top Down Pixel Art Characters", author: "Sanctum Pixel", url: "https://sanctumpixel.itch.io", license: "Purchased; commercial use allowed, no resale" }
  - { asset: "PixelBattleText (animated damage numbers, bundles the Alphapix font)", author: "Psychic Fur", url: "https://assetstore.unity.com/packages/2d/gui/pixelbattletext-189358", license: "Free, Unity Asset Store EULA" }
  - { asset: "Pixellari font (UI)", author: "Zacchary Dempsey-Plante", url: "https://www.dafont.com/pixellari.font", license: "100% free, credit requested" }
  - { asset: "Impact Sounds, RPG Audio, Interface Sounds and Music Jingles (sound effects and stings)", author: "Kenney", url: "https://kenney.nl/assets", license: "CC0" }
  - { asset: "Battle Theme A and Mysterious Ambience (music loops)", author: "cynicmusic", url: "https://pixelsphere.org", license: "CC0, credit requested" }
---

## The game

Push Comes to Shove is a small turn-based tactics game on an isometric grid, five levels long. On each board you deploy your squad on your side, then alternate turns with the enemy. Each unit has two actions a turn: move along a cardinal path, or attack. Melee hits shove the target one tile in the direction of the blow (a brute's, two); archers shoot in straight lines; rangers and harriers fire a piercing shot that hits and shoves every foe in a row. Pushing is the point: shove an enemy into a wall for collision damage, into an ally so both get hurt, or into a pit to remove it outright. A shoved unit is out of reach and can't strike back; one pinned against a wall takes the collision and does. Enemies don't telegraph before your turn — on their turn they reveal their intent one at a time, and then act. Clear the board (or survive the required number of turns) to win.

The design pillar is one line: **read the board, set up the perfect turn.** Damage is fixed, not rolled, so every outcome is yours to compute.

The first version followed Into the Breach: every enemy telegraphed its next move before my turn, so each turn was a puzzle against known threats. In June 2026 I replaced that with an on-turn reveal. Enemies act on their own turn, one at a time, and each shows its intended move or target for a beat before carrying it out, which is closer to King's Bounty's "watch the enemy act". The telegraph-based Break mechanic went with it. What the player plans against now is everything the board shows: positions, attack ranges, weaknesses and fixed damage.

## Technical breakdown

### 1. Grid, pathing and pushes — all tested

The grid is a plain C# class over a 2D array of cells, with a second internal constructor that builds it without a Tilemap. That constructor is what the EditMode tests use: they build a 5×5 grid in memory, block some cells with throwaway units and assert on reachability, shortest paths and push outcomes. Movement is a breadth-first flood in four directions that stops at walls, hazards and occupied cells, so the highlighted "reachable" area is exactly the set of tiles the unit can actually walk to. Pushes walk the affected cells farthest-first so a chain of shoves resolves without a unit being moved onto a cell that is about to be vacated.

A push moves its target one tile at a time and stops at the first thing in the way. Each outcome is a few lines:

```csharp
private static void PushUnit(Grid grid, RuntimeCellData cell, Vector2Int direction, int distance)
{
    for (int step = 0; step < distance; step++)
    {
        Unit unit = cell.Unit;
        if (unit == null)
            return;

        RuntimeCellData dest = grid.GetCellAt(
            cell.GridPosition.x + direction.x,
            cell.GridPosition.y + direction.y);

        bool blockedByWall = dest == null || !dest.IsWalkable;

        if (blockedByWall)
        {
            unit.TakeDamage(CollisionDamage, cell);
            return;
        }

        if (dest.IsOccupied)
        {
            unit.TakeDamage(CollisionDamage, cell);
            dest.Unit.TakeDamage(CollisionDamage, dest);
            return;
        }

        cell.Unit = null;
        dest.Unit = unit;
        unit.transform.position = dest.WorldPosition;
        cell = dest;

        // Shoved into a hazard (pit / water) — the unit is destroyed.
        if (cell.IsHazard)
        {
            unit.TakeDamage(unit.CurrentHP, cell);
            return;
        }
    }
}
```
<p class="excerpt-caption">Attack.cs — <code>PushUnit</code>, unedited. <code>CollisionDamage</code> is 1.</p>

<figure class="diagram">
<svg viewBox="0 0 760 304" role="img" aria-labelledby="push-t push-d">
<title id="push-t">The four outcomes of a push</title>
<desc id="push-d">A line attack hits an enemy and pushes it one tile. Into a free tile it slides. Into a wall or the map edge it stops and takes 1 collision damage. Into another unit both take 1 collision damage. Into a pit or water it is destroyed.</desc>
<defs><marker id="push-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f2b180"/></marker><marker id="hit-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f6d370"/></marker><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#5d412b"/><line x1="0" y1="0" x2="0" y2="8" stroke="#3a3224" stroke-width="3"/></pattern></defs>
<text x="24" y="32" class="mono" font-size="11" fill="#a79a88" letter-spacing="1.5">HIT, THEN PUSH</text>
<text x="252" y="32" class="mono" font-size="11" fill="#a79a88" letter-spacing="1.5">WHAT HAPPENS</text>
<g transform="translate(0,52)">
<rect x="24" y="0" width="44" height="44" rx="8" fill="#f6d370" fill-opacity=".16" stroke="#f6d370"/><text x="46" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f6d370">A</text>
<line x1="70" y1="22" x2="92" y2="22" stroke="#f6d370" stroke-width="2" marker-end="url(#hit-ah)"/>
<rect x="96" y="0" width="44" height="44" rx="8" fill="#f27c52" fill-opacity=".18" stroke="#f27c52"/><text x="118" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f27c52">E</text>
<path d="M124 2 Q158 -14 190 2" fill="none" stroke="#f2b180" stroke-width="2" marker-end="url(#push-ah)"/>
<rect x="168" y="0" width="44" height="44" rx="8" fill="#3a3224" stroke="#5d412b" stroke-dasharray="4 3"/>
<text x="252" y="19" font-size="15" fill="#f3e6d3">Free tile: it slides one tile</text>
<text x="252" y="38" font-size="12.5" fill="#b9a68f">A blow pushes 1 (a brute's, 2); a piercing shot pushes every foe in its line, farthest first</text>
</g>
<g transform="translate(0,116)">
<rect x="24" y="0" width="44" height="44" rx="8" fill="#f6d370" fill-opacity=".16" stroke="#f6d370"/><text x="46" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f6d370">A</text>
<line x1="70" y1="22" x2="92" y2="22" stroke="#f6d370" stroke-width="2" marker-end="url(#hit-ah)"/>
<rect x="96" y="0" width="44" height="44" rx="8" fill="#f27c52" fill-opacity=".18" stroke="#f27c52"/><text x="118" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f27c52">E</text>
<path d="M124 2 Q158 -14 190 2" fill="none" stroke="#f2b180" stroke-width="2" marker-end="url(#push-ah)"/>
<rect x="168" y="0" width="44" height="44" rx="8" fill="url(#hatch)" stroke="#5d412b"/>
<text x="252" y="19" font-size="15" fill="#f3e6d3">Wall or map edge: it stops</text>
<text x="252" y="38" font-size="12.5" fill="#b9a68f">and takes 1 collision damage on top of the hit</text>
</g>
<g transform="translate(0,180)">
<rect x="24" y="0" width="44" height="44" rx="8" fill="#f6d370" fill-opacity=".16" stroke="#f6d370"/><text x="46" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f6d370">A</text>
<line x1="70" y1="22" x2="92" y2="22" stroke="#f6d370" stroke-width="2" marker-end="url(#hit-ah)"/>
<rect x="96" y="0" width="44" height="44" rx="8" fill="#f27c52" fill-opacity=".18" stroke="#f27c52"/><text x="118" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f27c52">E</text>
<path d="M124 2 Q158 -14 190 2" fill="none" stroke="#f2b180" stroke-width="2" marker-end="url(#push-ah)"/>
<rect x="168" y="0" width="44" height="44" rx="8" fill="#cab5ce" fill-opacity=".18" stroke="#cab5ce"/><text x="190" y="28" text-anchor="middle" class="mono" font-size="15" fill="#cab5ce">U</text>
<text x="252" y="19" font-size="15" fill="#f3e6d3">Another unit: both stop</text>
<text x="252" y="38" font-size="12.5" fill="#b9a68f">both take 1 collision damage, whichever side they are on</text>
</g>
<g transform="translate(0,244)">
<rect x="24" y="0" width="44" height="44" rx="8" fill="#f6d370" fill-opacity=".16" stroke="#f6d370"/><text x="46" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f6d370">A</text>
<line x1="70" y1="22" x2="92" y2="22" stroke="#f6d370" stroke-width="2" marker-end="url(#hit-ah)"/>
<rect x="96" y="0" width="44" height="44" rx="8" fill="#f27c52" fill-opacity=".18" stroke="#f27c52"/><text x="118" y="28" text-anchor="middle" class="mono" font-size="15" fill="#f27c52">E</text>
<path d="M124 2 Q158 -14 190 2" fill="none" stroke="#f2b180" stroke-width="2" marker-end="url(#push-ah)"/>
<rect x="168" y="0" width="44" height="44" rx="8" fill="#0b070b" stroke="#8fc3df"/><circle cx="190" cy="22" r="9" fill="none" stroke="#8fc3df" stroke-opacity=".5"/>
<text x="252" y="19" font-size="15" fill="#f3e6d3">Pit or water: it falls in</text>
<text x="252" y="38" font-size="12.5" fill="#b9a68f">destroyed outright, whatever health it has left</text>
</g>
</svg>
<figcaption>Fig. — the four outcomes of <code>PushUnit</code> for one push step. A = attacker, E = enemy, U = any other unit.</figcaption>
</figure>

### 2. One attack rule set for player and AI

Each attack type is a ScriptableObject with two questions: *can I aim at that cell?* and *which cells do I hit?* The player's attack mode uses them to draw the red preview; the enemy AI uses the same two calls to decide whether a shot is clear (and refuses shots that would hit a teammate). Resolution lives in the base class: snapshot targets, apply damage and weakness bonus, apply pushes, then let a surviving adjacent melee defender counter once. There is an instant path for tests and a coroutine path for play that plays the swing, flies the projectile, lands the hit and then the counter.

### 3. A readable enemy turn

The enemy turn is a coroutine that iterates enemies in board order. For each action it decides (attack if clear, else move to the best firing cell, else advance along the shortest walkable route to the squad), draws that intent on the board, waits a beat so you can read it, resolves it with the same animated attack path the player uses, and clears the indicator. Only one enemy's intent is ever on screen, so routes never overlap into a blob. The turn manager gates player input until the coroutine finishes.

### What changed in 0.2.0 (October 2026)

Until 0.2.0 nothing in the game pushed. The melee and ranged attack data shipped with a push of 0, and the one pushing attack sat on no unit, so the pits could never be used and this page described a mechanic you could not trigger. I found that on 2026-10-21 while auditing all three games for an upgrade plan. Melee hits now shove one tile, Level 1 has four pits across the middle of the board, the aim preview and the enemy's revealed intent both mark in amber where a shoved unit lands, and seven new EditMode tests pin the rule and the data so it cannot silently vanish again.

### What changed in 0.3.0 (October 2026)

- **Sound, from nothing.** The game had no audio at all. Every action now has one: footsteps per tile, the swing and the hit, the arrow leaving and landing, the shove, the thud of a collision, the fall into a pit, a unit's death, placing and selecting units, button hover and click, end of turn, your turn, the enemy's turn, and a rising or falling sting for victory and defeat. A deployment loop crossfades into a battle loop when the fight starts and fades out when it ends. Gameplay code asks for a sound by meaning (`SfxId.Shove`), and an `AudioLibrary` asset maps each id to a few CC0 clips with a volume and a little pitch jitter, so swapping a sound is a data change. Master, music and SFX volumes persist in PlayerPrefs. The clips are Kenney's packs and two cynicmusic loops, all CC0.
- **The outcome in numbers.** Hovering an enemy in Attack mode now shows, under its health, what the selected unit's blow would do: `YOUR HIT 6 · WEAK +50%` and `SHOVE: INTO THE PIT · KILLS`, or `SHOVE: WALL +1 · COUNTER 4`. A pure `AttackPreview.Compute` returns the same figures the attack then deals, and a test executes the attack after the preview to prove they match.
- **Weight.** A shoved unit glides, squashes on landing and kicks up dust; a collision shakes the camera; a unit pushed into a pit sinks and fades; a kill punches the camera in for a quarter second. The enemy about to act swells for a beat before its intent shows, selected units pop, the hovered cell breathes, the HUD card of a unit that was just hit rattles, and the phase banner pops in on every change. End Turn asks for a second press while units can still act.
- **A front end.** The game used to boot straight into deployment. Now a title screen sits over the board with Play, How to play, Settings and Credits; Esc pauses with Resume, Restart, How to play, Settings and Quit to title. Settings are three sliders (master, music, sound) that persist. The menus are built in code from the same helpers and button prefab as the HUD, so there is no prefab per panel; while one is open the board is frozen and the interaction modes ignore the mouse. The roster cards show two action pips per unit instead of only dimming the sprite.
- **A third of the download.** The build went from 36 MB to 24 MB without touching the art. The four character sheets are 2266 px wide; with Unity's 2048 px cap they were resampled to 2048 × 1706, and 1706 is not a multiple of 4, so the importer silently fell back to uncompressed RGBA32 — 14 MB of texture each. Padding each sheet by two transparent pixels and lifting the cap lets them block-compress, and they are no longer resampled, so they are also sharper.
- **A review round from my own playtest recording (2026-10-22).** Arrows now stop at the first unit in their path instead of hitting every unit up to the target, which the data had allowed since the prototype. A unit picked in Move mode stays picked when switching to Attack, and clicking another of your units re-selects it, so no action needs a cancel first. The menus got the riveted wooden plate the Start Battle button already had, a visible press, readable paragraph text in Pixellari (rebuilt with Polish letters, so my name renders), working volume sliders and an animated result screen. The banner counts deployment (2/4) and units that can still act. Selection flashes the unit and its card; the enemy card blinks when the target changes. Footsteps, shots and the victory sting were swapped for clips that read better. A hover-highlight bug that added a component every frame is fixed.

### What changed in 0.4.0 (October 2026)

One board became five, in order: **First Shove** (a squad of two against an orc and a goblin, three ponds: the shove taught by doing it), **The Crossing** (the board that shipped until now), **Drowned Fields** (water over much of the ground, narrow dry paths, five raiders), **Hold the Line** (a rock ridge with two gaps and a pool past each; survive five turns against six) and **The Warband** (rocks and pools, six raiders). Each board is an ASCII map in an editor script that copies the original board prefab and repaints it, so a new level is a few lines of text. Rocks are cells that cannot be entered: arrows stop at them and a shove into one is a wall collision. They are drawn as a stone block standing on the tile, sorted at its cell like a unit so units in front of and behind a rock overlap it the right way. Each level opens on a briefing card (what you face, the goal, the squad size); the result screen offers Next Level, Replay and a level list, and a win unlocks the next level. The rocks broke the enemy AI first: it advanced by straight-line distance and pressed against the ridge for ever, so it now follows a breadth-first distance field from the squad around rocks and pits. Nine new tests cover the unlock rules, every board (room for the squad, every enemy able to walk to it, a stone drawn for every rock) and the route round a wall.

### What changed in 0.5.0 (October 2026)

Two unit types became five. The new ones are recolours of the four purchased characters, using the alternative palettes the sheets carry as swatches, so they stay in the art style: a red orc **Brute** (16 HP, two moves, a heavy blow that shoves two tiles), a blue goblin **Harrier** and a purple elf **Ranger** for your squad, both with a piercing shot through a whole row. Brutes are weak to piercing shots, so the ranger has a job beyond pushing. Brutes and harriers join Drowned Fields, Hold the Line and The Warband. A two-tile shove and a shot that pushes several units at once broke the old one-step preview, so the attack now simulates its own shoves on a copy of the board, and the preview and the amber landing tiles read that. Ten new tests cover the piercing shot, the two-tile shove, its preview text and a check that every unit type has a counter on the other side.

### What's next

Playtesting the new units' numbers. The HD-2D look pass (post-processing, depth backdrop, grounding shadows, animated sprites) is done; the lit-sprite pass is dropped.
