import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegraphEngine, type Cue } from '../src/scripts/telegraph-engine';
import { GAP_MS, NEXT_WAVE_MS, STEP_MS, cellForKey, createBoard, type BoardHud, type BoardView } from '../src/scripts/telegraph-board';
import { REWARD_KEY, type SignalReward } from '../src/scripts/signal-reward';
import * as copy from '../src/scripts/telegraph-copy';

/** Small seeded generator (mulberry32) so every roll is reproducible. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (k: string) => (k in data ? data[k] : null), setItem: (k: string, v: string) => void (data[k] = v) };
}

/** A board that records everything the controller tells it. */
function recordingView() {
  const log: string[] = [];
  const lit = new Set<number>();
  let status = '';
  let hud: BoardHud | null = null;
  let startLabel = '';
  let nextCue: { visible: boolean; label?: string } = { visible: false };
  let manual: { on: boolean; enabled: boolean } = { on: false, enabled: true };
  const view: BoardView = {
    showCue: (i, cue, badge) => {
      lit.add(i);
      log.push(`show ${i} ${badge}${cue.shove ? ' ' + cue.shove : ''}`);
    },
    hideCue: (i) => {
      lit.delete(i);
      log.push(`hide ${i}`);
    },
    clearBoard: () => {
      lit.clear();
      log.push('clear');
    },
    markHit: (i, badge) => log.push(`hit ${i} ${badge}`),
    markMiss: (i) => log.push(`miss ${i}`),
    markExpected: (i, badge) => log.push(`expected ${i} ${badge}`),
    flashUnavailable: (i) => log.push(`unavailable ${i}`),
    setStatus: (t) => void (status = t),
    setHud: (h) => void (hud = h),
    setNextCue: (visible, label) => void (nextCue = { visible, label }),
    setManual: (on, enabled) => void (manual = { on, enabled }),
    setStartLabel: (l) => void (startLabel = l),
    nextCueHasFocus: () => false,
    focusFirstCell: () => log.push('focus 0'),
    play: (cue, step) => log.push(`play ${cue}${step === undefined ? '' : ' ' + step}`),
  };
  return {
    view,
    log,
    lit,
    get status() {
      return status;
    },
    get hud() {
      return hud!;
    },
    get startLabel() {
      return startLabel;
    },
    get nextCue() {
      return nextCue;
    },
    get manual() {
      return manual;
    },
  };
}

function build(opts: { hidden?: boolean; reduced?: boolean; storage?: ReturnType<typeof memoryStorage>; unlocked?: boolean } = {}) {
  const engine = new TelegraphEngine(seeded(7), () => Date.now());
  const rec = recordingView();
  const storage = opts.storage ?? memoryStorage();
  const rewards: { reward: SignalReward; score: number }[] = [];
  let hidden = opts.hidden ?? false;
  const board = createBoard({
    view: rec.view,
    engine,
    storage,
    now: () => new Date('2026-11-02T12:00:00Z'),
    isReducedMotion: () => opts.reduced ?? false,
    isHidden: () => hidden,
    signalUnlocked: () => opts.unlocked ?? false,
    onReward: (reward, score) => void rewards.push({ reward, score }),
  });
  return { engine, rec, board, storage, rewards, setHidden: (h: boolean) => void (hidden = h) };
}

