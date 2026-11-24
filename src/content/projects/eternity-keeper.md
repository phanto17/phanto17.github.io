---
title: Eternity Keeper
kind: tool
category: "SAVE EDITOR // JAVA 8 + JCEF + PYTHON"
platforms:
  - Windows Installer (Inno Setup)
  - Portable ZIP (Bundled JRE 8)
summary: An open-source save editor for Pillars of Eternity rebuilt for Steam v3.9.5, featuring inventory, abilities, party, stronghold and vendor editing backed by 772 JUnit tests and 26 save invariants.
genre: Modding tool / RPG save editor
status: released
dates:
  start: "2026-07"
  end: "2026-11"
role: Fork Maintainer — reverse engineering, architecture, QA & release engineering
engine: Java 8 · JCEF (embedded Chromium) · jQuery UI · Python (UnityPy)
order: 6
world:
  kind: archive
  accent: "#f6d370"
highlights:
  - Save-format reverse engineering across nested XML, Unity object graphs and .NET BinaryFormatter blobs
  - 26 hard save-safety invariants validated before writes, including SaveModel tree-backed writers
  - Strict in-game legality editing for equipment slots, grimoires, class/race abilities and Stronghold arithmetic
  - 772 JUnit tests across 102 test files plus 29 automated DevTools browser UI test suites
  - Python UnityPy asset reader (frozen via PyInstaller) extracting localised items, icons and tables from disk
  - Automated CI and GitHub Releases pipeline delivering signed-layout Inno Setup installers through v1.1.1-beta
metrics:
  - 772 JUnit tests + 29 UI suites
  - 26 documented save-safety invariants
  - 132 commits past upstream 0-21.a (through v1.1.1-beta)
myContribution:
  - "Revived and expanded a dormant community fork through v1.0.0-beta, v1.1.0-beta and v1.1.1-beta: 132 commits past upstream 0-21.a across Java, JavaScript and Python."
  - "Reverse-engineered Steam v3.9.5 save behaviour across nested XML, Unity-serialised objects and .NET BinaryFormatter quest blobs, documenting findings in `docs/save-format.md`, `invariants.md` and `features.md`."
  - "Implemented game-accurate editing tools covering equipment/quick-slot constraints, class- and race-filtered abilities, grimoires, Stronghold Prestige/Security arithmetic, area vendors, companion resurrection, loadouts, save diffs and Undo/Redo."
  - "Enforced 26 save-safety invariants (unique object IDs, paired item lists, type consistency, `SaveModel` tree-backed writers and read-only source handling with automatic backups) so broken saves are rejected before touching disk."
  - "Built an automated QA pipeline combining 772 JUnit `@Test` methods across 102 Java test files with 29 DevTools-driven UI suites against real 13-character saves and in-game verification logs."
  - "Created a Python + UnityPy + PyInstaller data extractor pulling item names, icons and stronghold tables directly from the user's local Pillars install in their chosen language."
  - "Delivered CI and Inno Setup packaging workflows bundling a private Java 8 runtime, verifying fresh install, upgrade and uninstall paths on clean Windows runners."
  - "Most of the code was written with Codex, Antigravity and Claude Code under my direction: I specified features from observed game rules, reviewed diffs, validated every change against real saves and ran in-game log verification."
tools:
  - Java 8 (bundled JDK)
  - Maven
  - JCEF / Chromium 45
  - jQuery + Bootstrap
  - JUnit
  - Python 3 + UnityPy + PyInstaller
  - Inno Setup 6
  - GitHub Actions
  - Codex / Claude Code / Antigravity
