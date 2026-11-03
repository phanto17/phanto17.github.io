/** World lighting follows the real time in Poznań; Dev Mode can override the hour. */
import * as THREE from 'three';

interface Key { h: number; sun: string; si: number; sky: string; gnd: string; hi: number; fog: string; water: string; night: number }
const NIGHT = { sun: '#b4cfc8', si: 1.5, sky: '#4f9a86', gnd: '#10261e', hi: 1.75, fog: '#082a22', water: '#0c3a33', night: 1 };
const KEYS: Key[] = [
  { h: 0, ...NIGHT },
  { h: 5, ...NIGHT, sun: '#b0c8c8', sky: '#4c8f84', fog: '#0c2f2a', water: '#0f3d38' },
  { h: 6.5, sun: '#ff9d6c', si: 1.9, sky: '#8fb0ac', gnd: '#27332b', hi: 0.9, fog: '#59716c', water: '#2f5a5e', night: 0.35 },
  { h: 9, sun: '#fff0d6', si: 3.0, sky: '#c9ece2', gnd: '#46573f', hi: 1.15, fog: '#a9d4c7', water: '#2f8c84', night: 0 },
  { h: 15.5, sun: '#fff0d6', si: 3.0, sky: '#c9ece2', gnd: '#46573f', hi: 1.15, fog: '#a9d4c7', water: '#2f8c84', night: 0 },
  { h: 18, sun: '#ffb483', si: 2.2, sky: '#b4bdaa', gnd: '#35382c', hi: 1.15, fog: '#8d6d5e', water: '#4f6a70', night: 0.3 },
  { h: 19.6, sun: '#8c8fd6', si: 1.0, sky: '#4c5f86', gnd: '#0f1714', hi: 0.9, fog: '#1e2c3c', water: '#15293a', night: 0.8 },
  { h: 21.5, ...NIGHT },
  { h: 24, ...NIGHT },
];
const K = KEYS.map((k) => ({ ...k, sun: new THREE.Color(k.sun), sky: new THREE.Color(k.sky), gnd: new THREE.Color(k.gnd), fog: new THREE.Color(k.fog), water: new THREE.Color(k.water) }));

export function poznanHour(d = new Date()): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const hh = Number(p.find((x) => x.type === 'hour')?.value ?? 0) % 24, mm = Number(p.find((x) => x.type === 'minute')?.value ?? 0);
  return hh + mm / 60;
}
export const fmtHour = (h: number): string => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
export const phaseName = (h: number): string => (h < 5 ? 'Night' : h < 7.5 ? 'Dawn' : h < 16.5 ? 'Day' : h < 19 ? 'Golden hour' : h < 20.5 ? 'Dusk' : 'Night');

export interface LightSample { sun: THREE.Color; si: number; sky: THREE.Color; gnd: THREE.Color; hi: number; fog: THREE.Color; water: THREE.Color; night: number }
export function sample(h: number): LightSample {
  h = ((h % 24) + 24) % 24;
  let a = K[0], b = K[1];
  for (let i = 0; i < K.length - 1; i++) if (h >= K[i].h && h <= K[i + 1].h) { a = K[i]; b = K[i + 1]; break; }
  const t = (h - a.h) / (b.h - a.h || 1), L = (x: number, y: number) => x + (y - x) * t;
  return {
    sun: a.sun.clone().lerp(b.sun, t), si: L(a.si, b.si), sky: a.sky.clone().lerp(b.sky, t), gnd: a.gnd.clone().lerp(b.gnd, t),
    hi: L(a.hi, b.hi), fog: a.fog.clone().lerp(b.fog, t), water: a.water.clone().lerp(b.water, t), night: L(a.night, b.night),
  };
}

/** Sun by day, moon by night: both cross east to west and never go flat. */
export function lightDir(h: number, out: THREE.Vector3): THREE.Vector3 {
  const isDay = h >= 6 && h <= 20;
  const u = isDay ? (h - 6) / 14 : ((h + 24 - 20) % 24) / 10;
  const az = Math.PI * u, el = Math.max(0.35, Math.sin(Math.PI * u) * 1.1);
  return out.set(-Math.cos(az), el, 0.45 + Math.sin(az) * 0.35).normalize();
}
