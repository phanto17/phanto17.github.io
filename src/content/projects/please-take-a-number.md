---
title: Please Take a Number
summary: A 5-minute 3D waiting-room mystery built for the 2026 Unity Game Jam ("Lucky Number"), combining ticket inspection, queue pacing and four branching endings.
genre: First-person narrative mystery
kind: game
category: "GAME JAM // 3D NARRATIVE MYSTERY"
platforms:
  - WebGL (itch.io)
  - Unity 6 URP 3D
status: playable
dates: { start: 2026-11, end: 2026-11 }
role: Solo Designer & Programmer (AI-Assisted Jam Entry)
engine: Unity 6 (6000.6.7f1), URP 3D
highlights:
  - "Pure-C# TicketLedger, QueueTimeline & DayClock state machines with 431 automated EditMode tests"
  - "Four deterministic endings resolved from keeping #007, trading #008 or #009, or using the paper shredder"
  - "Diegetic physical interactions across paper ticket inspection, desk notes, PA calls and patron conversations"
  - "Cooldown-gated audio mixer combining 53 generated cues with 28 Python-synthesized room & paper sounds"
  - "14.5 MB Brotli-compressed WebGL build live on itch.io with full third-party and AI attribution disclosure"
  - "Clear separation between pure domain state and URP 3D Unity scene bindings for rapid jam iteration"
myContribution:
  - 'Designed the "Lucky Number" waiting-room loop, 10-ticket queue mystery (#001–#010) and four branching endings.'
  - "Built pure-C# WaitingRoom domain state (TicketLedger, QueueTimeline, DayClock, EndingId) with deterministic boundaries and 431 EditMode tests."
  - "Directed URP 3D integration covering first-person interaction raycasts, inspection overlays, PA announcements, trade confirmations and shredder consequences."
  - "Packaged and verified the 14.5 MB Brotli WebGL build for itch.io through end-to-end manual playtesting of every branch."
  - "Disclosed all AI assistance transparently (C# scripts generated and refined via Claude Code, Google Antigravity and OpenAI Codex under my direction and review; 53/81 SFX via ElevenLabs Sound Effects and 28 synthesized via Python; procedural geometry/textures via agent scripts)."
metrics:
  - 431 EditMode NUnit tests (420 under Scripts/**/Tests + 11 in Scripts/)
  - 4 distinct endings across a focused 5-minute mystery run
  - 14.5 MB Brotli-compressed WebGL archive live on itch.io
  - 81 sound cues (53 ElevenLabs SFX + 28 Python-synthesized Foley/room cues)
tools:
  - Unity 6 (6000.6.7f1)
  - C#
  - URP 3D
  - Input System
  - NUnit EditMode
  - WebGL Brotli
  - Python Audio Synth
  - Claude Code / Codex / Antigravity
media:
  - { type: image, src: "/media/please-take-a-number/cover.avif", alt: "Please Take a Number banner showing a single worn leather waiting-room chair under a spotlight", caption: "Waiting room chair under spotlight — matching the live itch.io banner" }
  - { type: image, src: "/media/please-take-a-number/serving-005.avif", alt: "First-person view at the service desk showing ticket 005 on the board and physical papers on the counter", caption: "Counter at #005 — time pressure builds from physical receipts and desk clutter" }
  - { type: image, src: "/media/please-take-a-number/exchange-008.avif", alt: "Conversation and ticket swap prompt with the patron holding number 008", caption: "Patron #008 trade beat — swap your ticket or stay on #007" }
  - { type: image, src: "/media/please-take-a-number/closing-007.avif", alt: "Late-shift counter call resolving ticket 007 and final room atmosphere", caption: "Late-shift resolution leading directly into one of the four endings" }
itchUrl: https://phanto-official.itch.io/please-take-a-number
credits:
  - { asset: 'Old "USSR" Lamp', author: "ESsplashkid", license: "Unity Asset Store EULA" }
  - { asset: "Courier Prime", author: "Quote-Unquote Apps", license: "SIL OFL 1.1" }
  - { asset: "Special Elite", author: "Astigmatic", license: "Apache 2.0" }
  - { asset: "VT323", author: "Peter Hull", license: "SIL OFL 1.1" }
  - { asset: "TextMeshPro / Liberation Sans", author: "Unity / Red Hat", license: "Unity Companion License / SIL OFL 1.1" }
  - { asset: "ElevenLabs Sound Effects (53 of 81 SFX)", author: "ElevenLabs", license: "Generated jam audio (disclosed)" }
order: 4
world:
  kind: archive
  accent: "#7fd6ff"
---

**Please Take a Number** is a compact 3D first-person waiting-room mystery created for the 2026 Unity Game Jam under the theme *"Lucky Number"*. You wake up holding paper ticket `#007` in an eerie administrative lobby as numbers tick upward toward your turn—and snippets whispered across benches, receipts and desk scraps suggest that having `#007` called might not be a blessing at all.

Instead of branching HUD dialog trees, the entire five-minute arc turns on **physical decisions**: stand up, inspect the queue, talk with patron `#008` or patron `#009`, swap numbers before the PA chime, or walk to the office shredder and destroy your ticket outright.

### Branching tension in four outcomes

