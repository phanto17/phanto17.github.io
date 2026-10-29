---
title: Eternity Keeper
kind: tool
summary: An open-source save editor for Pillars of Eternity, rebuilt for the current game. Inventory, abilities, party, stronghold and vendors, with every edit verified in-game.
genre: Modding tool · RPG save editor
status: released
dates:
  start: "2026-07"
role: Maintainer of the fork — product direction, reverse engineering, testing, release engineering
engine: Java 8 · JCEF (embedded Chromium) · jQuery UI · Python (UnityPy)
order: 4
highlights:
  - Save-format reverse engineering
  - 708 JUnit tests + scripted UI suites
  - Installer + CI/CD release pipeline
metrics:
  - 708 JUnit + 29 UI suites
  - 25 save-safety invariants
  - ~44k LoC across 90 commits
myContribution:
  - "Took over a dormant community fork (Kim Mantas 2015–16, ktully 2020, aybrkaknc Feb 2026) and shipped 1.0.0-beta and 1.0.1-beta: 90 commits since July 2026, about 44,000 lines added across Java, JavaScript and Python, including tests."
  - "Reverse-engineered how the game treats its saves: which objects it re-creates on load, how companion death patches a .NET BinaryFormatter quest-tracker blob, how item and store state lives in the area files. Documented it in `docs/save-format.md`, `invariants.md` and `features.md` for the next maintainer."
  - "Designed the editing features to the game's own rules: inventory with equipment/quick-slot/weapon-set constraints, abilities filtered by class and race progression tables, grimoires, stronghold economy (Prestige/Security arithmetic), vendors read from area files, companion resurrection with quest restore, loadouts, save comparison, Undo/Redo."
  - "Made it safe: the editor never writes to the opened save, validates every write against 25 documented invariants (unique IDs, paired item lists, declared types), refuses partially read saves, and keeps backups."
  - "Verified every feature by loading edited saves in the game (Steam v3.9.5) and reading the game's own log; built a 12-save companion-death test matrix and a scripted test environment."
  - "Built the release pipeline: ready-to-run zip and a per-user Inno Setup installer carrying their own Java 8 runtime, a GitHub Actions CI workflow for the 708 JUnit tests, and a Package workflow that installs, upgrades and uninstalls the build on a clean Windows runner."
  - "Wrote the game-data reader (Python, UnityPy, frozen with PyInstaller) that pulls item names, icons, abilities and stronghold data from the player's own install in the game's language."
  - "Opened a pull request offering everything back to the parent project, and announced the releases to the Pillars of Eternity community."
  - "Most of the code was written with Codex, Antigravity and Claude Code under my direction: I specified each feature from the game's behaviour, reviewed the changes, and did all in-game testing. The commits say so."
tools:
  - Java 8 (bundled JDK)
  - Maven
  - JCEF / Chromium 45
  - jQuery + Bootstrap
  - JUnit
  - Python 3 + UnityPy + PyInstaller
  - Inno Setup 6
  - GitHub Actions
  - Claude Code
  - Codex
  - Antigravity
media:
  - { type: image, src: /media/eternity-keeper/inventory.avif, alt: "Inventory tab: equipment around the portrait, quick items and weapon sets, every party member's pack", caption: "Fig. 1 — the Inventory tab, laid out like the game's own screen" }
  - { type: image, src: /media/eternity-keeper/character.avif, alt: "Character tab with attributes, skills, identity and portrait", caption: "Fig. 2 — character sheet: identity choices show what they are worth" }
  - { type: image, src: /media/eternity-keeper/abilities.avif, alt: "Abilities and talents tab", caption: "Fig. 3 — abilities and talents, filtered by what the class and race can learn" }
  - { type: image, src: /media/eternity-keeper/stronghold.avif, alt: "Stronghold tab with upgrades, hirelings and prisoners", caption: "Fig. 4 — stronghold upgrades with the game's Prestige and Security arithmetic" }
downloadUrl: https://github.com/phanto17/eternity-keeper/releases
githubUrl: https://github.com/phanto17/eternity-keeper
credits:
  - { asset: "Eternity Keeper (original, 2015–16)", author: "Kim Mantas", url: "https://bitbucket.org/Fyorl/eternity-keeper", license: "GPL-3.0" }
  - { asset: "0.20a conversion work (2020)", author: "ktully", url: "https://github.com/ktully/eternity-keeper", license: "GPL-3.0" }
  - { asset: "0.21a update for the current game (Feb 2026)", author: "aybrkaknc (u/ayberk2766)", url: "https://github.com/aybrkaknc/eternity-keeper", license: "GPL-3.0" }
  - { asset: "JCEF, Logback, Commons IO, Guava, zip4j, org.json, UnityPy and the other libraries", author: "their authors — listed in THIRD-PARTY-NOTICES.md", license: "see notices" }
---

## What it is

Eternity Keeper is a desktop save editor for *Pillars of Eternity*. The original (2015–16) stopped working when the game was rebuilt in 2025; a community member brought it back to life in February 2026, and I have been building on his work since July. Version 1.0.0-beta (6 October 2026) was the first release with an installer; version 1.1.0-beta followed on 23 October. Open a save, change your characters, their gear and abilities, your party and your stronghold, press Save, and load the result in the game. The editor never writes to the save you opened.

This is not a game, but it is the project where I've done my deepest gameplay-systems work: every feature is a model of how the game actually treats its data, checked by loading the result in the game. It also feeds my YouTube channel, which is adapting a Pillars of Eternity questline.

## Technical breakdown

### 1. The save is three formats in one

A Pillars save is a zip of XML, Unity-serialised object graphs and, nested inside them, .NET BinaryFormatter blobs. Companion death, for example, fails the companion's quest by patching exactly one entry of a serialised quest tracker. Resurrecting a companion means rebuilding their object from a donor, de-colliding every ID, clearing the death flags, and un-failing that quest byte-exactly. Each of these facts was measured against real saves (a twelve-save death matrix) rather than guessed, and written down in `docs/features.md`.

### 2. Invariants before writes

Twenty-five documented rules describe what the game relies on when it loads a save: every object ID unique and its own, item lists that pair up, nothing referenced that isn't in the save, values of the type the file declares. Every write the editor makes is checked against them first, and an edit that would break one is refused with a message saying what and where. A save that could only be read in part opens with a warning but can't be written back, because writing only what was read would silently lose the rest.

### 3. A release that tests itself

The CI workflow runs 708 JUnit tests and the node-run suites for the page's merge, search, comparison and undo logic. The Package workflow builds the zip and the installer, then installs, starts, upgrades and uninstalls the build on a clean Windows runner before attaching it to a draft release. Twenty-nine scripted UI suites (about a thousand checks) drive the running editor over its DevTools port against a real thirteen-character save.

### How I worked

Most of the code was written with Codex, Antigravity and Claude Code under my direction. I decided what the editor should do by watching the game, specified each feature in the game's own terms, reviewed the changes, ran them against real saves, loaded the result in the game and read the game's log. The process notes, invariants and lessons files in the repository are the record of that.
