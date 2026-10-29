/**
 * Pure TypeScript model for the "Telegraph Recall" tactical working-memory mini-game
 * and its 3-stage CRT popup & non-linear exploratory portal experience.
 * Mirrors the plain-C# testable model pattern used in Push Comes to Shove, Horde Hours, and Cinderhold.
 */

export type StageId = 'welcome' | 'animation-sequence' | 'title-intro';

export type TransitionStyle = 'crt-flicker' | 'scanline-wipe' | 'phosphor-warp' | 'instant';

export interface StageConfig {
  id: StageId;
  label: string;
  code: string;
  title: string;
  subtitle: string;
  transition: TransitionStyle;
  ctaLabel: string;
  action: 'next' | 'play';
}

export type InteractionKind =
  | 'click-ripple'
  | 'stage-transition'
  | 'portal-explore'
  | 'cell-input'
  | 'popup-toggle';

export interface InteractionEvent {
  id: string;
  kind: InteractionKind;
  stage: StageId;
  targetId: string;
  x?: number;
  y?: number;
  timestamp: number;
  meta?: Record<string, string | number | boolean>;
}

export type PortalNodeId = 'psychology' | 'tactics-shove' | 'dungeon-cinderhold' | 'simulation';

export interface PortalNode {
  id: PortalNodeId;
  code: string;
  title: string;
  tag: string;
  summary: string;
  detail: string;
  projectHref?: string;
  projectLabel?: string;
}

export const TELEGRAPH_STAGES: readonly StageConfig[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    code: 'STG_01 // SYS_HANDSHAKE',
    title: 'Welcome to Telegraph Recall',
    subtitle: 'Watch a signal and repeat it on the board.',
    transition: 'crt-flicker',
    ctaLabel: 'Watch the signal →',
    action: 'next',
  },
  {
    id: 'animation-sequence',
    label: 'Sequence',
    code: 'STG_02 // SIGNAL_SWEEP',
    title: 'Watch the signal',
    subtitle: 'The board lights up one position at a time. Remember the order.',
    transition: 'scanline-wipe',
    ctaLabel: 'Continue →',
    action: 'next',
  },
  {
    id: 'title-intro',
    label: 'Recall',
    code: 'STG_03 // TELEGRAPH_RECALL',
    title: 'Telegraph Recall',
    subtitle: 'Read the signal. Recall the sequence.',
    transition: 'phosphor-warp',
    ctaLabel: 'Start the game ↓',
    action: 'play',
  },
] as const;

export const TELEGRAPH_PORTAL_NODES: readonly PortalNode[] = [
  {
    id: 'psychology',
    code: 'NODE_A // MEMORY',
    title: 'Remembering the signal',
    tag: 'Game Psychology · phanto',
    summary: 'A short sequence turns observing and remembering into the challenge.',
    detail:
      'The sequence starts at three tiles and grows to seven. Telegraph Recall is a small experiment in how a game can make observation part of a decision, not a test of memory capacity.',
    projectHref: 'https://www.youtube.com/@phanto.official',
    projectLabel: 'Watch on phanto YouTube ↗',
  },
  {
    id: 'tactics-shove',
    code: 'NODE_B // DETERMINISTIC_GRID',
    title: 'Planning the next move',
    tag: 'Unity 6 · Push Comes to Shove',
    summary: 'Pushes, hazards and visible enemy intent shape the tactics board.',
    detail:
      'In Push Comes to Shove, each enemy reveals its route and target cells just before acting. Melee shoves and hazards give the player opportunities to plan around the board.',
    projectHref: '/projects/push-comes-to-shove/',
    projectLabel: 'Inspect Push Comes to Shove →',
  },
  {
    id: 'dungeon-cinderhold',
    code: 'NODE_C // FLOOR_TELEGRAPHS',
    title: 'Reading an attack',
    tag: 'Unity 6 · Cinderhold',
    summary: 'Enemy windups make space for a player to react in Cinderhold.',
    detail:
      'In Cinderhold, Slime, Bat, Rat, and boss Cinderclaw run pure-C# state machines behind IEnemyContext. Every swing renders an explicit AttackTelegraph window paired with hit-stop and knockback so players react to geometry, not guesswork.',
    projectHref: '/projects/cinderhold/',
    projectLabel: 'Inspect Cinderhold →',
  },
  {
    id: 'simulation',
    code: 'NODE_D // LIVE_MATRIX',
    title: 'Try the board',
    tag: 'Pure TS · Web Audio Synth',
    summary: 'Step into the live 5-wave telegraph board with keyboard/mouse grid navigation and Forecast Hint.',
    detail:
      'Watch the amber sequence, repeat the positions in order, and use the Forecast Hint if you need another look.',
  },
] as const;

