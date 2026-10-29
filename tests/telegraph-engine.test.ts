import { describe, expect, it } from 'vitest';
import {
  TELEGRAPH_PORTAL_NODES,
  TELEGRAPH_STAGES,
  TelegraphEngine,
  TelegraphStageController,
  type Cue,
  type StepOutcome,
} from '../src/scripts/telegraph-engine';
import { parseLabHash } from '../src/scripts/telegraph-ui';

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

/** A clock the test moves by hand. */
function manualClock(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

/** Play the current wave perfectly and return the last outcome. */
function clearWave(engine: TelegraphEngine): StepOutcome {
  engine.setAcceptingInput(true);
  let last: StepOutcome = { kind: 'ignored' };
  for (const cue of engine.getSequence()) last = engine.submitCell(cue.target);
  return last;
}

function rollWave(wave: number, seed: number): readonly Cue[] {
  const engine = new TelegraphEngine(seeded(seed));
  engine.startCampaign();
  for (let w = 1; w < wave; w++) {
    clearWave(engine);
    engine.rollWaveSequence();
  }
  return engine.getSequence();
}

describe('TelegraphEngine: waves and sequences', () => {
  it('grows from three tiles in wave 1 to seven in wave 5', () => {
    expect([1, 2, 3, 4, 5].map(TelegraphEngine.sequenceLengthForWave)).toEqual([3, 4, 5, 6, 7]);
  });

  it('clamps the length below wave 1 and above seven tiles', () => {
    expect(TelegraphEngine.sequenceLengthForWave(0)).toBe(3);
    expect(TelegraphEngine.sequenceLengthForWave(-4)).toBe(3);
    expect(TelegraphEngine.sequenceLengthForWave(9)).toBe(7);
  });

  it('adds shove cues only in waves 4 and 5', () => {
    expect([1, 2, 3, 4, 5].map(TelegraphEngine.shovesForWave)).toEqual([0, 0, 0, 1, 2]);
  });

  it('maps cells to 1-based rows and columns', () => {
    expect(TelegraphEngine.cellToCoord(0)).toEqual({ row: 1, col: 1 });
    expect(TelegraphEngine.cellToCoord(6)).toEqual({ row: 2, col: 3 });
    expect(TelegraphEngine.cellToCoord(15)).toEqual({ row: 4, col: 4 });
  });

  it('rolls the same sequence for the same seed', () => {
    expect(rollWave(5, 42)).toEqual(rollWave(5, 42));
    expect(rollWave(5, 42)).not.toEqual(rollWave(5, 43));
  });

  it('keeps every cue on the board with unique shown tiles and unique answers', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (let wave = 1; wave <= 5; wave++) {
        const cues = rollWave(wave, seed * 7 + wave);
        expect(cues).toHaveLength(TelegraphEngine.sequenceLengthForWave(wave));
        const shown = cues.map((c) => c.shown);
        const targets = cues.map((c) => c.target);
        expect(new Set(shown).size).toBe(cues.length);
        expect(new Set(targets).size).toBe(cues.length);
        for (const cell of [...shown, ...targets]) {
          expect(cell).toBeGreaterThanOrEqual(0);
          expect(cell).toBeLessThan(TelegraphEngine.GRID_SIZE);
        }
      }
    }
  });

  it('places exactly the planned number of shoves, each landing one tile away', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (let wave = 1; wave <= 5; wave++) {
        const cues = rollWave(wave, seed * 13 + wave);
        const shoves = cues.filter((c) => c.shove !== null);
        expect(shoves).toHaveLength(TelegraphEngine.shovesForWave(wave));
        for (const cue of cues) {
          if (cue.shove === null) expect(cue.target).toBe(cue.shown);
          else {
            expect(cue.target).toBe(TelegraphEngine.shoveTarget(cue.shown, cue.shove));
            expect(TelegraphEngine.distance(cue.shown, cue.target)).toBe(1);
          }
        }
      }
    }
  });
});