/** Let an automatic playback of `n` cues finish. */
const playOut = (n: number) => vi.advanceTimersByTimeAsync(n * (STEP_MS + GAP_MS) + 5);
const shows = (log: string[]) => log.filter((l) => l.startsWith('show '));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('automatic playback', () => {
  it('lights every cue in order, then opens the board', async () => {
    const { engine, rec, board } = build();
    board.start();
    expect(rec.startLabel).toBe(copy.START.restart);
    const seq = engine.getSequence();
    expect(seq).toHaveLength(3);
    expect(engine.isAcceptingInput()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(shows(rec.log)).toEqual([`show ${seq[0].shown} 1`]);
    expect(rec.status).toBe(copy.cueShown(1, 1, 3, seq[0]));
    await vi.advanceTimersByTimeAsync(STEP_MS);
    expect(rec.log).toContain(`hide ${seq[0].shown}`);
    await playOut(3);
    expect(shows(rec.log)).toEqual(seq.map((c, i) => `show ${c.shown} ${i + 1}`));
    expect(engine.isAcceptingInput()).toBe(true);
    expect(rec.status).toBe(copy.yourTurn(seq));
    expect(rec.lit.size).toBe(0);
    expect(rec.hud.hintEnabled).toBe(true);
    expect(rec.manual.enabled).toBe(true);
  });

  it('keeps the cues lit under reduced motion', async () => {
    const { rec, board } = build({ reduced: true });
    board.start();
    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(640 + 110);
    expect(rec.log.filter((l) => l.startsWith('hide '))).toEqual([]);
  });

  it('a restart during playback cancels the running one', async () => {
    const { engine, rec, board } = build();
    board.start();
    await vi.advanceTimersByTimeAsync(STEP_MS / 2);
    const first = shows(rec.log).length;
    expect(first).toBe(1);
    board.start();
    const seq = engine.getSequence();
    await playOut(3);
    expect(shows(rec.log)).toHaveLength(first + seq.length);
    expect(rec.status).toBe(copy.yourTurn(seq));
  });
});

describe('manual cues', () => {
  it('waits for the key before each cue', async () => {
    const { engine, rec, board } = build();
    board.toggleManual();
    expect(rec.status).toBe(copy.manualToggled(true));
    expect(rec.manual).toEqual({ on: true, enabled: true });
    board.start();
    await vi.advanceTimersByTimeAsync(1);
    const seq = engine.getSequence();
    expect(shows(rec.log)).toEqual([]);
    expect(rec.nextCue).toEqual({ visible: true, label: copy.FIRST_CUE_LABEL });
    expect(rec.status).toBe(copy.MANUAL_READY);
    board.nextCue();
    await vi.advanceTimersByTimeAsync(1);
    expect(shows(rec.log)).toHaveLength(1);
    expect(rec.nextCue.label).toBe('Show next cue');
    board.nextCue();
    await vi.advanceTimersByTimeAsync(1);
    board.nextCue();
    await vi.advanceTimersByTimeAsync(1);
    expect(rec.nextCue.label).toBe('Start recall');
    expect(shows(rec.log)).toHaveLength(3);
    board.nextCue();
    await vi.advanceTimersByTimeAsync(1);
    expect(rec.nextCue.visible).toBe(false);
    expect(engine.isAcceptingInput()).toBe(true);
    expect(rec.status).toBe(copy.yourTurn(seq));
  });
});

describe('a hidden tab', () => {
  it('does not start playback while hidden, and plays when the tab returns', async () => {
    const { rec, board, setHidden } = build({ hidden: true });
    board.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(shows(rec.log)).toEqual([]);
    expect(rec.status).toBe(copy.PAUSED);
    setHidden(false);
    board.visibility(false);
    await playOut(3);
    expect(shows(rec.log)).toHaveLength(3);
  });

  it('pauses a running playback and replays it from the first cue on return', async () => {
    const { engine, rec, board, setHidden } = build();
    board.start();
    await vi.advanceTimersByTimeAsync(STEP_MS + GAP_MS + 1);
    expect(shows(rec.log)).toHaveLength(2);
    setHidden(true);
    board.visibility(true);
    expect(rec.status).toBe(copy.PAUSED);
    expect(rec.lit.size).toBe(0);
    await vi.advanceTimersByTimeAsync(5 * STEP_MS);
    expect(shows(rec.log)).toHaveLength(2); // nothing more while hidden
    setHidden(false);
    board.visibility(false);
    await playOut(3);
    expect(shows(rec.log)).toHaveLength(5);
    expect(rec.status).toBe(copy.yourTurn(engine.getSequence()));
  });
});

describe('recall', () => {
  async function open(board: ReturnType<typeof build>['board'], n = 3) {
    board.start();
    await playOut(n);
  }

  it('flashes and explains a press while the board is closed, without stacking the instruction', async () => {
    const { rec, board } = build();
    board.cell(3);
    expect(rec.log).toContain('unavailable 3');
    expect(rec.status).toBe('Start or restart a turn to play.');
    board.cell(4);
    expect(rec.status).toBe('Start or restart a turn to play.');
    board.start();
    await vi.advanceTimersByTimeAsync(1);
    board.cell(2);
    expect(rec.status.endsWith('Wait for the sequence to finish.')).toBe(true);
    expect(rec.status.match(/Wait for the sequence/g)).toHaveLength(1);
  });

  it('locks in steps, clears the wave and plays the next one after the pause', async () => {
    const { engine, rec, board } = build();
    await open(board);
    const seq = engine.getSequence();
    board.cell(seq[0].target);
    expect(rec.log).toContain(`hit ${seq[0].target} 1`);
    expect(rec.status).toBe(copy.stepLocked(1, 3));
    board.cell(seq[1].target);
    board.cell(seq[2].target);
    expect(rec.status.startsWith('Wave 1 resolved')).toBe(true);
    expect(rec.log).toContain('play wave');
    const before = shows(rec.log).length;
    await vi.advanceTimersByTimeAsync(NEXT_WAVE_MS - 50);
    expect(shows(rec.log)).toHaveLength(before);
    await vi.advanceTimersByTimeAsync(60);
    expect(shows(rec.log)).toHaveLength(before + 1);
    expect(rec.hud.wave).toBe(2);
    expect(engine.getWave()).toBe(2);
  });

  it('a miss shows the expected tile and offers a retry', async () => {
    const { engine, rec, board } = build();
    await open(board);
    const seq = engine.getSequence();
    const wrong = (seq[0].target + 1) % 16 === seq[0].target ? 2 : (seq[0].target + 1) % 16;
    board.cell(wrong);
    expect(rec.log).toContain(`miss ${wrong}`);
    expect(rec.log).toContain(`expected ${seq[0].target} 1`);
    expect(rec.status.startsWith('Telegraph missed at step 1')).toBe(true);
    expect(rec.startLabel).toBe(copy.START.retry);
  });

  it('clears the campaign, saves the reward and announces the first unlock', async () => {
    const { engine, rec, board, storage, rewards } = build();
    await open(board);
    for (let wave = 1; wave <= 5; wave++) {
      const seq: readonly Cue[] = engine.getSequence();
      for (const cue of seq) board.cell(cue.target);
      if (wave < 5) await vi.advanceTimersByTimeAsync(NEXT_WAVE_MS + 10 + (seq.length + 1) * (STEP_MS + GAP_MS) + 10);
    }
    expect(rewards).toHaveLength(1);
    expect(rewards[0].reward.best).toBe(engine.getScore());
    expect(rewards[0].reward.clears).toBe(1);
    expect(JSON.parse(storage.data[REWARD_KEY]).best).toBe(engine.getScore());
    expect(rec.status).toContain('All 5 waves cleared!');
    expect(rec.status).toContain('a new best');
    expect(rec.status).toContain('Signal cleared');
    expect(rec.startLabel).toBe(copy.START.again);
    expect(rec.log).toContain('play clear');
  });
});

describe('cellForKey', () => {
  it('moves across the 4×4 board and wraps at the edges', () => {
    expect(cellForKey(0, 'ArrowRight')).toBe(1);
    expect(cellForKey(3, 'ArrowRight')).toBe(0);
    expect(cellForKey(0, 'ArrowLeft')).toBe(3);
    expect(cellForKey(0, 'ArrowDown')).toBe(4);
    expect(cellForKey(12, 's')).toBe(0);
    expect(cellForKey(0, 'w')).toBe(12);
    expect(cellForKey(5, 'Enter')).toBeNull();
  });
});
