---
title: Barrowlight
summary: A playable 18-room 2D pixel-art dark-fantasy RPG powered by my custom .NET 10 / Raylib-cs engine, branching across Prologue + Acts I–III into 7 epilogues with CRT shader and 1,103 tests.
genre: 2D pixel-art RPG & custom .NET 10 engine
kind: game
category: "PLAYABLE RPG // C# .NET 10 + RAYLIB-CS"
platforms:
  - Windows x64 Playable Build
  - .NET 10 CLI
status: playable
dates: { start: 2026-10, end: 2026-11 }
role: Engine Architect & Lead Maintainer (AI-Assisted)
engine: C# (.NET 10), Raylib-cs, Spectre.Console
highlights:
  - "Decoupled RpgEngine.Core simulation driving both Spectre.Console CLI and a 480×270 Raylib-cs pixel client"
  - "Barrowlight campaign featuring 18 authored rooms across Prologue + Acts I–III and 7 distinct epilogues"
  - "Deterministic SkillCheck, AbilityCheck and SavingThrow resolution over seeded RNG & character attributes"
  - "Headless PixelGame + EventSequencer testability verifying UI & animation timelines without opening a GPU window"
  - "46 custom 480×270 pixel-art plates, 31 WAV sound effects, 8 music cues, F2 CRT shader and F6 DungeonAtlas"
  - "1,103 automated tests (1,077 .NET tests + 26 Python asset-pipeline checks) guarding every PR"
myContribution:
  - "Designed the clean boundary between RpgEngine.Core domain logic and two swappable presentation frontends (Spectre.Console terminal CLI and Raylib-cs pixel client)."
  - "Engineered core RPG rules: deterministic ability/skill/save check resolution, turn combat, torch light mechanics, inventory, quests, JSON dialogue trees and save serialization."
  - "Directed the RpgEngine.Pixel 480×270 presentation stack including EventSequencer beat timing, paged verb menus, toggleable CRT post-processing (F2) and an in-game DungeonAtlas (F6)."
  - "Delivered the complete Barrowlight campaign (18 rooms across Prologue and Acts I–III, 7 endings) and portable Windows x64 build packaging."
  - "Authored with OpenAI Codex and Claude Code under my architectural direction, pull-request review and playtesting."
metrics:
  - 1,077 .NET automated tests + 26 Python tooling checks (1,103 total)
  - 18 authored rooms spanning Prologue and Acts I–III
  - 7 branching campaign epilogues
  - 46 pixel-art PNG scenes + 31 WAV SFX + 8 score cues
tools:
  - C#
  - .NET 10
  - Raylib-cs
  - Spectre.Console
  - xUnit
  - JSON Content Data
  - Python Asset Pipeline
  - Codex / Claude Code
media:
  - { type: image, src: "/media/barrowlight/cover.avif", alt: "Barrowlight pixel-art banner showing a lantern-lit stone cemetery archway in heavy rain framed by twin hooded statues", caption: "Barrowlight — playable dark-fantasy RPG & custom .NET 10 pixel client" }
  - { type: image, src: "/media/barrowlight/chamber.avif", alt: "Barrowlight underground chamber explored with warm torchlight glow and paged verb menu", caption: "Exploration view pairing atmospheric 480×270 room plates with paginated diegetic verbs" }
  - { type: image, src: "/media/barrowlight/combat.avif", alt: "Turn-based combat HUD in Barrowlight showing enemy art, vitals and turn log", caption: "Turn combat frontend reading deterministic RpgEngine.Core combat state" }
  - { type: image, src: "/media/barrowlight/loom.avif", alt: "Purple arcane chamber interior inside Act II / III of Barrowlight", caption: "Late-campaign chamber state tracking light, lore flags and room interactions" }
  - { type: image, src: "/media/barrowlight/nocturne.avif", alt: "Sanctuary scene inside Act III of Barrowlight before campaign epilogue resolution", caption: "Act III sanctuary slice branching toward seven distinct epilogues" }
  - { type: image, src: "/media/barrowlight/title.avif", alt: "Barrowlight 480x270 pixel-art title plate above misty hillside ruins", caption: "Native 480×270 in-engine title plate rendered cleanly without smoothing blur" }
githubUrl: https://github.com/phanto17/text-rpg-engine
credits:
  - { asset: "Raylib-cs / raylib", author: "ChrisDill / raysan5", license: "zlib/libpng" }
  - { asset: "Spectre.Console", author: "Patrik Svensson & contributors", license: "MIT" }
  - { asset: "Custom pixel plates, 31 WAV SFX & 8 score cues", author: "Generated via in-repo Python tooling scripts", license: "Repository license" }
order: 5
world:
  kind: archive
  accent: "#c6a8ff"
---

**Barrowlight** (`text-rpg-engine`) is an open-source **C# / .NET 10** narrative RPG engine paired with its flagship 18-room campaign. Every rule—navigation, torch light decay, inventory, quest state, branching dialogue, save files and turn-based combat—runs inside a pure engine assembly (`RpgEngine.Core`) that has zero knowledge of whether it is rendering inside a terminal window or a GPU sprite buffer.