<figure class="diagram">
<svg viewBox="0 0 640 156" role="img" aria-labelledby="ptn-t ptn-d">
  <title id="ptn-t">Ticket #007 decision paths</title>
  <desc id="ptn-d">Holding ticket #007 leads to four endings: keeping #007 (LuckyOneKeep007), trading with patron #008 (GiftOfLuckTrade008), trading with patron #009 (SomeoneElsesBurdenTrade009), or feeding #007 into the paper shredder (NoTicketShred007).</desc>
  <rect x="8" y="54" width="136" height="48" rx="6" fill="#2f291b" stroke="#7fd6ff" stroke-width="1.5"/>
  <text x="76" y="75" text-anchor="middle" fill="#f3e6d3" font-family="DM Sans,sans-serif" font-size="13" font-weight="600">Hold #007</text>
  <text x="76" y="92" text-anchor="middle" fill="#b9a68f" font-family="DM Mono,monospace" font-size="10">queue ticking up</text>

  <line x1="144" y1="68" x2="210" y2="24" stroke="#5d412b" stroke-width="1.5"/>
  <line x1="144" y1="74" x2="210" y2="58" stroke="#5d412b" stroke-width="1.5"/>
  <line x1="144" y1="82" x2="210" y2="96" stroke="#5d412b" stroke-width="1.5"/>
  <line x1="144" y1="88" x2="210" y2="132" stroke="#5d412b" stroke-width="1.5"/>

  <rect x="210" y="8" width="422" height="28" rx="5" fill="#2f291b" stroke="#5d412b"/>
  <text x="224" y="26" fill="#f3e6d3" font-family="DM Mono,monospace" font-size="11">Keep #007 until called        -&gt; LuckyOneKeep007</text>

  <rect x="210" y="44" width="422" height="28" rx="5" fill="#2f291b" stroke="#5d412b"/>
  <text x="224" y="62" fill="#f6d370" font-family="DM Mono,monospace" font-size="11">Trade #007 with patron #008  -&gt; GiftOfLuckTrade008</text>

  <rect x="210" y="82" width="422" height="28" rx="5" fill="#2f291b" stroke="#5d412b"/>
  <text x="224" y="100" fill="#f27c52" font-family="DM Mono,monospace" font-size="11">Trade #007 with patron #009  -&gt; SomeoneElsesBurdenTrade009</text>

  <rect x="210" y="118" width="422" height="28" rx="5" fill="#2f291b" stroke="#5d412b"/>
  <text x="224" y="136" fill="#9fd3a8" font-family="DM Mono,monospace" font-size="11">Feed #007 into paper shredder -&gt; NoTicketShred007</text>
</svg>
<figcaption>Fig. — Four physical choices from ticket <code>#007</code> resolving directly into the four <code>EndingId</code> outcomes.</figcaption>
</figure>

## Technical breakdown

### Pure-C# queue & ledger decoupled from Unity

Even under game-jam deadlines, separating queue state from Unity transforms and audio sources prevented regression spirals while dialogue beats and timing changed daily. `TicketLedger` manages ticket ownership, patron trades, shredding and final outcome resolution in pure C#:

```csharp
// Assets/_Game/Scripts/WaitingRoom/TicketLedger.cs
public bool TryTradeWithNpc(int npcNumber)
{
    if (!IsTicketHeldByPlayer || PlayerTicketShredded || !TryGetNpcRecord(npcNumber, out var record))
        return false;

    if (!record.PresentInRoom || !record.WillingToTrade || record.CurrentTicketNumber == PlayerTicketNumber)
        return false;

    var previousPlayerTicket = PlayerTicketNumber;
    PlayerTicketNumber = record.CurrentTicketNumber;
    record.CurrentTicketNumber = previousPlayerTicket;
    record.HasTradedWithPlayer = true;
    HasTradedTicket = true;
    TradedWithNpcNumber = npcNumber;
    LedgerChanged?.Invoke();
    return true;
}

public EndingId ResolveEnding()
{
    if (PlayerTicketShredded || !IsTicketHeldByPlayer)
        return EndingId.NoTicketShred007;

    if (HasTradedTicket && TradedWithNpcNumber == 8)
        return EndingId.GiftOfLuckTrade008;

    if (HasTradedTicket && TradedWithNpcNumber == 9)
        return EndingId.SomeoneElsesBurdenTrade009;

    return EndingId.LuckyOneKeep007;
}
```

### Why 431 EditMode tests on a jam project

Paired with `QueueTimeline` and `DayClock`, keeping state transitions headless meant every ticket permutation, shredder edge case, announcement cadence and localization/clue invariant ran in sub-second NUnit EditMode sweeps (`420` tests in `Scripts/**/Tests` plus `11` under `Scripts/`). That safety net made late jam polish—audio cooldown tuning, lighting passes and WebGL size cuts down to `14.5 MB` Brotli—safe to ship on schedule.

### Transparent AI & audio workflow

Following the jam rules and my own portfolio standard, AI assistance is logged explicitly: C# code, shaders/procedural meshes and editorial copy were generated and refactored with AI coding agents (**Claude Code** using Claude Opus and Claude Fable, **Google Antigravity**, and **OpenAI Codex**) under my architecture, code review and playtesting. Of the `81` sound cues, `53` were generated with **ElevenLabs Sound Effects** and `28` UI/Foley/ambient sounds were synthesized procedurally with Python scripts.
