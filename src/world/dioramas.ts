/**
 * One small living scene per location. Each one returns its group, a per-frame update and `info()`,
 * the diorama's real runtime state, which Dev Mode prints. Scenes illustrate the projects' systems;
 * they are not footage from the games.
 */
import * as THREE from 'three';
import type { Kind, Location } from './gen';

export interface Diorama {
  group: THREE.Group;
  update(t: number, dt: number): void;
  info(): string;
  loc: Location;
}

const std = (c: THREE.ColorRepresentation, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, metalness: 0.02, ...o });
const glowMat = (c: THREE.ColorRepresentation, e = 1.8) => std(c, { emissive: c, emissiveIntensity: e });
const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true; return o;
};
const cyl = (r0: number, r1: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 8) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y + h / 2, z); o.castShadow = true; return o;
};

let glowTex: THREE.CanvasTexture | null = null;
export function glowSprite(color: THREE.ColorRepresentation, size: number, opacity = 0.7): THREE.Sprite {
  if (!glowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.42)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); glowTex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); s.userData.glow = opacity;
  return s;
}

type Build = (accent: string) => Omit<Diorama, 'loc'>;

const arena: Build = (a) => {
  const G = new THREE.Group(), stone = std('#39443c');
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), glowMat(a, 2.2)); core.position.y = 2.25; core.castShadow = true;
  G.add(cyl(1.15, 1.35, 0.35, stone), cyl(0.3, 0.42, 1.5, std('#232a26'), 0, 0.35), core);
  const glow = glowSprite(a, 6, 0.55); glow.position.y = 2.2; G.add(glow);
  // Object pool: the enemies are recycled, never created or destroyed at runtime.
  const N = 18, enemies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), std('#8d2e2a'), N); enemies.castShadow = true;
  const M = 10, shots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 5), glowMat(a, 2.6), M);
  G.add(enemies, shots);
  const pool = Array.from({ length: N }, (_, i) => ({ a: (i / N) * 6.283, r: 2.4 + (i % 6) * 0.55, s: 0.5 + (i % 4) * 0.1 }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let recycled = 0;
  return {
    group: G,
    update(t, dt) {
      core.rotation.y = t * 1.4; core.position.y = 2.25 + Math.sin(t * 2) * 0.08;
      pool.forEach((pp, i) => {
        pp.r -= pp.s * dt; pp.a += dt * 0.12;
        if (pp.r < 1.35) { pp.r = 5.3; recycled++; }
        e.set(0, -pp.a, 0); q.setFromEuler(e); p.set(Math.cos(pp.a) * pp.r, Math.abs(Math.sin(t * 6 + i)) * 0.1, Math.sin(pp.a) * pp.r);
        m.compose(p, q, one); enemies.setMatrixAt(i, m);
      });
      enemies.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < M; i++) { const u = (t * 0.7 + i / M) % 1, b = i * 2.4, r = 1 + u * 4.2; m.makeTranslation(Math.cos(b) * r, 1.5 - u * 0.9, Math.sin(b) * r); shots.setMatrixAt(i, m); }
      shots.instanceMatrix.needsUpdate = true;
    },
    info: () => `Pool ${N}/${N} active · recycled ${recycled}`,
  };
};

