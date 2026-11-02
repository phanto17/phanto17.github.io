import { describe, expect, it } from 'vitest';
import { TONES, createSound, lazyContext, toneFor, type SoundCue } from '../src/scripts/sound';

interface Started {
  freq: number;
  type: string;
  gain: number;
  attackFrom?: number;
  sweepTo?: number;
  sweepAt?: number;
  start: number;
  stop: number;
}

/** A Web Audio context that records what was scheduled. */
function fakeContext(state: AudioContextState = 'running') {
  const started: Started[] = [];
  let resumed = 0;
  let closed = 0;
  const ctx = {
    state,
    currentTime: 10,
    destination: {},
    resume: () => void resumed++,
    close: () => void closed++,
    createOscillator() {
      const rec: Started = { freq: 0, type: 'sine', gain: 0, start: 0, stop: 0 };
      const osc = {
        type: 'sine',
        frequency: {
          setValueAtTime: (v: number) => void (rec.freq = v),
          exponentialRampToValueAtTime: (v: number, t: number) => {
            rec.sweepTo = v;
            rec.sweepAt = t;
          },
        },
        connect: (n: { connect?: (d: unknown) => unknown; rec?: Started }) => {
          if (n.rec) Object.assign(rec, { gain: n.rec.gain, attackFrom: n.rec.attackFrom });
          return n;
        },
        start: (t: number) => {
          rec.type = osc.type;
          rec.start = t;
          started.push(rec);
        },
        stop: (t: number) => void (rec.stop = t),
      };
      return osc;
    },
    createGain() {
      const rec: Started = { freq: 0, type: '', gain: 0, start: 0, stop: 0 };
      const sets: number[] = [];
      return {
        rec,
        gain: {
          setValueAtTime: (v: number) => void sets.push(v),
          exponentialRampToValueAtTime: (v: number) => {
            // The first ramp after a near-silent start is the attack; the final one is the fade-out.
            if (sets[0] !== undefined && sets[0] < 0.001 && rec.gain === 0) {
              rec.attackFrom = sets[0];
              rec.gain = v;
            } else if (rec.gain === 0) rec.gain = sets[0];
          },
        },
        connect: (d: unknown) => d,
      };
    },
  };
  return { ctx: ctx as unknown as AudioContext, started, resumed: () => resumed, closed: () => closed };
}

describe('the cue table', () => {
  it('names every cue the site plays', () => {
    const cues: SoundCue[] = ['click', 'chime', 'cue', 'shove', 'step', 'wave', 'clear', 'miss', 'blocked', 'preview', 'stage-welcome', 'stage-sequence', 'stage-title', 'portal', 'close'];
    for (const cue of cues) expect(TONES[cue].freq).toBeGreaterThan(0);
  });

  it('raises stepped cues with the step and leaves the others alone', () => {
    expect(toneFor('cue', 0).freq).toBe(300);
    expect(toneFor('cue', 3).freq).toBe(300 + 3 * 55);
    expect(toneFor('step', 2).freq).toBe(440 + 2 * 60);
    expect(toneFor('miss', 5).freq).toBe(110);
    expect(toneFor('cue').gain).toBe(0.08);
    expect(toneFor('click').gain).toBe(0.035);
  });
});

describe('createSound', () => {
  it('plays nothing while sound is off', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => false, context: () => ctx }).play('clear');
    expect(started).toEqual([]);
  });

  it('plays a plain tone from the table', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => true, context: () => ctx }).play('cue', 2);
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ freq: 410, type: 'triangle', gain: 0.08, start: 10 });
    expect(started[0].stop).toBeCloseTo(10 + 0.12 + 0.02);
    expect(started[0].sweepTo).toBeUndefined();
  });

  it('the click glides from 1760 to 880 Hz over 40 ms at a quiet gain', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => true, context: () => ctx }).play('click');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ freq: 1760, type: 'square', gain: 0.035, sweepTo: 880 });
    expect(started[0].sweepAt).toBeCloseTo(10.04);
  });

  it('the chime is two triangle notes 120 ms apart, each fading in', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => true, context: () => ctx }).play('chime');
    expect(started.map((s) => [s.freq, s.type, s.gain, s.attackFrom])).toEqual([
      [660, 'triangle', 0.05, 0.0001],
      [990, 'triangle', 0.05, 0.0001],
    ]);
    expect(started[0].start).toBe(10);
    expect(started[1].start).toBeCloseTo(10.12);
    expect(started[1].stop).toBeCloseTo(10.12 + 0.16 + 0.02);
  });

  it('resumes a suspended context on a cue and still schedules it', () => {
    const { ctx, started, resumed } = fakeContext('suspended');
    createSound({ isOn: () => true, context: () => ctx }).play('step');
    expect(resumed()).toBe(1);
    expect(started).toHaveLength(1);
  });

  it('is silent without a context and swallows a failing one', () => {
    createSound({ isOn: () => true, context: () => null }).play('miss');
    createSound({
      isOn: () => true,
      context: () => {
        throw new Error('blocked');
      },
    }).play('miss');
  });
});

describe('lazyContext', () => {
  it('creates once and keeps a running context', () => {
    let created = 0;
    const running = fakeContext('running').ctx;
    const get = lazyContext(() => (created++, running));
    expect(get()).toBe(running);
    expect(get()).toBe(running);
    expect(created).toBe(1);
  });

  it('closes a context that comes up suspended and tries again next time', () => {
    const suspended = fakeContext('suspended');
    const running = fakeContext('running');
    const attempts = [suspended.ctx, running.ctx];
    const get = lazyContext(() => attempts.shift()!);
    expect(get()).toBeNull();
    expect(suspended.closed()).toBe(1);
    expect(get()).toBe(running.ctx);
  });

  it('returns null where Web Audio does not exist', () => {
    const get = lazyContext(() => {
      throw new ReferenceError('AudioContext is not defined');
    });
    expect(get()).toBeNull();
  });
});
