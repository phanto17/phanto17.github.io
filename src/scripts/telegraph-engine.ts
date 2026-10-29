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

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * One telegraphed step. A plain cue asks for the tile that lit up (`shown === target`); a shove cue
 * shows a tile and an arrow, and the answer is the tile one step that way: the one-tile shove from
 * Push Comes to Shove.
 */
export interface Cue {
  shown: number;
  shove: Direction | null;
  target: number;
}

export interface WaveResult {
  /** Time from the board opening for input to the last correct tile, hint replays included. */
  waveMs: number;
  waveScore: number;
  score: number;
}

export type StepOutcome =
  | { kind: 'ignored' }
  | { kind: 'step-ok'; step: number; total: number; streak: number }
  | ({ kind: 'wave-cleared'; completedWave: number; nextWave: number; nextLength: number; streak: number } & WaveResult)
  | ({ kind: 'campaign-cleared'; totalWaves: number; streak: number } & WaveResult)
  | {
      kind: 'disrupted';
      failedAtStep: number;
      expectedCell: number;
      actualCell: number;
      /** Orthogonal steps between the tile pressed and the right one: positional feedback for a miss. */
      distance: number;
      expectedShove: Direction | null;
      streak: number;
    };

const SIDE = 4;
const STEP: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};
const DIRECTIONS = Object.keys(STEP) as Direction[];

export class TelegraphEngine {
  public static readonly GRID_SIZE = SIDE * SIDE;
  public static readonly MAX_WAVES = 5;
  public static readonly BASE_LENGTH = 2; // Wave 1 = 3 tiles, Wave 5 = 7 tiles.
  public static readonly POINTS_PER_CUE = 100;
  public static readonly POINTS_PER_SHOVE = 50;
  /** Recall pace at which the pace bonus reaches zero, per cue. */
  public static readonly PAR_MS_PER_CUE = 1500;
  public static readonly MAX_PACE_BONUS_PER_CUE = 50;

  private wave = 1;
  private streak = 0;
  private score = 0;
  private hintsRemaining = 1;
  private hintUsedThisWave = false;
  private sequence: Cue[] = [];
  private playerIndex = 0;
  private acceptingInput = false;
  private inputOpenedAt: number | null = null;
  private rng: () => number;
  private now: () => number;

  constructor(rng: () => number = Math.random, now: () => number = () => performance.now()) {
    this.rng = rng;
    this.now = now;
  }