const board: Build = (a) => {
  const G = new THREE.Group(), S = 5, cell = 1.15, o = (-(S - 1) * cell) / 2;
  const dark = std('#1d2a26'), lite = std('#2b3d36'), pitM = new THREE.MeshBasicMaterial({ color: '#020605' });
  G.add(box(S * cell + 0.5, 0.25, S * cell + 0.5, std('#141c19')));
  const tiles: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
  for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
    const t = box(cell * 0.94, 0.12, cell * 0.94, ((x + z) % 2 ? dark : lite).clone(), o + x * cell, 0.25, o + z * cell) as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
    G.add(t); tiles.push(t);
  }
  const pit = box(cell * 0.94, 0.14, cell * 0.94, pitM, o + 4 * cell, 0.25, 0); G.add(pit);
  const hero = new THREE.Group(); const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), glowMat(a, 1.2)); head.position.y = 0.8;
  hero.add(cyl(0.2, 0.32, 0.65, glowMat(a, 0.8)), head); G.add(hero);
  const foe = new THREE.Group(); foe.add(box(0.5, 0.6, 0.5, std('#8d2e2a')), box(0.3, 0.2, 0.3, glowMat('#ff5d4a', 1.2), 0, 0.6)); G.add(foe);
  const glow = glowSprite(a, 7, 0.28); glow.position.y = 1; G.add(glow);
  const at = (obj: THREE.Object3D, x: number, z: number, y = 0.37) => obj.position.set(o + x * cell, y, o + z * cell);
  let phase = 'READ', clock = 0, lane = 2, explored = 0, wave = new Map<number, number>();
  // A real BFS over the 5×5 board, shown as a ripple while the turn is read.
  const flood = (sx: number, sz: number) => {
    const seen = new Map([[sx * S + sz, 0]]), q = [[sx, sz]];
    while (q.length) { const [x, z] = q.shift()!, dd = seen.get(x * S + z)!; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= S || nz >= S || seen.has(nx * S + nz)) continue; seen.set(nx * S + nz, dd + 1); q.push([nx, nz]); } }
    return seen;
  };
  const reset = () => { lane = 1 + Math.floor(Math.random() * 3); phase = 'READ'; clock = 0; pit.position.z = o + lane * cell; at(hero, 1, lane); at(foe, 3, lane); foe.scale.set(1, 1, 1); wave = flood(1, lane); explored = wave.size; };
  reset();
  return {
    group: G,
    update(_t, dt) {
      clock += dt;
      if (phase === 'READ') { if (clock > 1.1) { phase = 'MOVE'; clock = 0; } }
      else if (phase === 'MOVE') { const u = Math.min(1, clock / 0.45); hero.position.x = o + (1 + u) * cell; hero.position.y = 0.37 + Math.sin(u * Math.PI) * 0.25; if (u >= 1) { phase = 'PUSH'; clock = 0; } }
      else if (phase === 'PUSH') { const u = Math.min(1, clock / 0.3); foe.position.x = o + (3 + u) * cell; if (u >= 1) { phase = 'FALL'; clock = 0; } }
      else if (phase === 'FALL') { const u = Math.min(1, clock / 0.5); foe.position.y = 0.37 - u * 1.2; foe.scale.setScalar(1 - u * 0.8); if (u >= 1) { phase = 'RESET'; clock = 0; } }
      else if (phase === 'RESET' && clock > 0.8) reset();
      const ripple = phase === 'READ' ? clock * 5 : -1;
      for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
        const dd = wave.get(x * S + z) ?? 99, on = ripple >= 0 && Math.abs(dd - ripple) < 0.7, tile = tiles[x * S + z];
        tile.material.emissive.set(a); tile.material.emissiveIntensity = on ? 0.55 : 0;
      }
    },
    info: () => `Turn ${phase} · BFS ${explored} tiles`,
  };
};

const dungeon: Build = (a) => {
  const G = new THREE.Group(), wall = std('#4a423a'), floor = std('#2f2a25');
  G.add(box(6.6, 0.1, 6.6, floor));
  for (const [w, d, x, z] of [[6.6, 0.5, 0, -3.05], [0.5, 6.6, -3.05, 0], [0.5, 2.3, 3.05, -2.15], [0.5, 2.3, 3.05, 2.15], [2.2, 0.5, -2.2, 3.05], [2.2, 0.5, 2.2, 3.05]]) {
    G.add(box(w, 0.8 + (Math.abs(x) + Math.abs(z)) * 0.08, d, wall, x, 0.1, z));
  }
  for (const [x, z] of [[-2.4, -2.4], [2.4, -2.4]]) {
    G.add(cyl(0.2, 0.26, 0.7, std('#1a1614'), x, 0.1, z));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 6), glowMat('#ff9c5a', 3)); f.position.set(x, 1, z); G.add(f);
    const g = glowSprite('#ff7a3d', 4, 0.5); g.position.set(x, 1.1, z); G.add(g);
  }
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: a, transparent: true, opacity: 0, depthWrite: false }));
  patch.rotation.x = -Math.PI / 2; patch.position.y = 0.13; G.add(patch);
  const body = new THREE.Group(); body.add(box(0.8, 1.1, 0.6, std('#3a1f1b')), box(0.44, 0.36, 0.4, std('#553029'), 0, 1.1));
  const claw = box(0.16, 0.7, 0.16, std('#553029'), 0.56, 0.3, 0); body.add(box(0.34, 0.08, 0.06, glowMat(a, 3), 0, 1.24, 0.21), claw); G.add(body); body.position.set(-0.6, 0.1, -0.6);
  // The same loop the real enemies run: a state machine with a readable telegraph before every strike.
  let s = 'PATROL', c = 0, hits = 0; const tgt = new THREE.Vector2(0.8, 0.4);
  return {
    group: G,
    update(t, dt) {
      c += dt;
      if (s === 'PATROL') {
        const dx = tgt.x - body.position.x, dz = tgt.y - body.position.z, dd = Math.hypot(dx, dz);
        if (dd > 0.05) { body.position.x += (dx / dd) * dt * 0.9; body.position.z += (dz / dd) * dt * 0.9; body.rotation.y = Math.atan2(dx, dz); body.position.y = 0.1 + Math.abs(Math.sin(t * 7)) * 0.04; }
        if (dd <= 0.05 || c > 3) { s = 'TELEGRAPH'; c = 0; const ang = body.rotation.y; patch.position.x = body.position.x + Math.sin(ang) * 1.3; patch.position.z = body.position.z + Math.cos(ang) * 1.3; patch.rotation.z = -ang; }
      } else if (s === 'TELEGRAPH') {
        const u = c; patch.material.opacity = 0.12 + u * 0.65; patch.scale.setScalar(0.6 + u); claw.rotation.x = -u * 1.8; claw.position.y = 0.3 + u * 0.3;
        if (u >= 1) { s = 'STRIKE'; c = 0; hits++; }
      } else if (s === 'STRIKE') {
        patch.material.opacity = 0.95 - c * 3; claw.rotation.x = -1.8 + Math.min(1, c * 8) * 2.9; claw.position.y = 0.45;
        if (c > 0.3) { s = 'RECOVER'; c = 0; patch.material.opacity = 0; }
      } else if (s === 'RECOVER') {
        claw.rotation.x *= 0.92; claw.position.y = 0.3;
        if (c > 1) { s = 'PATROL'; c = 0; tgt.set(-1.8 + Math.random() * 3.6, -1.6 + Math.random() * 3.4); }
      }
    },
    info: () => `Enemy FSM ${s} · strikes ${hits}`,
  };
};

