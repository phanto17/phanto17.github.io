/**
 * Site sound: one lazy AudioContext, mute from the preferences module, and a table of named cues so
 * callers say what happened (`sound.play('shove')`) rather than how it should sound. The table is
 * pure data (`toneFor`), so the cues are testable without audio.
 *
 * Today the table covers Telegraph Recall; the site-wide click (Base.astro) and the signal landing's
 * chime are the next two callers to move here.
 */
import { prefs } from './prefs';

export type SoundCue =
  | 'cue'
  | 'shove'
  | 'step'
  | 'wave'
  | 'clear'
  | 'miss'
  | 'blocked'
  | 'preview'
  | 'stage-welcome'
  | 'stage-sequence'
  | 'stage-title'
  | 'portal'
  | 'close';

export interface Tone {
  freq: number;
  type: OscillatorType;
  /** Seconds. */
  duration: number;
  /** Hz added per `step` (the cue's index, the recall step, the preview chunk). */
  stepHz?: number;
  gain?: number;
}

export const TONES: Readonly<Record<SoundCue, Tone>> = {
  /** A telegraphed tile lighting up; rises with its position in the sequence. */
  cue: { freq: 300, type: 'triangle', duration: 0.12, stepHz: 55 },
  /** A shove cue's arrow, under the cue tone. */
  shove: { freq: 180, type: 'square', duration: 0.08 },
  /** A correct recall step; rises with the step. */
  step: { freq: 440, type: 'sine', duration: 0.1, stepHz: 60 },
  wave: { freq: 660, type: 'triangle', duration: 0.22 },
  clear: { freq: 784, type: 'triangle', duration: 0.28 },
  miss: { freq: 110, type: 'sawtooth', duration: 0.25 },
  /** A press the board is not accepting. */
  blocked: { freq: 210, type: 'sine', duration: 0.05 },
  /** The stage-2 preview loop; rises with the chunk. */
  preview: { freq: 260, type: 'sine', duration: 0.07, stepHz: 45 },
  'stage-welcome': { freq: 330, type: 'triangle', duration: 0.14 },
  'stage-sequence': { freq: 440, type: 'triangle', duration: 0.14 },
  'stage-title': { freq: 587, type: 'triangle', duration: 0.14 },
  portal: { freq: 392, type: 'triangle', duration: 0.1 },
  close: { freq: 220, type: 'sine', duration: 0.1 },
};

const DEFAULT_GAIN = 0.08;

/** The tone a cue plays at a given step: the table entry with the step applied. */
export function toneFor(cue: SoundCue, step = 0): Required<Tone> {
  const tone = TONES[cue];
  return { ...tone, freq: tone.freq + (tone.stepHz ?? 0) * step, stepHz: tone.stepHz ?? 0, gain: tone.gain ?? DEFAULT_GAIN };
}

export interface SoundPlayer {
  play(cue: SoundCue, step?: number): void;
}

export interface SoundDeps {
  isOn: () => boolean;
  /** The context to play through, created on first use; null where Web Audio is unavailable. */
  context: () => AudioContext | null;
}

export function createSound(deps: SoundDeps): SoundPlayer {
  return {
    play(cue, step = 0) {
      if (!deps.isOn()) return;
      try {
        const ctx = deps.context();
        if (!ctx) return;
        const tone = toneFor(cue, step);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tone.type;
        osc.frequency.setValueAtTime(tone.freq, ctx.currentTime);
        gain.gain.setValueAtTime(tone.gain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + tone.duration);
      } catch {
        /* AudioContext unavailable or blocked */
      }
    },
  };
}

let browserContext: AudioContext | null = null;

/** The site's sound, muted unless the visitor turned sound on. */
export const sound: SoundPlayer = createSound({
  isOn: () => prefs.isSoundOn(),
  context: () => (browserContext ??= typeof AudioContext === 'undefined' ? null : new AudioContext()),
});