describe('TelegraphEngine: shoves and distance', () => {
  it('moves one tile in each direction', () => {
    expect(TelegraphEngine.shoveTarget(5, 'up')).toBe(1);
    expect(TelegraphEngine.shoveTarget(5, 'down')).toBe(9);
    expect(TelegraphEngine.shoveTarget(5, 'left')).toBe(4);
    expect(TelegraphEngine.shoveTarget(5, 'right')).toBe(6);
  });

  it('never shoves off the board or wraps to the next row', () => {
    expect(TelegraphEngine.shoveTarget(0, 'up')).toBeNull();
    expect(TelegraphEngine.shoveTarget(0, 'left')).toBeNull();
    expect(TelegraphEngine.shoveTarget(3, 'right')).toBeNull();
    expect(TelegraphEngine.shoveTarget(4, 'left')).toBeNull();
    expect(TelegraphEngine.shoveTarget(15, 'down')).toBeNull();
  });

  it('measures misses in orthogonal steps', () => {
    expect(TelegraphEngine.distance(0, 0)).toBe(0);
    expect(TelegraphEngine.distance(0, 1)).toBe(1);
    expect(TelegraphEngine.distance(0, 5)).toBe(2);
    expect(TelegraphEngine.distance(0, 15)).toBe(6);
    expect(TelegraphEngine.distance(3, 4)).toBe(4);
  });
});

describe('TelegraphEngine: input', () => {
  it('ignores input until the board opens', () => {
    const engine = new TelegraphEngine(seeded(1));
    const [first] = engine.startCampaign();
    expect(engine.submitCell(first.target)).toEqual({ kind: 'ignored' });
    expect(engine.getPlayerIndex()).toBe(0);
  });

  it('ignores input before a campaign starts', () => {
    const engine = new TelegraphEngine(seeded(1));
    engine.setAcceptingInput(true);
    expect(engine.submitCell(0)).toEqual({ kind: 'ignored' });
  });

  it('locks in correct steps and counts the streak', () => {
    const engine = new TelegraphEngine(seeded(2));
    const cues = engine.startCampaign();
    engine.setAcceptingInput(true);
    expect(engine.submitCell(cues[0].target)).toEqual({ kind: 'step-ok', step: 1, total: 3, streak: 1 });
    expect(engine.submitCell(cues[1].target)).toEqual({ kind: 'step-ok', step: 2, total: 3, streak: 2 });
  });

  it('clears a wave and announces the next length', () => {
    const engine = new TelegraphEngine(seeded(3));
    engine.startCampaign();
    const outcome = clearWave(engine);
    expect(outcome).toMatchObject({ kind: 'wave-cleared', completedWave: 1, nextWave: 2, nextLength: 4, streak: 3 });
    expect(engine.getWave()).toBe(2);
    expect(engine.isAcceptingInput()).toBe(false);
  });

  it('clears the campaign after wave 5 with a streak of 25', () => {
    const engine = new TelegraphEngine(seeded(4));
    engine.startCampaign();
    let outcome: StepOutcome = { kind: 'ignored' };
    for (let wave = 1; wave <= 5; wave++) {
      if (wave > 1) engine.rollWaveSequence();
      outcome = clearWave(engine);
    }
    expect(outcome).toMatchObject({ kind: 'campaign-cleared', totalWaves: 5, streak: 25 });
    expect(engine.getWave()).toBe(5);
  });

  it('reports where a miss should have been, how far off it was and whether it was a shove', () => {
    const engine = new TelegraphEngine(seeded(5));
    const cues = engine.startCampaign();
    engine.setAcceptingInput(true);
    engine.submitCell(cues[0].target);
    const wrong = [...Array(16).keys()].find((cell) => !cues.some((c) => c.target === cell))!;
    const outcome = engine.submitCell(wrong);
    expect(outcome).toEqual({
      kind: 'disrupted',
      failedAtStep: 2,
      expectedCell: cues[1].target,
      actualCell: wrong,
      distance: TelegraphEngine.distance(wrong, cues[1].target),
      expectedShove: null,
      streak: 1,
    });
    expect(engine.isAcceptingInput()).toBe(false);
    expect(engine.submitCell(cues[1].target)).toEqual({ kind: 'ignored' });
  });

  it('wants the landing tile for a shove cue, not the tile that lit up', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const engine = new TelegraphEngine(seeded(seed));
      engine.startCampaign();
      for (let wave = 1; wave < 4; wave++) {
        clearWave(engine);
        engine.rollWaveSequence();
      }
      const cues = engine.getSequence();
      const index = cues.findIndex((c) => c.shove !== null);
      engine.setAcceptingInput(true);
      for (let i = 0; i < index; i++) engine.submitCell(cues[i].target);
      const outcome = engine.submitCell(cues[index].shown);
      expect(outcome).toMatchObject({
        kind: 'disrupted',
        failedAtStep: index + 1,
        expectedCell: cues[index].target,
        distance: 1,
        expectedShove: cues[index].shove,
      });
    }
  });

  it('restarts from wave 1 with a fresh score, streak and hint', () => {
    const clock = manualClock();
    const engine = new TelegraphEngine(seeded(6), clock.now);
    engine.startCampaign();
    clearWave(engine);
    engine.rollWaveSequence();
    engine.setAcceptingInput(true);
    engine.useForecastHint();
    engine.startCampaign();
    expect(engine.getWave()).toBe(1);
    expect(engine.getStreak()).toBe(0);
    expect(engine.getScore()).toBe(0);
    expect(engine.getHintsRemaining()).toBe(1);
    expect(engine.getSequence()).toHaveLength(3);
  });
});