const archive: Build = (a) => {
  const G = new THREE.Group();
  G.add(box(4.8, 0.2, 4.8, std('#161d19')));
  // 708 LEDs: one per JUnit test, lit in passes.
  const n = 708, side = 27, leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.05, 0.13), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n);
  const m = new THREE.Matrix4(), pass = new THREE.Color('#5fe0a0'), idle = new THREE.Color('#123026');
  for (let i = 0; i < n; i++) { m.makeTranslation(((i % side) - 13) * 0.168, 0.22, (Math.floor(i / side) - 13) * 0.168); leds.setMatrixAt(i, m); leds.setColorAt(i, idle); }
  G.add(leds);
  const slabs: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) { const s = box(1.8 - i * 0.12, 0.2, 1.3 - i * 0.08, std(i % 2 ? '#3d3524' : '#514530'), 0, 0.3 + i * 0.42); G.add(s); slabs.push(s); }
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), glowMat(a, 2.4)); cap.position.y = 3.6; cap.castShadow = true; G.add(cap);
  const glow = glowSprite(a, 6, 0.42); glow.position.y = 3.4; G.add(glow);
  let done = 0, wait = 0;
  return {
    group: G,
    update(t, dt) {
      slabs.forEach((s, i) => { s.rotation.y = Math.sin(t * 0.5 + i * 0.7) * 0.5; });
      cap.rotation.y = t; cap.position.y = 3.6 + Math.sin(t * 1.5) * 0.08;
      if (done >= n) { wait += dt; if (wait > 1.6) { done = 0; wait = 0; for (let i = 0; i < n; i++) leds.setColorAt(i, idle); leds.instanceColor!.needsUpdate = true; } return; }
      const next = Math.min(n, done + Math.ceil(dt * 170));
      for (let i = done; i < next; i++) leds.setColorAt(i, pass);
      done = next; leds.instanceColor!.needsUpdate = true;
    },
    info: () => `Test board ${done}/${n}`,
  };
};

const generic: Build = (a) => {
  const G = new THREE.Group();
  G.add(cyl(0.95, 1.1, 0.3, std('#2a332e')), box(0.8, 2.6, 0.5, std('#1b2420'), 0, 0.3), box(0.84, 0.28, 0.54, glowMat(a, 2.2), 0, 2.2));
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28), glowMat(a, 2.4)); orb.position.y = 3.4; G.add(orb);
  const glow = glowSprite(a, 5, 0.5); glow.position.y = 3.2; G.add(glow);
  return { group: G, update(t) { orb.rotation.y = t; orb.position.y = 3.4 + Math.sin(t * 1.4) * 0.1; }, info: () => 'Default diorama: no custom code' };
};

const station: Build = () => {
  const G = new THREE.Group(), wood = std('#3a2c20'), roof = std('#203a2e');
  G.add(box(3.8, 0.2, 3.8, std('#1a211c')), box(3, 1.5, 2.6, wood, 0, 0.2));
  const r = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.2, 4), roof); r.rotation.y = Math.PI / 4; r.position.y = 2.3; r.castShadow = true; G.add(r);
  G.add(box(0.8, 0.5, 0.05, glowMat('#ffc98a', 3), -0.6, 0.85, 1.31), box(0.55, 1, 0.05, std('#20170f'), 0.75, 0.2, 1.31), cyl(0.03, 0.04, 3, std('#55504a'), -1.5, 0.2, -1));
  const flag = box(0.7, 0.34, 0.02, glowMat('#ff8e53', 1.2), -1.13, 2.8, -1); G.add(flag);
  const g = glowSprite('#ffc98a', 5, 0.42); g.position.set(-0.6, 1.1, 1.8); G.add(g);
  return { group: G, update(t) { flag.rotation.y = Math.sin(t * 2.3) * 0.25; }, info: () => 'Hub: every path leads back here' };
};

