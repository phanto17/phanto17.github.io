/**
 * The Telegraph Recall board controller: the engine's sequences played out as cues, the visitor's
 * recall, manual-cue mode, the pause while the tab is hidden, the next-wave timer and the reward on
 * a cleared campaign. It talks to a `BoardView` (the DOM adapter in telegraph-ui.ts, a recording fake
 * in tests) and takes an injected `wait`, `now` and storage, so every sequence here runs under
 * Vitest's fake timers. All copy comes from telegraph-copy.ts.
 */
import { TelegraphEngine, type Cue } from './telegraph-engine';
import { readReward, recordClear, saveReward, type SignalReward, type StorageLike } from './signal-reward';
import type { SoundCue } from './sound';
import * as copy from './telegraph-copy';

export const STEP_MS = 500;
export const REDUCED_STEP_MS = 640;
export const GAP_MS = 110;
export const NEXT_WAVE_MS = 900;

export interface BoardHud {
  wave: number;
  streak: number;
  score: number;
  hintsLeft: number;
  hintEnabled: boolean;
}

/** What the controller needs from the board on screen. */
export interface BoardView {
  /** Light a telegraphed tile (with its shove arrow when `cue.shove`) and show its badge. */
  showCue(index: number, cue: Cue, badge: string): void;
  hideCue(index: number): void;
  clearBoard(): void;
  markHit(index: number, badge: string): void;
  markMiss(index: number): void;
  /** The tile a miss should have been, lit with the step it was. */
  markExpected(index: number, badge: string): void;
  /** A brief "not now" on a tile pressed while the board is closed. */
  flashUnavailable(index: number): void;
  setStatus(text: string): void;
  setHud(hud: BoardHud): void;
  setNextCue(visible: boolean, label?: string): void;
  setManual(on: boolean, enabled: boolean): void;
  setStartLabel(label: string): void;
  nextCueHasFocus(): boolean;
  focusFirstCell(): void;
  play(cue: SoundCue, step?: number): void;
}

export interface BoardDeps {
  view: BoardView;
  engine?: TelegraphEngine;
  wait?: (ms: number) => Promise<void>;
  now?: () => Date;
  storage: StorageLike | null;
  isReducedMotion: () => boolean;
  isHidden: () => boolean;
  /** Whether the Signal was already unlocked before this clear (for the status line). */
  signalUnlocked: () => boolean;
  /** A cleared campaign's reward has been saved. */
  onReward: (reward: SignalReward, score: number) => void;
}

export interface BoardController {
  start(): void;
  hint(): void;
  /** The visitor pressed a tile. */
  cell(index: number): void;
  /** The manual-cue key. */
  nextCue(): void;
  toggleManual(): void;
  /** The tab was hidden or shown. */
  visibility(hidden: boolean): void;
  isManual(): boolean;
  dispose(): void;
}

/** Keyboard navigation on the 4×4 board: the tile an arrow or WASD key moves focus to, wrapping. */
export function cellForKey(index: number, key: string): number | null {
  const row = Math.floor(index / 4);
  const col = index % 4;
  switch (key) {
    case 'ArrowRight':
    case 'd':
    case 'D':
      return row * 4 + ((col + 1) % 4);
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return row * 4 + ((col + 3) % 4);
    case 'ArrowDown':
    case 's':
    case 'S':
      return ((row + 1) % 4) * 4 + col;
    case 'ArrowUp':
    case 'w':
    case 'W':
      return ((row + 3) % 4) * 4 + col;
    default:
      return null;
  }
}

