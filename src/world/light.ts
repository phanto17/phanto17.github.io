/** World lighting follows the real time in Poznań (`daylight.ts`); Dev Mode can override the hour. */
import * as THREE from 'three';
import { DAYLIGHT_KEYS, keysAround } from './daylight';

export { fmtHour, phaseName, poznanHour } from './daylight';

const K = DAYLIGHT_KEYS.map((k) => ({ ...k, sun: new THREE.Color(k.sun), sky: new THREE.Color(k.sky), gnd: new THREE.Color(k.gnd), fog: new THREE.Color(k.fog), water: new THREE.Color(k.water) }));

export interface LightSample { sun: THREE.Color; si: number; sky: THREE.Color; gnd: THREE.Color; hi: number; fog: THREE.Color; water: THREE.Color; night: number }
export function sample(h: number): LightSample {
  const { a: ia, b: ib, t } = keysAround(h);
  const a = K[ia], b = K[ib], L = (x: number, y: number) => x + (y - x) * t;
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