  public getWave(): number {
    return this.wave;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getScore(): number {
    return this.score;
  }

  public getHintsRemaining(): number {
    return this.hintsRemaining;
  }

  public getSequence(): readonly Cue[] {
    return this.sequence;
  }

  public getPlayerIndex(): number {
    return this.playerIndex;
  }

  public isAcceptingInput(): boolean {
    return this.acceptingInput;
  }

  /** Opening the board starts the wave clock; it keeps running through a hint replay. */
  public setAcceptingInput(accepting: boolean): void {
    this.acceptingInput = accepting;
    if (accepting && this.inputOpenedAt === null) this.inputOpenedAt = this.now();
  }

  public static sequenceLengthForWave(wave: number): number {
    return Math.min(TelegraphEngine.BASE_LENGTH + Math.max(1, wave), 7);
  }

  /** Waves 1–3 are plain; wave 4 has one shove cue, wave 5 two. */
  public static shovesForWave(wave: number): number {
    return Math.max(0, Math.min(2, wave - 3));
  }

  public static cellToCoord(cellIndex: number): { row: number; col: number } {
    return {
      row: Math.floor(cellIndex / SIDE) + 1,
      col: (cellIndex % SIDE) + 1,
    };
  }

  /** The tile one step from `cell` in `dir`, or null off the board. */
  public static shoveTarget(cell: number, dir: Direction): number | null {
    const row = Math.floor(cell / SIDE) + STEP[dir].row;
    const col = (cell % SIDE) + STEP[dir].col;
    return row < 0 || row >= SIDE || col < 0 || col >= SIDE ? null : row * SIDE + col;
  }

  public static distance(a: number, b: number): number {
    return Math.abs(Math.floor(a / SIDE) - Math.floor(b / SIDE)) + Math.abs((a % SIDE) - (b % SIDE));
  }

  /**
   * Points for a cleared wave: 100 per cue and 50 more per shove cue, plus a pace bonus of up to 50
   * per cue that shrinks linearly to zero at 1.5 s per cue. A wave where the hint was spent earns no
   * pace bonus. Only the recall is timed, never the cues, so manual cue playback costs nothing.
   */
  public static scoreWave(cues: number, shoves: number, elapsedMs: number, hintUsed: boolean): number {
    const base = cues * TelegraphEngine.POINTS_PER_CUE + shoves * TelegraphEngine.POINTS_PER_SHOVE;
    if (hintUsed) return base;
    const par = cues * TelegraphEngine.PAR_MS_PER_CUE;
    const pace = Math.min(1, Math.max(0, 1 - elapsedMs / par));
    return base + Math.round(cues * TelegraphEngine.MAX_PACE_BONUS_PER_CUE * pace);
  }

  public startCampaign(): readonly Cue[] {
    this.wave = 1;
    this.streak = 0;
    this.score = 0;
    this.hintsRemaining = 1;
    return this.rollWaveSequence();
  }

  public rollWaveSequence(): readonly Cue[] {
    this.playerIndex = 0;
    this.acceptingInput = false;
    this.inputOpenedAt = null;
    this.hintUsedThisWave = false;
    const len = TelegraphEngine.sequenceLengthForWave(this.wave);
    const pool = Array.from({ length: TelegraphEngine.GRID_SIZE }, (_, i) => i);
    const cues: Cue[] = [];
    while (cues.length < len && pool.length > 0) {
      const shown = pool.splice(Math.floor(this.rng() * pool.length), 1)[0];
      cues.push({ shown, shove: null, target: shown });
    }
    this.addShoves(cues, TelegraphEngine.shovesForWave(this.wave));
    this.sequence = cues;
    return this.sequence;
  }

  /** Turn `count` cues into shoves whose landing tiles stay on the board and clash with no other answer. */
  private addShoves(cues: Cue[], count: number): void {
    const candidates = cues.map((_, i) => i);
    let added = 0;
    while (added < count && candidates.length > 0) {
      const i = candidates.splice(Math.floor(this.rng() * candidates.length), 1)[0];
      const taken = new Set(cues.filter((_, j) => j !== i).map((c) => c.target));
      const options = DIRECTIONS.filter((dir) => {
        const target = TelegraphEngine.shoveTarget(cues[i].shown, dir);
        return target !== null && !taken.has(target);
      });
      if (options.length === 0) continue;
      const dir = options[Math.floor(this.rng() * options.length)];
      cues[i] = { shown: cues[i].shown, shove: dir, target: TelegraphEngine.shoveTarget(cues[i].shown, dir)! };
      added += 1;
    }
  }

  public useForecastHint(): boolean {
    if (!this.acceptingInput || this.hintsRemaining <= 0 || this.sequence.length === 0) {
      return false;
    }
    this.hintsRemaining -= 1;
    this.hintUsedThisWave = true;
    this.playerIndex = 0;
    this.acceptingInput = false;
    return true;
  }

  public submitCell(cellIndex: number): StepOutcome {
    if (!this.acceptingInput || this.sequence.length === 0) {
      return { kind: 'ignored' };
    }

    const expected = this.sequence[this.playerIndex];
    if (cellIndex !== expected.target) {
      this.acceptingInput = false;
      return {
        kind: 'disrupted',
        failedAtStep: this.playerIndex + 1,
        expectedCell: expected.target,
        actualCell: cellIndex,
        distance: TelegraphEngine.distance(cellIndex, expected.target),
        expectedShove: expected.shove,
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
    const finishedAt = this.now();
    const waveMs = Math.max(0, finishedAt - (this.inputOpenedAt ?? finishedAt));
    const shoves = this.sequence.filter((cue) => cue.shove !== null).length;
    const waveScore = TelegraphEngine.scoreWave(this.sequence.length, shoves, waveMs, this.hintUsedThisWave);
    this.score += waveScore;
    const result: WaveResult = { waveMs, waveScore, score: this.score };

    if (this.wave >= TelegraphEngine.MAX_WAVES) {
      return {
        kind: 'campaign-cleared',
        totalWaves: TelegraphEngine.MAX_WAVES,
        streak: this.streak,
        ...result,
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
      ...result,
    };
  }
}