export function createBoard(deps: BoardDeps): BoardController {
  const { view } = deps;
  const engine = deps.engine ?? new TelegraphEngine();
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? (() => new Date());

  let manual = false;
  /** Resolves the manual-cue wait; set while a sequence waits for the key. */
  let pendingCue: (() => void) | null = null;
  /** Bumped by every new playback, restart and dispose: a running playback stops when it no longer matches. */
  let token = 0;
  let playing: readonly Cue[] | null = null;
  let replayOnReturn: readonly Cue[] | null = null;
  let awaitingWave = false;
  /** The status line's base text (the "blocked" instruction is appended to it, never stored). */
  let lastStatus = '';
  // The best score lives in the reward record (src/scripts/signal-reward.ts).
  let best = readReward(deps.storage)?.best ?? 0;

  const status = (text: string) => {
    lastStatus = text;
    view.setStatus(text);
  };
  const hud = () =>
    view.setHud({
      wave: engine.getWave(),
      streak: engine.getStreak(),
      score: engine.getScore(),
      hintsLeft: engine.getHintsRemaining(),
      hintEnabled: engine.isAcceptingInput() && engine.getHintsRemaining() > 0,
    });
  const waitForCue = () =>
    new Promise<void>((resolve) => {
      pendingCue = resolve;
    });
  const isWaiting = () => playing !== null || replayOnReturn !== null || awaitingWave;

  async function play(seq: readonly Cue[]): Promise<void> {
    const mine = ++token;
    replayOnReturn = null;
    awaitingWave = false;
    pendingCue?.();
    pendingCue = null;
    engine.setAcceptingInput(false);
    view.clearBoard();
    hud();
    view.setManual(manual, false);
    if (deps.isHidden() && !manual) {
      replayOnReturn = seq;
      status(copy.PAUSED);
      return;
    }
    playing = seq;

    if (manual) {
      view.setNextCue(true, copy.FIRST_CUE_LABEL);
      status(copy.MANUAL_READY);
      await waitForCue();
      if (mine !== token) return;
    }

    const stepMs = deps.isReducedMotion() ? REDUCED_STEP_MS : STEP_MS;
    for (let i = 0; i < seq.length; i++) {
      if (mine !== token) return;
      if (manual) view.clearBoard();
      const cue = seq[i];
      view.showCue(cue.shown, cue, copy.cueBadge(i + 1, cue));
      view.play('cue', i);
      if (cue.shove) view.play('shove');
      status(copy.cueShown(engine.getWave(), i + 1, seq.length, cue));

      if (manual) {
        view.setNextCue(true, copy.nextCueLabel(i, seq.length));
        await waitForCue();
      } else {
        await wait(stepMs);
      }
      if (mine !== token) return;

      if (!deps.isReducedMotion()) view.hideCue(cue.shown);
      if (!manual) await wait(GAP_MS);
    }

    if (mine !== token) return;
    playing = null;
    view.clearBoard();
    const focusWasOnCue = view.nextCueHasFocus();
    view.setNextCue(false);
    view.setManual(manual, true);
    engine.setAcceptingInput(true);
    hud();
    status(copy.yourTurn(seq));
    if (focusWasOnCue) view.focusFirstCell();
  }

  async function scheduleWave(seq: readonly Cue[]): Promise<void> {
    awaitingWave = true;
    const mine = token;
    await wait(NEXT_WAVE_MS);
    if (mine !== token || !awaitingWave) return;
    awaitingWave = false;
    void play(seq);
  }

  function cell(index: number): void {
    const outcome = engine.submitCell(index);
    switch (outcome.kind) {
      case 'ignored':
        view.flashUnavailable(index);
        view.setStatus(copy.blocked(lastStatus, isWaiting()));
        view.play('blocked');
        return;
      case 'step-ok':
        view.markHit(index, String(outcome.step));
        view.play('step', outcome.step);
        hud();
        status(copy.stepLocked(outcome.step, outcome.total));
        return;
      case 'wave-cleared': {
        view.markHit(index, String(engine.getSequence().length));
        view.play('wave');
        hud();
        status(copy.waveCleared(outcome));
        void scheduleWave(engine.rollWaveSequence());
        return;
      }
      case 'campaign-cleared': {
        view.markHit(index, String(engine.getSequence().length));
        view.play('clear');
        hud();
        const newBest = outcome.score > best;
        if (newBest) best = outcome.score;
        // The reward (hero stamp + Signal theme, src/scripts/signal-reward.ts), recorded per browser.
        const firstUnlock = !deps.signalUnlocked();
        const reward = recordClear(readReward(deps.storage), outcome.score, now());
        saveReward(deps.storage, reward);
        deps.onReward(reward, outcome.score);
        status(copy.campaignCleared(outcome, best, newBest, firstUnlock));
        view.setStartLabel(copy.START.again);
        return;
      }
      case 'disrupted':
        view.markMiss(index);
        view.markExpected(outcome.expectedCell, String(outcome.failedAtStep));
        view.play('miss');
        hud();
        status(copy.disrupted(outcome));
        view.setStartLabel(copy.START.retry);
        return;
    }
  }

  return {
    start() {
      view.setStartLabel(copy.START.restart);
      void play(engine.startCampaign());
    },
    hint() {
      if (engine.useForecastHint()) void play(engine.getSequence());
    },
    cell,
    nextCue() {
      const resume = pendingCue;
      pendingCue = null;
      resume?.();
    },
    toggleManual() {
      manual = !manual;
      view.setManual(manual, true);
      status(copy.manualToggled(manual));
    },
    visibility(hidden) {
      if (hidden) {
        if (playing && !manual) {
          replayOnReturn = playing;
          playing = null;
          token++;
          view.clearBoard();
          status(copy.PAUSED);
        }
      } else {
        const replay = replayOnReturn;
        replayOnReturn = null;
        if (replay) void play(replay);
      }
    },
    isManual: () => manual,
    dispose() {
      token++;
      pendingCue = null;
      playing = null;
      replayOnReturn = null;
      awaitingWave = false;
    },
  };
}