describe('TelegraphEngine: Forecast Hint', () => {
  it('works only while the board is open, once per campaign', () => {
    const engine = new TelegraphEngine(seeded(7));
    const cues = engine.startCampaign();
    expect(engine.useForecastHint()).toBe(false);
    engine.setAcceptingInput(true);
    engine.submitCell(cues[0].target);
    expect(engine.useForecastHint()).toBe(true);
    expect(engine.getHintsRemaining()).toBe(0);
    expect(engine.getPlayerIndex()).toBe(0);
    expect(engine.isAcceptingInput()).toBe(false);
    engine.setAcceptingInput(true);
    expect(engine.useForecastHint()).toBe(false);
  });

  it('replays the same sequence', () => {
    const engine = new TelegraphEngine(seeded(8));
    const before = [...engine.startCampaign()];
    engine.setAcceptingInput(true);
    engine.useForecastHint();
    expect(engine.getSequence()).toEqual(before);
  });
});

describe('TelegraphEngine: scoring', () => {
  it('pays 100 per cue, 50 more per shove, and up to 50 per cue for pace', () => {
    expect(TelegraphEngine.scoreWave(3, 0, 0, false)).toBe(450);
    expect(TelegraphEngine.scoreWave(3, 0, 4500, false)).toBe(300);
    expect(TelegraphEngine.scoreWave(3, 0, 2250, false)).toBe(375);
    expect(TelegraphEngine.scoreWave(7, 2, 99999, false)).toBe(800);
    expect(TelegraphEngine.scoreWave(6, 1, 0, false)).toBe(950);
  });

  it('gives no pace bonus on a wave where the hint was spent', () => {
    expect(TelegraphEngine.scoreWave(3, 0, 0, true)).toBe(300);
    expect(TelegraphEngine.scoreWave(7, 2, 0, true)).toBe(800);
  });

  it('times only the recall, from the board opening to the last tile', () => {
    const clock = manualClock();
    const engine = new TelegraphEngine(seeded(9), clock.now);
    const cues = engine.startCampaign();
    clock.advance(5000); // cues playing: not timed
    engine.setAcceptingInput(true);
    clock.advance(1000);
    engine.submitCell(cues[0].target);
    engine.submitCell(cues[1].target);
    clock.advance(800);
    const outcome = engine.submitCell(cues[2].target);
    expect(outcome).toMatchObject({ kind: 'wave-cleared', waveMs: 1800 });
    // 300 base + round(150 × (1 − 1800 / 4500)) = 300 + 90
    expect(outcome).toMatchObject({ waveScore: 390, score: 390 });
    expect(engine.getScore()).toBe(390);
  });

  it('keeps the clock running through a hint replay and drops the pace bonus', () => {
    const clock = manualClock();
    const engine = new TelegraphEngine(seeded(10), clock.now);
    const cues = engine.startCampaign();
    engine.setAcceptingInput(true);
    clock.advance(500);
    engine.useForecastHint();
    clock.advance(3000); // replay
    engine.setAcceptingInput(true);
    clock.advance(500);
    let outcome: StepOutcome = { kind: 'ignored' };
    for (const cue of cues) outcome = engine.submitCell(cue.target);
    expect(outcome).toMatchObject({ kind: 'wave-cleared', waveMs: 4000, waveScore: 300 });
  });

  it('adds every wave into the campaign score', () => {
    const clock = manualClock();
    const engine = new TelegraphEngine(seeded(11), clock.now);
    engine.startCampaign();
    let total = 0;
    let outcome: StepOutcome = { kind: 'ignored' };
    for (let wave = 1; wave <= 5; wave++) {
      if (wave > 1) engine.rollWaveSequence();
      outcome = clearWave(engine); // instant recall: full pace bonus
      const n = TelegraphEngine.sequenceLengthForWave(wave);
      total += TelegraphEngine.scoreWave(n, TelegraphEngine.shovesForWave(wave), 0, false);
    }
    expect(outcome).toMatchObject({ kind: 'campaign-cleared', score: total });
    expect(total).toBe(450 + 600 + 750 + 950 + 1150);
  });
});

