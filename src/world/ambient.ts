/**
 * The world's ambient bed: a low detuned drone and filtered wind, synthesised on the site's shared
 * AudioContext. Nothing to download. Follows the sound preference like every cue.
 */
export interface Ambient { setNight(n: number): void; stop(): void }

export function startAmbient(ctx: AudioContext): Ambient {
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 0.4;
  const g = ctx.createGain(); g.gain.value = 0.11; lp.connect(g); g.connect(master);
  const nodes: AudioScheduledSourceNode[] = [];
  for (const [f, d] of [[55, -6], [82.5, 5], [110, 9]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = d;
    const og = ctx.createGain(); og.gain.value = f === 55 ? 0.8 : 0.35; o.connect(og); og.connect(lp); o.start(); nodes.push(o);
  }
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { last = last * 0.985 + (Math.random() * 2 - 1) * 0.015; data[i] = last * 6; }
  const ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 520; nf.Q.value = 0.6;
  const ng = ctx.createGain(); ng.gain.value = 0.09; ns.connect(nf); nf.connect(ng); ng.connect(master); ns.start(); nodes.push(ns);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 240; lfo.connect(lg); lg.connect(nf.frequency); lfo.start(); nodes.push(lfo);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.8);
  return {
    setNight(n) { lp.frequency.setTargetAtTime(520 - n * 260, ctx.currentTime, 1); },
    stop() { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); setTimeout(() => { nodes.forEach((n) => n.stop()); master.disconnect(); }, 400); },
  };
}