export class TelegraphStageController {
  private currentStage: StageId = 'welcome';
  private popupOpen = false;
  private visitedStages: Set<StageId> = new Set(['welcome']);
  private exploredPortals: Set<PortalNodeId> = new Set(['psychology']);
  private activePortal: PortalNodeId = 'psychology';
  private interactionCount = 0;
  private history: InteractionEvent[] = [];

  public getStage(): StageId {
    return this.currentStage;
  }

  public getStageConfig(): StageConfig {
    return TELEGRAPH_STAGES.find((s) => s.id === this.currentStage) ?? TELEGRAPH_STAGES[0];
  }

  public isPopupOpen(): boolean {
    return this.popupOpen;
  }

  public setPopupOpen(open: boolean): InteractionEvent {
    this.popupOpen = open;
    return this.recordInteraction('popup-toggle', open ? 'popup-open' : 'popup-close', undefined, { open });
  }

  public transitionTo(stage: StageId): { from: StageId; to: StageConfig; event: InteractionEvent } {
    const from = this.currentStage;
    this.currentStage = stage;
    this.visitedStages.add(stage);
    const to = this.getStageConfig();
    const event = this.recordInteraction('stage-transition', stage, undefined, {
      from,
      to: stage,
      transition: to.transition,
    });
    return { from, to, event };
  }

  public nextStage(): { from: StageId; to: StageConfig; event: InteractionEvent } {
    const idx = TELEGRAPH_STAGES.findIndex((stage) => stage.id === this.currentStage);
    const next = TELEGRAPH_STAGES[(idx + 1) % TELEGRAPH_STAGES.length].id;
    return this.transitionTo(next);
  }

  public selectPortal(portalId: PortalNodeId): { node: PortalNode; event: InteractionEvent } {
    this.activePortal = portalId;
    this.exploredPortals.add(portalId);
    const node = TELEGRAPH_PORTAL_NODES.find((p) => p.id === portalId) ?? TELEGRAPH_PORTAL_NODES[0];
    const event = this.recordInteraction('portal-explore', portalId, undefined, {
      exploredCount: this.exploredPortals.size,
    });
    return { node, event };
  }

  public getActivePortal(): PortalNode {
    return TELEGRAPH_PORTAL_NODES.find((p) => p.id === this.activePortal) ?? TELEGRAPH_PORTAL_NODES[0];
  }

  public getExploredPortals(): readonly PortalNodeId[] {
    return Array.from(this.exploredPortals);
  }

  public getVisitedStages(): readonly StageId[] {
    return Array.from(this.visitedStages);
  }

  public getInteractionCount(): number {
    return this.interactionCount;
  }

  public getRecentInteractions(limit = 5): readonly InteractionEvent[] {
    return this.history.slice(-limit);
  }

  public recordInteraction(
    kind: InteractionKind,
    targetId: string,
    coords?: { x: number; y: number },
    meta?: Record<string, string | number | boolean>,
  ): InteractionEvent {
    this.interactionCount += 1;
    const ev: InteractionEvent = {
      id: `evt-${this.interactionCount}`,
      kind,
      stage: this.currentStage,
      targetId,
      x: coords?.x,
      y: coords?.y,
      timestamp: Date.now(),
      meta,
    };
    this.history.push(ev);
    if (this.history.length > 32) {
      this.history.shift();
    }
    return ev;
  }
}

