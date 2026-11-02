/**
 * Site sound: one lazy AudioContext, mute from the preferences module, and a table of named cues so
 * callers say what happened (`sound.play('shove')`) rather than how it should sound. The table is
 * pure data (`toneFor`), so the cues are testable without audio.
 *
 * Callers: the site-wide click (Base.astro), the signal landing's chime, and Telegraph Recall's board
 * and popup.
 */
import { prefs } from './prefs';

export type SoundCue =
  | 'click'
  | 'chime'
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
  /** Seconds, from the note's start to its fade-out. */
  duration: number;
  /** Hz added per `step` (the cue's index, the recall step, the preview chunk). */
  stepHz?: number;
  gain?: number;
  /** Glide the pitch to this frequency over `sweep` seconds (default: the whole duration). */
  sweepTo?: number;
  sweep?: number;
  /** Fade in over this many seconds instead of starting at full gain. */
  attack?: number;
  /** Further notes of the same shape, each starting `at` seconds after the first. */
  then?: readonly { freq: number; at: number }[];
}

export const TONES: Readonly<Record<SoundCue, Tone>> = {
  /** Every control answers a click with this, site-wide (with the phosphor ripple). */
  click: { freq: 1760, type: 'square', duration: 0.05, gain: 0.035, sweepTo: 880, sweep: 0.04 },
  /** The signal landing's two-note cue. */
  chime: { freq: 660, type: 'triangle', duration: 0.16, gain: 0.05, attack: 0.02, then: [{ freq: 990, at: 0.12 }] },
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
/** The oscillator runs this much past the fade-out. */
const TAIL = 0.02;

/** The tone a cue plays at a given step: the table entry with the step and the defaults applied. */
export function toneFor(cue: SoundCue, step = 0): Tone & { gain: number; stepHz: number } {
  const tone = TONES[cue];
  return { ...tone, freq: tone.freq + (tone.stepHz ?? 0) * step, stepHz: tone.stepHz ?? 0, gain: tone.gain ?? DEFAULT_GAIN };
}

export interface SoundPlayer {
  play(cue: SoundCue, step?: number): void;
}

export interface SoundDeps {
  isOn: () => boolean;
  /** The context to play through; null where Web Audio is unavailable or not allowed yet. */
  context: () => AudioContext | null;
}

export function createSound(deps: SoundDeps): SoundPlayer {
  return {
    play(cue, step = 0) {
      if (!deps.isOn()) return;
      try {
        const ctx = deps.context();
        if (!ctx) return;
        // A running context a browser has since suspended (a hidden tab) comes back on this gesture.
        if (ctx.state === 'suspended') void ctx.resume();
        const tone = toneFor(cue, step);
        const t0 = ctx.currentTime;
        const notes = [{ freq: tone.freq, at: 0 }, ...(tone.then ?? [])];
        for (const note of notes) {
          const start = t0 + note.at;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = tone.type;
          osc.frequency.setValueAtTime(note.freq, start);
          if (tone.sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(tone.sweepTo, start + (tone.sweep ?? tone.duration));
          if (tone.attack) {
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(tone.gain, start + tone.attack);
          } else {
            gain.gain.setValueAtTime(tone.gain, start);
          }
          gain.gain.exponentialRampToValueAtTime(0.001, start + tone.duration);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + tone.duration + TAIL);
        }
      } catch {
        /* AudioContext unavailable or blocked */
      }
    },
  };
}

/**
 * Create the context on first use and keep it while it runs. A context created without a user
 * gesture (the landing's chime fires after idle seconds) comes up suspended under the autoplay
 * policy: it is closed and not kept, so the next gesture's cue gets a fresh, running one instead of
 * a silent first click.
 */
export function lazyContext(create: () => AudioContext): () => AudioContext | null {
  let kept: AudioContext | null = null;
  return () => {
    if (kept && kept.state !== 'closed') return kept;
    kept = null;
    let fresh: AudioContext;
    try {
      fresh = create();
    } catch {
      return null;
    }
    if (fresh.state === 'suspended') {
      void fresh.close();
      return null;
    }
    kept = fresh;
    return kept;
  };
}

/** The site's sound, muted unless the visitor turned sound on. */
export const sound: SoundPlayer = createSound({
  isOn: () => prefs.isSoundOn(),
  context: lazyContext(() => new AudioContext()),
});