The same world data powers both a structured **Spectre.Console** CLI and **`RpgEngine.Pixel`**, a native `480×270` Raylib-cs desktop build complete with an optional `F2` CRT shader, `F6` live `DungeonAtlas`, `46` pixel plates, `31` synthesized SFX and `8` music cues.

### One simulation core, two frontends

<figure class="diagram">
<svg viewBox="0 0 640 164" role="img" aria-labelledby="bl-t bl-d">
  <title id="bl-t">RpgEngine.Core dual frontend architecture</title>
  <desc id="bl-d">JSON campaign data feeds RpgEngine.Core, which exposes headless rules to both RpgEngine.CLI (Spectre.Console) and RpgEngine.Pixel (480x270 Raylib-cs client with CRT shader and DungeonAtlas).</desc>
  <rect x="20" y="14" width="164" height="58" rx="6" fill="#2f291b" stroke="#5d412b"/>
  <text x="102" y="39" text-anchor="middle" fill="#f3e6d3" font-family="DM Sans,sans-serif" font-size="13" font-weight="600">JSON Campaign</text>
  <text x="102" y="57" text-anchor="middle" fill="#b9a68f" font-family="DM Mono,monospace" font-size="10">18 rooms · 7 endings</text>

  <line x1="184" y1="43" x2="236" y2="82" stroke="#5d412b" stroke-width="1.5"/>

  <rect x="236" y="42" width="176" height="80" rx="6" fill="#3a3224" stroke="#cab5ce" stroke-width="1.5"/>
  <text x="324" y="69" text-anchor="middle" fill="#cab5ce" font-family="DM Sans,sans-serif" font-size="14" font-weight="700">RpgEngine.Core</text>
  <text x="324" y="89" text-anchor="middle" fill="#f3e6d3" font-family="DM Mono,monospace" font-size="10">checks · combat · quests</text>
  <text x="324" y="106" text-anchor="middle" fill="#b9a68f" font-family="DM Mono,monospace" font-size="10">torch · saves · dialogue</text>

  <line x1="412" y1="64" x2="466" y2="38" stroke="#f6d370" stroke-width="1.5"/>
  <line x1="412" y1="98" x2="466" y2="124" stroke="#7fd6c2" stroke-width="1.5"/>

  <rect x="466" y="14" width="154" height="52" rx="6" fill="#2f291b" stroke="#f6d370"/>
  <text x="543" y="37" text-anchor="middle" fill="#f6d370" font-family="DM Sans,sans-serif" font-size="13" font-weight="600">RpgEngine.CLI</text>
  <text x="543" y="54" text-anchor="middle" fill="#b9a68f" font-family="DM Mono,monospace" font-size="10">Spectre.Console loop</text>

  <rect x="466" y="96" width="154" height="54" rx="6" fill="#2f291b" stroke="#7fd6c2"/>
  <text x="543" y="120" text-anchor="middle" fill="#7fd6c2" font-family="DM Sans,sans-serif" font-size="13" font-weight="600">RpgEngine.Pixel</text>
  <text x="543" y="137" text-anchor="middle" fill="#b9a68f" font-family="DM Mono,monospace" font-size="10">480×270 Raylib-cs + CRT</text>
</svg>
<figcaption>Fig. — One headless <code>RpgEngine.Core</code> assembly drives both the terminal CLI and the 480×270 desktop client.</figcaption>
</figure>

## Technical breakdown

### Deterministic rules & check resolution

All tabletop mechanics live behind pure functions taking a seedable `IRandom` source. Both the terminal runner and the graphical Raylib-cs client read the exact same `CheckResult` structure—making dialogue gates, skill checks and combat rolls trivial to unit-test:

```csharp
// src/RpgEngine.Core/Checks/CheckResolver.cs
public static CheckResult SkillCheck(
    Character character, string skillId, int dc, IRandom rng, int modifier = 0)
{
    var ability = SkillMap.GetAbility(skillId);
    int bonus = character.GetSkillBonus(skillId, ability) + modifier;
    return Resolve($"Skill ({skillId})", bonus, dc, rng);
}

public static CheckResult AbilityCheck(
    Character character, string ability, int dc, IRandom rng, int modifier = 0)
{
    int bonus = character.Attributes.GetModifier(ability) + modifier;
    return Resolve($"Ability ({ability})", bonus, dc, rng);
}

public static CheckResult SavingThrow(
    Character character, string ability, int dc, IRandom rng, int modifier = 0)
{
    int bonus = character.GetSavingThrowBonus(ability) + modifier;
    return Resolve($"Save ({ability})", bonus, dc, rng);
}
```

### Headless pixel client & EventSequencer

Rather than hiding game flow inside raylib draw callbacks, `RpgEngine.Pixel` runs `PixelGame` and its `EventSequencer` state without requiring a graphics context. Input timing, paged action menus, combat animation beats and fullscreen/CRT shortcuts are verified automatically under `.NET` tests, reaching **1,077 .NET tests** plus **26 Python tooling checks** (**1,103 total**) across the repository.

### Portable desktop packaging & AI workflow

A dedicated packaging script compiles a self-contained **Windows x64** archive bundling the `480×270` plates, audio banks and shaders with zero runtime SDK prerequisites. Implementation, pixel-art pipeline scripts and test authoring were carried out with **OpenAI Codex** and **Claude Code** under my direction, PR inspection and playtesting.
