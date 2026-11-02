import { describe, expect, it } from 'vitest';
import { TONES, createSound, toneFor, type SoundCue } from '../src/scripts/sound';

/** A Web Audio context that records what was started. */
function fakeContext() {
  const started: { freq: number; type: string; gain: number; stop: number }[] = [];
  const ctx = {
    currentTime: 10,
    destination: {},
    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: { value: 0, setValueAtTime: (v: number) => void (osc.frequency.value = v) },
        connect: (n: unknown) => n,
        start: () => void started.push({ freq: osc.frequency.value, type: osc.type, gain: lastGain, stop: 0 }),
        stop: (t: number) => void (started[started.length - 1].stop = t),
      };
      return osc;
    },
    createGain() {
      return {
        gain: { setValueAtTime: (v: number) => void (lastGain = v), exponentialRampToValueAtTime: () => {} },
        connect: (n: unknown) => n,
      };
    },
  };
  let lastGain = 0;
  return { ctx: ctx as unknown as AudioContext, started };
}

describe('the cue table', () => {
  it('names every cue the game plays', () => {
    const cues: SoundCue[] = ['cue', 'shove', 'step', 'wave', 'clear', 'miss', 'blocked', 'preview', 'stage-welcome', 'stage-sequence', 'stage-title', 'portal', 'close'];
    for (const cue of cues) expect(TONES[cue].freq).toBeGreaterThan(0);
  });

  it('raises stepped cues with the step and leaves the others alone', () => {
    expect(toneFor('cue', 0).freq).toBe(300);
    expect(toneFor('cue', 3).freq).toBe(300 + 3 * 55);
    expect(toneFor('step', 2).freq).toBe(440 + 2 * 60);
    expect(toneFor('miss', 5).freq).toBe(110);
    expect(toneFor('cue').gain).toBe(0.08);
  });
});

describe('createSound', () => {
  it('plays nothing while sound is off', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => false, context: () => ctx }).play('clear');
    expect(started).toEqual([]);
  });

  it('plays the table tone through the context when on', () => {
    const { ctx, started } = fakeContext();
    createSound({ isOn: () => true, context: () => ctx }).play('cue', 2);
    expect(started).toEqual([{ freq: 410, type: 'triangle', gain: 0.08, stop: 10 + 0.12 }]);
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