export type StepOutcome =
  | { kind: 'ignored' }
  | { kind: 'step-ok'; step: number; total: number; streak: number }
  | { kind: 'wave-cleared'; completedWave: number; nextWave: number; nextLength: number; streak: number }
  | { kind: 'campaign-cleared'; totalWaves: number; streak: number }
  | { kind: 'disrupted'; failedAtStep: number; expectedCell: number; actualCell: number; streak: number };

export class TelegraphEngine {
  public static readonly GRID_SIZE = 16;
  public static readonly MAX_WAVES = 5;
  public static readonly BASE_LENGTH = 2; // Wave 1 = 3 tiles, Wave 5 = 7 tiles.

  private wave = 1;
  private streak = 0;
  private hintsRemaining = 1;
  private sequence: number[] = [];
  private playerIndex = 0;
  private acceptingInput = false;
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  public getWave(): number {
    return this.wave;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getHintsRemaining(): number {
    return this.hintsRemaining;
  }

  public getSequence(): readonly number[] {
    return this.sequence;
  }

  public getPlayerIndex(): number {
    return this.playerIndex;
  }

  public isAcceptingInput(): boolean {
    return this.acceptingInput;
  }

  public setAcceptingInput(accepting: boolean): void {
    this.acceptingInput = accepting;
  }

  public static sequenceLengthForWave(wave: number): number {
    return Math.min(TelegraphEngine.BASE_LENGTH + Math.max(1, wave), 7);
  }

  public static cellToCoord(cellIndex: number): { row: number; col: number } {
    return {
      row: Math.floor(cellIndex / 4) + 1,
      col: (cellIndex % 4) + 1,
    };
  }

  public startCampaign(): readonly number[] {
    this.wave = 1;
    this.streak = 0;
    this.hintsRemaining = 1;
    return this.rollWaveSequence();
  }

  public rollWaveSequence(): readonly number[] {
    this.playerIndex = 0;
    this.acceptingInput = false;
    const len = TelegraphEngine.sequenceLengthForWave(this.wave);
    const pool = Array.from({ length: TelegraphEngine.GRID_SIZE }, (_, i) => i);
    const nextSeq: number[] = [];
    while (nextSeq.length < len && pool.length > 0) {
      const pick = Math.floor(this.rng() * pool.length);
      nextSeq.push(pool.splice(pick, 1)[0]);
    }
    this.sequence = nextSeq;
    return this.sequence;
  }

  public useForecastHint(): boolean {
    if (!this.acceptingInput || this.hintsRemaining <= 0 || this.sequence.length === 0) {
      return false;
    }
    this.hintsRemaining -= 1;
    this.playerIndex = 0;
    this.acceptingInput = false;
    return true;
  }

  public submitCell(cellIndex: number): StepOutcome {
    if (!this.acceptingInput || this.sequence.length === 0) {
      return { kind: 'ignored' };
    }

    const expected = this.sequence[this.playerIndex];
    if (cellIndex !== expected) {
      this.acceptingInput = false;
      return {
        kind: 'disrupted',
        failedAtStep: this.playerIndex + 1,
        expectedCell: expected,
        actualCell: cellIndex,
        streak: this.streak,
      };
    }

    this.playerIndex += 1;
    this.streak += 1;

    if (this.playerIndex < this.sequence.length) {
      return {
        kind: 'step-ok',
        step: this.playerIndex,
        total: this.sequence.length,
        streak: this.streak,
      };
    }

    // Wave finished
    this.acceptingInput = false;
    if (this.wave >= TelegraphEngine.MAX_WAVES) {
      return {
        kind: 'campaign-cleared',
        totalWaves: TelegraphEngine.MAX_WAVES,
        streak: this.streak,
      };
    }

    const completedWave = this.wave;
    this.wave += 1;
    return {
      kind: 'wave-cleared',
      completedWave,
      nextWave: this.wave,
      nextLength: TelegraphEngine.sequenceLengthForWave(this.wave),
      streak: this.streak,
    };
  }
}