const lab: Build = (a) => {
  const G = new THREE.Group(), S = 4, c = 0.95, o = (-(S - 1) * c) / 2;
  G.add(box(4.5, 0.35, 4.5, std('#142128')));
  const pads: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
  for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
    const p = box(c * 0.9, 0.1, c * 0.9, std('#1e333b', { emissive: a, emissiveIntensity: 0 }), o + x * c, 0.35, o + z * c) as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
    G.add(p); pads.push(p);
  }
  const glow = glowSprite(a, 7, 0.32); glow.position.y = 1; G.add(glow);
  const seq = Array.from({ length: 5 }, () => Math.floor(Math.random() * 16)); let at = 0, c0 = 0;
  return {
    group: G,
    update(_t, dt) {
      c0 += dt; if (c0 > 0.5) { c0 = 0; at = (at + 1) % (seq.length + 3); if (at === 0) seq.forEach((_, i) => (seq[i] = Math.floor(Math.random() * 16))); }
      pads.forEach((p, i) => { const on = seq[at] === i; p.material.emissiveIntensity += ((on ? 2.2 : 0) - p.material.emissiveIntensity) * Math.min(1, dt * 10); p.position.y = 0.4 + p.material.emissiveIntensity * 0.05; });
    },
    info: () => `Telegraph demo step ${at}`,
  };
};

const guild: Build = (a) => {
  const G = new THREE.Group(), stone = std('#333a38'), roof = std('#2a2438');
  G.add(box(4.6, 0.25, 4.6, std('#1a1f1e')));
  const members = ['#c6a8ff', '#ff8e53', '#5fe0c0', '#f2c866'], flags: THREE.Mesh[] = [];
  [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(([x, z], i) => {
    G.add(cyl(0.2, 0.26, 1.9, stone, x, 0.25, z));
    const b = box(0.5, 0.9, 0.04, glowMat(members[i], 0.7), x, 0.85, z + (z > 0 ? 0.28 : -0.28)); G.add(b); flags.push(b);
  });
  G.add(box(4.6, 0.25, 4.6, roof, 0, 2.15));
  const r = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.2, 4), roof); r.rotation.y = Math.PI / 4; r.position.y = 3; r.castShadow = true; G.add(r);
  const g = glowSprite(a, 5, 0.32); g.position.y = 1.1; G.add(g);
  return { group: G, update(t) { flags.forEach((f, i) => (f.rotation.y = Math.sin(t * 1.6 + i) * 0.2)); }, info: () => 'Team projects: four banners, four-person teams' };
};

const mast: Build = (a) => {
  const G = new THREE.Group(), steel = std('#46504a');
  G.add(cyl(1, 1.2, 0.3, std('#2a332e')));
  for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [0, 0.5]]) { const leg = cyl(0.03, 0.07, 5.6, steel, 0, 0, 0, 5); leg.position.set(x * 0.55, 3.05, z * 0.55); leg.rotation.set(z * 0.09, 0, -x * 0.09); G.add(leg); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), glowMat(a, 3)); lamp.position.y = 6; G.add(lamp);
  const glow = glowSprite(a, 5, 0.7); glow.position.y = 6; glow.userData.blink = true; G.add(glow);
  const rings = Array.from({ length: 3 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 4, 40), new THREE.MeshBasicMaterial({ color: a, transparent: true, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.y = 6; G.add(r); return r; });
  return {
    group: G,
    update(t) {
      const b = Math.sin(t * 3) > 0 ? 1 : 0.15; (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 3 * b; glow.material.opacity = 0.7 * b;
      rings.forEach((r, i) => { const u = (t * 0.35 + i / 3) % 1; r.scale.setScalar(0.4 + u * 7); (r.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.65; });
    },
    info: () => 'Signal: online',
  };
};

const uncharted: Build = () => {
  const G = new THREE.Group();
  G.add(cyl(0.05, 0.07, 1.5, std('#a8b8ae')), box(0.55, 0.3, 0.02, glowMat('#8fb5a6', 1.2), 0.3, 1.15, 0));
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.2, 40, 1), new THREE.MeshBasicMaterial({ color: '#8fb5a6', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; G.add(ring);
  return { group: G, update(t) { ring.rotation.z = t * 0.2; ring.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.2; }, info: () => 'Free slot for the next project' };
};

const KINDS: Record<Kind, Build> = { arena, board, dungeon, archive, generic, station, lab, guild, mast, uncharted };
export const buildDiorama = (loc: Location): Diorama => ({ ...(KINDS[loc.kind] ?? generic)(loc.accent), loc });