media:
  - { type: image, src: "/media/eternity-keeper/cover.avif", alt: "Eternity Keeper banner featuring a glowing purple soul flame above white serif typography", caption: "Eternity Keeper — open-source save editor for Pillars of Eternity" }
  - { type: image, src: /media/eternity-keeper/inventory.avif, alt: "Inventory tab: equipment around the portrait, quick items and weapon sets, every party member's pack", caption: "Fig. 2 — Inventory tab mirroring Pillars of Eternity's equipment & pack layout" }
  - { type: image, src: /media/eternity-keeper/character.avif, alt: "Character tab with attributes, skills, identity and portrait", caption: "Fig. 3 — Character sheet showing attributes, skills and background choices" }
  - { type: image, src: /media/eternity-keeper/abilities.avif, alt: "Abilities and talents tab", caption: "Fig. 4 — Abilities & talents filtered by class and race progression rules" }
  - { type: image, src: /media/eternity-keeper/stronghold.avif, alt: "Stronghold tab with upgrades, hirelings and prisoners", caption: "Fig. 5 — Stronghold view calculating Prestige and Security totals in-tool" }
downloadUrl: https://github.com/phanto17/eternity-keeper/releases
githubUrl: https://github.com/phanto17/eternity-keeper
basedOn: https://github.com/aybrkaknc/eternity-keeper
credits:
  - { asset: "Eternity Keeper (original, 2015–16)", author: "Kim Mantas", url: "https://bitbucket.org/Fyorl/eternity-keeper", license: "GPL-3.0" }
  - { asset: "0.20a conversion work (2020)", author: "ktully", url: "https://github.com/ktully/eternity-keeper", license: "GPL-3.0" }
  - { asset: "0.21a update for the current game (Feb 2026)", author: "aybrkaknc (u/ayberk2766)", url: "https://github.com/aybrkaknc/eternity-keeper", license: "GPL-3.0" }
  - { asset: "JCEF, Logback, Commons IO, Guava, zip4j, org.json, UnityPy and the other libraries", author: "their authors — listed in THIRD-PARTY-NOTICES.md", license: "see notices" }
---

## What it is

Eternity Keeper is a desktop save editor for *Pillars of Eternity* (GPL-3.0). After the original 2015–2016 editor stopped working on modern patches and a contributor restarted it with `0.21a` in February 2026, I took the fork through `v1.0.0-beta` (6 October 2026), `v1.1.0-beta` (23 October) and `v1.1.1-beta` (November 2026). Open a save, inspect or edit characters, gear, abilities, stronghold upgrades and area vendors, and load the output directly in Steam v3.9.5—while leaving your original save file untouched.

Although this is a standalone desktop utility rather than a game, it represents some of my deepest systems-engineering work: every UI operation models real *Pillars of Eternity* save invariants and verifies edited archives inside the game itself.

## Technical breakdown

### 1. Three nested serialisation formats in one save

A *Pillars* save archive bundles XML manifests, Unity-serialised object graphs and nested `.NET BinaryFormatter` blobs. Resurrecting a fallen companion, for example, requires cloning companion structures without object-ID collisions, clearing death flags and patching an exact entry inside the binary quest tracker blob. Rather than guessing at binary offsets, every rule was measured against a 12-save death matrix and documented in `docs/features.md`.

### 2. Twenty-six invariants before any byte hits disk

Twenty-six documented invariants define what the game assumes on load: globally unique object IDs, paired item lists, valid object references, strict declared primitive types and **`SaveModel` tree-backed writers** (Invariant 26). Every save operation runs the full validation pass before writing, blocking broken edits with a pinpointed diagnostic instead of silently corrupting a 40-hour campaign save.

### 3. Self-verifying CI & DevTools UI releases

GitHub Actions executes **772 JUnit `@Test` methods across 102 test files** alongside Node suites covering merge, comparison, search and Undo/Redo logic. A dedicated Packaging workflow builds both the portable ZIP and the Inno Setup installer with its bundled JRE 8, installs, upgrades and uninstalls cleanly on a Windows runner, and **29 scripted DevTools UI suites** exercise the live embedded browser against a full 13-character save.

### How I worked

Most of the code was written with Codex, Antigravity and Claude Code under my direction. I specified every feature from observed in-game rules, reviewed diffs and invariant coverage, and performed all real-save loading and log inspection inside *Pillars of Eternity*.