describe('TelegraphStageController', () => {
  it('starts on the welcome stage with the popup closed', () => {
    const ctrl = new TelegraphStageController();
    expect(ctrl.getStage()).toBe('welcome');
    expect(ctrl.isPopupOpen()).toBe(false);
    expect(ctrl.getVisitedStages()).toEqual(['welcome']);
  });

  it('walks the stages in order and wraps back to the first', () => {
    const ctrl = new TelegraphStageController();
    const order = [1, 2, 3].map(() => ctrl.nextStage().to.id);
    expect(order).toEqual(['animation-sequence', 'title-intro', 'welcome']);
    expect(ctrl.getVisitedStages()).toEqual(['welcome', 'animation-sequence', 'title-intro']);
  });

  it('reports each transition with its style', () => {
    const ctrl = new TelegraphStageController();
    const { from, to, event } = ctrl.transitionTo('title-intro');
    expect(from).toBe('welcome');
    expect(to.id).toBe('title-intro');
    expect(event).toMatchObject({ kind: 'stage-transition', stage: 'title-intro', meta: { transition: 'phosphor-warp' } });
  });

  it('tracks explored portals', () => {
    const ctrl = new TelegraphStageController();
    expect(ctrl.selectPortal('simulation').node.id).toBe('simulation');
    expect(ctrl.getActivePortal().id).toBe('simulation');
    expect(ctrl.getExploredPortals()).toEqual(['psychology', 'simulation']);
  });

  it('counts every interaction but keeps only the last 32', () => {
    const ctrl = new TelegraphStageController();
    for (let i = 0; i < 40; i++) ctrl.recordInteraction('click-ripple', `t${i}`);
    expect(ctrl.getInteractionCount()).toBe(40);
    expect(ctrl.getRecentInteractions(100)).toHaveLength(32);
    expect(ctrl.getRecentInteractions(1)[0]).toMatchObject({ id: 'evt-40', targetId: 't39' });
  });

  it('has three stages and four portal nodes with unique ids', () => {
    expect(new Set(TELEGRAPH_STAGES.map((s) => s.id)).size).toBe(3);
    expect(new Set(TELEGRAPH_PORTAL_NODES.map((n) => n.id)).size).toBe(4);
  });
});

describe('parseLabHash', () => {
  it('reads the lab section and an optional stage', () => {
    expect(parseLabHash('#lab')).toEqual({ lab: true, stage: null });
    expect(parseLabHash('#lab?stage=title-intro')).toEqual({ lab: true, stage: 'title-intro' });
  });

  it('ignores unknown stages and other hashes', () => {
    expect(parseLabHash('#lab?stage=boss')).toEqual({ lab: true, stage: null });
    expect(parseLabHash('#projects')).toEqual({ lab: false, stage: null });
    expect(parseLabHash('')).toEqual({ lab: false, stage: null });
  });
});
