/**
 * The world engine: terrain and dioramas from `gen.ts`, a walking explorer on the nav grid, locals
 * with a small state machine, lighting from `light.ts`, Dev Mode render passes and overlays, and the
 * minimap. Everything here is three.js; the HUD and panels are the component's (boot.ts). Loaded
 * only after the visitor chooses Explore.
 */
import * as THREE from 'three';
import { buildLayout, generate, bfs, nearestWalkable, smoothPath, HSTEP, T, FOOTPRINT, fbm, type Grid, type Location, type ProjectSeed, type LandmarkSeed } from './gen';
import { buildDiorama, glowSprite, type Diorama } from './dioramas';
import { sample, lightDir, poznanHour } from './light';

export const VIEWS = ['beauty', 'wireframe', 'normals', 'clay', 'depth'] as const;
export type View = (typeof VIEWS)[number];
export type OverlayKey = 'nav' | 'colliders' | 'ai' | 'path';

const COLORS: Record<number, string[]> = {
  [T.GRASS]: ['#2c5a3f', '#336648', '#274f39'], [T.PATH]: ['#a8926a', '#9c8761'], [T.PAD]: ['#4b5a50', '#435248'],
  [T.SAND]: ['#a59a74', '#958a68'], [T.ROCK]: ['#4a5450', '#3f4945'], [T.FOG]: ['#5a6e66', '#51645c'],
};

interface Critter {
  o: THREE.Group; x: number; z: number; y: number; state: 'IDLE' | 'WANDER' | 'ALERT' | 'FLEE'; timer: number;
  path: { x: number; z: number }[]; pi: number; yaw: number; home: { x: number; z: number }; label: HTMLElement; seed: number;
}

export interface EngineEvents {
  world(locs: Location[], grid: Grid): void;
  open(loc: Location): void;
  near(loc: Location | null): void;
  view(view: View): void;
  frame(state: EngineState): void;
}
export interface Sfx { step(): void; ui(): void; arrive(): void }

export interface EngineState {
  projects: ProjectSeed[]; locs: Location[]; grid: Grid; dioramas: Diorama[];
  view: View; dev: boolean; overlays: Record<OverlayKey, boolean>; hourOverride: number | null; hour: number; night: number; motion: boolean;
  player: { x: number; z: number; y: number; path: { x: number; z: number }[]; pi: number; yaw: number; speed: number; moving: boolean; tile: string | null; onArrive: (() => void) | null };
  cam: { zoom: number; zoomT: number; pan: THREE.Vector2; focus: THREE.Vector3; shift: THREE.Vector2; intro: boolean };
  lastBfs: { n: number; ms: number; len: number }; near: Location | null; critters: Critter[]; time: number; fps: number; ms: number; inputLocked: boolean; skipRender: boolean;
}

export function createEngine(canvas: HTMLCanvasElement, labelsEl: HTMLElement, opts: { projects: ProjectSeed[]; landmarks: LandmarkSeed[]; on: EngineEvents; sfx: Sfx; motion: boolean }) {
  const { on, sfx } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.autoClear = false; renderer.info.autoReset = false;

  const scene = new THREE.Scene(), overlay = new THREE.Scene();
  const fog = new THREE.Fog('#06201a', 58, 135); scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(30, 1, 12, 340);
  const hemi = new THREE.HemisphereLight('#fff', '#000', 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff', 1); sun.castShadow = true;
  sun.shadow.mapSize.setScalar(coarse ? 1024 : 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -46, right: 46, top: 46, bottom: -46, near: 1, far: 190 });
  scene.add(sun, sun.target);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: '#0a2f2a', roughness: 0.28, metalness: 0.25, transparent: true, opacity: 0.86 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.2; water.receiveShadow = true; scene.add(water);

  const overrides: Partial<Record<View, THREE.Material>> = {
    wireframe: new THREE.MeshBasicMaterial({ color: '#7dffc8', wireframe: true, transparent: true, opacity: 0.32, depthWrite: false }),
    normals: new THREE.MeshNormalMaterial({ flatShading: true }),
    clay: new THREE.MeshStandardMaterial({ color: '#b9b4a8', roughness: 1, flatShading: true }),
    depth: new THREE.MeshDepthMaterial(),
  };

  const S: EngineState = {
    projects: [...opts.projects], locs: [], grid: null as unknown as Grid, dioramas: [],
    view: 'beauty', dev: false, overlays: { nav: false, colliders: true, ai: true, path: true },
    hourOverride: null, hour: poznanHour(), night: 1, motion: opts.motion,
    player: { x: 0, z: 8, y: 0.5, path: [], pi: 0, yaw: 0, speed: 7.2, moving: false, tile: null, onArrive: null },
    cam: { zoom: coarse ? 1.05 : 1, zoomT: coarse ? 1.05 : 1, pan: new THREE.Vector2(), focus: new THREE.Vector3(0, 0, 8), shift: new THREE.Vector2(), intro: true },
    lastBfs: { n: 0, ms: 0, len: 0 }, near: null, critters: [], time: 0, fps: 60, ms: 16, inputLocked: false, skipRender: false,
  };

  // ── Explorer ───────────────────────────────────────────
  const player = new THREE.Group();
  {
    const cloth = new THREE.MeshStandardMaterial({ color: '#e6fff2', flatShading: true, roughness: 0.7 });
    const pack = new THREE.MeshStandardMaterial({ color: '#ff8e53', flatShading: true, roughness: 0.6, emissive: '#ff8e53', emissiveIntensity: 0.25 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.72, 8), cloth); body.position.y = 0.42; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), cloth); head.position.y = 0.96; head.castShadow = true;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.16), pack); bag.position.set(0, 0.5, -0.24); bag.castShadow = true;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), new THREE.MeshBasicMaterial({ color: '#0b1a14' })); visor.position.set(0, 0.98, 0.17);
    player.add(body, head, bag, visor);
  }
  const lantern = new THREE.PointLight('#ffb27a', 0, 13, 1.7); lantern.position.set(0.1, 1.5, 0.3); player.add(lantern);
  const lanternGlow = glowSprite('#ffb27a', 3.2, 0.3); lanternGlow.position.y = 0.9; player.add(lanternGlow);
  player.scale.setScalar(1.3); scene.add(player);

  const marker = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 4, 1), new THREE.MeshBasicMaterial({ color: '#ff8e53', transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  marker.rotation.x = -Math.PI / 2; marker.rotation.z = Math.PI / 4; marker.visible = false; scene.add(marker);

  const FF = coarse ? 70 : 170, ffPos = new Float32Array(FF * 3), ffSeed = new Float32Array(FF);
  for (let i = 0; i < FF; i++) ffSeed[i] = Math.random() * 100;
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ color: '#d8ffb0', size: 0.17, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  fireflies.frustumCulled = false; scene.add(fireflies);

  // ── Dev overlays live in their own scene so render-pass overrides never touch them ──
  const ovl = { nav: new THREE.Group(), col: new THREE.Group(), path: new THREE.Group() };
  overlay.add(ovl.nav, ovl.col, ovl.path);
  const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#ff8e53', depthTest: false, transparent: true }));
  pathLine.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1024 * 3), 3));
  pathLine.frustumCulled = false; pathLine.renderOrder = 5; ovl.path.add(pathLine);
  const EX = 5000, exploredMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#6fd8ff', transparent: true, opacity: 0, depthWrite: false }), EX);
  exploredMesh.count = 0; exploredMesh.frustumCulled = false; ovl.path.add(exploredMesh);
  const playerCap = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 1.2, 0.6)), new THREE.LineBasicMaterial({ color: '#ffe36e', depthTest: false, transparent: true })); ovl.col.add(playerCap);
  let exploredFade = 0;

  // ── World build (runs again whenever the project list changes) ────────
  const instanced: THREE.InstancedMesh[] = [];
  let world: THREE.Group | null = null, tiles: THREE.InstancedMesh | null = null;
  let cells: { x: number; z: number; i: number }[] = [];
  let labels: { el: HTMLElement; loc: Location }[] = [];
  const tileY = (x: number, z: number): number => { const i = S.grid.idx(Math.round(x), Math.round(z)); return i < 0 ? 0 : S.grid.h[i] * HSTEP; };

  function build() {
    if (world) {
      scene.remove(world);
      world.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose()); else m.material?.dispose?.(); });
    }
    instanced.length = 0;
    S.critters.forEach((c) => c.label.remove());
    const locs = buildLayout(S.projects, opts.landmarks), g = generate(locs);
    S.locs = locs; S.grid = g;
    const W = new THREE.Group(); world = W; scene.add(W);

    cells = [];
    for (let z = g.minZ; z <= g.maxZ; z++) for (let x = g.minX; x <= g.maxX; x++) { const i = g.idx(x, z); if (g.type[i] !== T.WATER) cells.push({ x, z, i }); }
    const tileGeo = new THREE.BoxGeometry(0.97, 1, 0.97).translate(0, -0.5, 0);
    const tl = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.92, metalness: 0 }), cells.length);
    tl.castShadow = tl.receiveShadow = true;
    const m = new THREE.Matrix4(), c = new THREE.Color(), tint = new THREE.Color();
    const nearestLoc = (x: number, z: number): Location => { let b = locs[0], bd = Infinity; for (const l of locs) { const dd = (l.x - x) ** 2 + (l.z - z) ** 2; if (dd < bd) { bd = dd; b = l; } } return b; };
    cells.forEach(({ x, z, i }, k) => {
      const top = g.h[i] * HSTEP, tp = g.type[i], pal = COLORS[tp];
      m.makeScale(1, top + 3, 1); m.setPosition(x, top, z); tl.setMatrixAt(k, m);
      c.set(pal[Math.abs(x * 7 + z * 13) % pal.length]).multiplyScalar(0.86 + fbm(x * 2.3, z * 2.3) * 0.28);
      if (tp === T.PAD) { const l = nearestLoc(x, z), dd = Math.hypot(l.x - x, l.z - z); c.lerp(tint.set(l.accent), Math.max(0, 0.34 - Math.abs(dd - 5) * 0.22)); }
      if (tp === T.GRASS) c.lerp(tint.set('#6a8a4a'), Math.min(0.35, g.h[i] * 0.07));
      tl.setColorAt(k, c);
    });
    W.add(tl); tiles = tl; instanced.push(tl);

    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.14, 0.7, 5).translate(0, 0.35, 0), new THREE.MeshStandardMaterial({ color: '#3a2a1e', flatShading: true }), g.trees.length);
    const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 1.2, 6).translate(0, 1.15, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), g.trees.length);
    const crown2 = new THREE.InstancedMesh(new THREE.ConeGeometry(0.45, 0.95, 6).translate(0, 1.8, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), g.trees.length);
    const pos = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
    g.trees.forEach((t, k) => {
      e.set(0, t.r * 6.28, 0); q.setFromEuler(e); pos.set(t.x, t.y, t.z); sc.setScalar(t.s); m.compose(pos, q, sc);
      trunks.setMatrixAt(k, m); crown.setMatrixAt(k, m); crown2.setMatrixAt(k, m);
      c.setHSL(0.39 + t.r * 0.05, 0.42, 0.17 + t.r * 0.08); crown.setColorAt(k, c); c.multiplyScalar(1.28); crown2.setColorAt(k, c);
    });
    for (const o of [trunks, crown, crown2]) { o.castShadow = o.receiveShadow = true; W.add(o); if (o !== trunks) instanced.push(o); }
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.42), new THREE.MeshStandardMaterial({ color: '#59625c', flatShading: true }), g.rocks.length);
    g.rocks.forEach((t, k) => { e.set(t.r * 3, t.r * 6, 0); q.setFromEuler(e); pos.set(t.x, t.y + 0.15, t.z); sc.setScalar(t.s); m.compose(pos, q, sc); rocks.setMatrixAt(k, m); });
    rocks.castShadow = true; W.add(rocks);

    S.dioramas = locs.map((l) => { const d = buildDiorama(l); d.group.position.set(l.x, HSTEP, l.z); W.add(d.group); return d; });

    // Locals: two per location, with a real state machine on the same nav grid.
    S.critters = [];
    const bodyGeo = new THREE.IcosahedronGeometry(0.28, 0).scale(1, 0.8, 1).translate(0, 0.22, 0), eyeGeo = new THREE.SphereGeometry(0.06, 5, 4), eyeM = new THREE.MeshBasicMaterial({ color: '#f4fff8' });
    locs.forEach((l, li) => {
      if (l.kind === 'uncharted') return;
      for (let k = 0; k < 2; k++) {
        const t = nearestWalkable(g, l.x + (k ? 6 : -6), l.z + (li % 2 ? 4 : -4)); if (!t) continue;
        const o = new THREE.Group(), body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(l.accent).lerp(new THREE.Color('#22352c'), 0.45), flatShading: true })); body.castShadow = true;
        const e1 = new THREE.Mesh(eyeGeo, eyeM), e2 = new THREE.Mesh(eyeGeo, eyeM); e1.position.set(0.1, 0.32, 0.22); e2.position.set(-0.1, 0.32, 0.22); o.add(body, e1, e2); W.add(o);
        const label = document.createElement('div'); label.className = 'world-ai-tag'; label.hidden = true; labelsEl.appendChild(label);
        S.critters.push({ o, x: t.x, z: t.z, y: tileY(t.x, t.z), state: 'IDLE', timer: 1 + Math.random() * 3, path: [], pi: 0, yaw: Math.random() * 6, home: { x: l.x, z: l.z }, label, seed: Math.random() * 9 });
      }
    });

    buildLabels(); buildNavOverlay(); buildColliderOverlay(); renderMinimapBase();
    if (!g.walk[g.idx(Math.round(S.player.x), Math.round(S.player.z))]) { const t = nearestWalkable(g, S.player.x, S.player.z); if (t) { S.player.x = t.x; S.player.z = t.z; } }
    applyInstanceColors();
    on.world(S.locs, g);
  }

  function buildLabels() {
    labelsEl.querySelectorAll('.world-label').forEach((n) => n.remove());
    labels = S.locs.map((l) => {
      const b = document.createElement(l.kind === 'uncharted' ? 'div' : 'button');
      b.className = 'world-label' + (l.kind === 'uncharted' ? ' is-uncharted' : '');
      b.style.setProperty('--acc', l.accent);
      const eye = document.createElement('span'); eye.className = 'wl-eye'; eye.textContent = l.eyebrow;
      const title = document.createElement('span'); title.className = 'wl-title'; title.textContent = l.title;
      b.append(eye, title);
      if (b instanceof HTMLButtonElement) { b.type = 'button'; b.addEventListener('click', (ev) => { ev.stopPropagation(); on.open(l); }); }
      labelsEl.appendChild(b); return { el: b, loc: l };
    });
  }

  function buildNavOverlay() {
    ovl.nav.children.slice().forEach((o) => { ovl.nav.remove(o); const m = o as THREE.Mesh; m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
    const g = S.grid;
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.8, 0.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.42, depthWrite: false }), cells.length);
    const m = new THREE.Matrix4(), ok = new THREE.Color('#37e08f'), no = new THREE.Color('#ff4d5e');
    cells.forEach(({ x, z, i }, k) => { m.makeTranslation(x, g.h[i] * HSTEP + 0.03, z); mesh.setMatrixAt(k, m); mesh.setColorAt(k, g.walk[i] ? ok : no); });
    mesh.frustumCulled = false; ovl.nav.add(mesh);
  }
  function buildColliderOverlay() {
    ovl.col.children.slice().forEach((o) => { if (o !== playerCap) { ovl.col.remove(o); const m = o as THREE.LineSegments; m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
    const g = S.grid, v: number[] = [];
    const addBox = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) => {
      const a = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
      for (let i = 0; i < 4; i++) { const [ax, az] = a[i], [bx, bz] = a[(i + 1) % 4]; v.push(ax, y0, az, bx, y0, bz, ax, y1, az, bx, y1, bz, ax, y0, az, ax, y1, az); }
    };
    for (const c of g.colliders) addBox(c.x0 - 0.5, c.x1 + 0.5, c.z0 - 0.5, c.z1 + 0.5, HSTEP, HSTEP + c.y);
    for (const t of g.trees) addBox(t.x - 0.4, t.x + 0.4, t.z - 0.4, t.z + 0.4, t.y, t.y + 2.2 * t.s);
    for (const t of g.rocks) addBox(t.x - 0.4, t.x + 0.4, t.z - 0.4, t.z + 0.4, t.y, t.y + 0.7);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#ffe36e', transparent: true, opacity: 0.55 })); lines.frustumCulled = false; ovl.col.add(lines);
  }
  function drawExplored(list: number[]) {
    const g = S.grid, m = new THREE.Matrix4(), n = Math.min(EX, list.length);
    for (let k = 0; k < n; k++) { const i = list[k], cx = i % g.w, cz = (i - cx) / g.w; m.makeTranslation(cx + g.minX, g.h[i] * HSTEP + 0.05, cz + g.minZ); exploredMesh.setMatrixAt(k, m); }
    exploredMesh.count = n; exploredMesh.instanceMatrix.needsUpdate = true; exploredFade = 1;
  }
  function updatePathLine() {
    const p = S.player, pts: THREE.Vector3[] = [new THREE.Vector3(p.x, p.y + 0.12, p.z)];
    for (let i = p.pi; i < p.path.length; i++) pts.push(new THREE.Vector3(p.path[i].x, tileY(p.path[i].x, p.path[i].z) + 0.12, p.path[i].z));
    const a = pathLine.geometry.attributes.position as THREE.BufferAttribute, n = Math.min(pts.length, a.count);
    for (let i = 0; i < n; i++) a.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
    a.needsUpdate = true; pathLine.geometry.setDrawRange(0, n); pathLine.visible = n > 1;
  }

  // ── Movement ───────────────────────────────────────────
  function walkTo(x: number, z: number, o: { onArrive?: () => void; silent?: boolean } = {}): boolean {
    const g = S.grid, target = nearestWalkable(g, x, z); if (!target) return false;
    const start = nearestWalkable(g, S.player.x, S.player.z); if (!start) return false;
    const r = bfs(g, start.x, start.z, target.x, target.z);
    if (!r.path) return false;
    S.lastBfs = { n: r.explored.length, ms: r.ms, len: r.path.length };
    if (S.dev) drawExplored(r.explored);
    S.player.path = smoothPath(g, r.path); S.player.pi = 0; S.player.onArrive = o.onArrive ?? null;
    S.cam.pan.set(0, 0);
    marker.visible = !o.silent && S.view === 'beauty'; marker.position.set(target.x, tileY(target.x, target.z) + 0.04, target.z); marker.userData.t = 0;
    return true;
  }
  const canStand = (x: number, z: number): boolean => { const g = S.grid, r = 0.22; for (const [ox, oz] of [[r, r], [-r, r], [r, -r], [-r, -r]]) { const i = g.idx(Math.round(x + ox), Math.round(z + oz)); if (i < 0 || !g.walk[i]) return false; } return true; };
  const keys = new Set<string>();
  function stepPlayer(dt: number) {
    const p = S.player;
    let ix = 0, iz = 0;
    if (!S.inputLocked) { if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1; }
    let moved = false, vx = 0, vz = 0;
    if (ix || iz) {
      p.path = []; p.pi = 0; marker.visible = false; p.onArrive = null;
      const L = Math.hypot(ix, iz); vx = (ix / L) * p.speed; vz = (iz / L) * p.speed;
      const nx = p.x + vx * dt, nz = p.z + vz * dt, curH = S.grid.h[S.grid.idx(Math.round(p.x), Math.round(p.z))];
      const okH = (x: number, z: number) => { const i = S.grid.idx(Math.round(x), Math.round(z)); return i >= 0 && Math.abs(S.grid.h[i] - curH) <= 1; };
      if (canStand(nx, p.z) && okH(nx, p.z)) p.x = nx; else vx = 0;
      if (canStand(p.x, nz) && okH(p.x, nz)) p.z = nz; else vz = 0;
      moved = !!(vx || vz);
      S.cam.pan.multiplyScalar(0.9);
    } else if (p.pi < p.path.length) {
      const t = p.path[p.pi], dx = t.x - p.x, dz = t.z - p.z, dd = Math.hypot(dx, dz), st = p.speed * dt;
      if (dd <= st) { p.x = t.x; p.z = t.z; p.pi++; if (p.pi >= p.path.length) { marker.visible = false; const f = p.onArrive; p.onArrive = null; f?.(); } }
      else { vx = (dx / dd) * p.speed; vz = (dz / dd) * p.speed; p.x += vx * dt; p.z += vz * dt; }
      moved = true;
    }
    if (moved && (vx || vz)) { let dy = Math.atan2(vx, vz) - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * Math.min(1, dt * 14); }
    const ty = tileY(p.x, p.z); p.y += (ty - p.y) * Math.min(1, dt * 12);
    const bob = moved && S.motion ? Math.abs(Math.sin(S.time * 11)) * 0.09 : 0;
    player.position.set(p.x, p.y + bob, p.z); player.rotation.y = p.yaw; player.rotation.z = moved && S.motion ? Math.sin(S.time * 11) * 0.05 : 0;
    p.moving = moved;
    const tile = `${Math.round(p.x)},${Math.round(p.z)}`; if (moved && tile !== p.tile) { p.tile = tile; sfx.step(); }
    let near: Location | null = null, best = Infinity;
    for (const l of S.locs) { const f = FOOTPRINT[l.kind] + 3.6, dd = Math.hypot(l.x - p.x, l.z - p.z); if (dd < f && dd < best && l.kind !== 'uncharted') { near = l; best = dd; } }
    if (near !== S.near) { S.near = near; on.near(near); if (near) sfx.arrive(); }
  }
  function stepCritters(dt: number) {
    const g = S.grid, p = S.player;
    for (const c of S.critters) {
      const dist = Math.hypot(c.x - p.x, c.z - p.z);
      if (dist < 2.6 && c.state !== 'FLEE') {
        c.state = 'FLEE'; const ax = c.x - p.x, az = c.z - p.z, L = Math.hypot(ax, az) || 1;
        const t = nearestWalkable(g, c.x + (ax / L) * 6, c.z + (az / L) * 6, 6), s = nearestWalkable(g, c.x, c.z, 3);
        if (t && s) { c.path = bfs(g, s.x, s.z, t.x, t.z).path ?? []; c.pi = 0; } c.timer = 2;
      } else if (dist < 5.5 && c.state !== 'FLEE' && c.state !== 'ALERT') { c.state = 'ALERT'; c.path = []; c.timer = 1.4; }
      c.timer -= dt;
      if (c.state === 'ALERT') { c.yaw = Math.atan2(p.x - c.x, p.z - c.z); if (dist > 6.5 || c.timer < -2) { c.state = 'IDLE'; c.timer = 1; } }
      else if (c.state === 'IDLE' && c.timer <= 0) {
        const t = nearestWalkable(g, c.home.x + (Math.random() - 0.5) * 16, c.home.z + (Math.random() - 0.5) * 16, 6), s = nearestWalkable(g, c.x, c.z, 3);
        const path = t && s ? bfs(g, s.x, s.z, t.x, t.z).path : null;
        if (path && path.length < 26) { c.path = path; c.pi = 0; c.state = 'WANDER'; } else c.timer = 1;
      }
      if ((c.state === 'WANDER' || c.state === 'FLEE') && c.pi < c.path.length) {
        const t = c.path[c.pi], dx = t.x - c.x, dz = t.z - c.z, dd = Math.hypot(dx, dz), sp = (c.state === 'FLEE' ? 5.4 : 1.9) * dt;
        if (dd <= sp) { c.x = t.x; c.z = t.z; c.pi++; } else { c.x += (dx / dd) * sp; c.z += (dz / dd) * sp; c.yaw = Math.atan2(dx, dz); }
      } else if ((c.state === 'WANDER' || c.state === 'FLEE') && c.timer <= 0) { c.state = 'IDLE'; c.timer = 1.5 + Math.random() * 3.5; }
      c.y += (tileY(c.x, c.z) - c.y) * Math.min(1, dt * 10);
      const hop = c.state !== 'IDLE' ? Math.abs(Math.sin(S.time * (c.state === 'FLEE' ? 16 : 8) + c.seed)) * 0.16 : 0;
      c.o.position.set(c.x, c.y + hop, c.z); c.o.rotation.y = c.yaw;
    }
  }

  // ── Lighting ───────────────────────────────────────────
  const ld = new THREE.Vector3();
  function applyLight() {
    const h = S.hourOverride ?? poznanHour(); S.hour = h;
    const s = sample(h); lightDir(h, ld);
    sun.color.copy(s.sun); sun.intensity = s.si; hemi.color.copy(s.sky); hemi.groundColor.copy(s.gnd); hemi.intensity = s.hi;
    if (S.view === 'clay') { sun.color.set('#ffffff'); sun.intensity = 2.2; hemi.color.set('#e6e6e0'); hemi.groundColor.set('#55554f'); hemi.intensity = 1.1; }
    fog.color.copy(s.fog); (water.material as THREE.MeshStandardMaterial).color.copy(s.water);
    const isBeauty = S.view === 'beauty';
    scene.background = isBeauty ? s.fog : new THREE.Color(S.view === 'wireframe' ? '#050a08' : S.view === 'depth' ? '#000' : '#111614');
    fog.near = isBeauty ? 58 * S.cam.zoom : 5000; fog.far = isBeauty ? 135 * S.cam.zoom : 6000;
    lantern.intensity = S.view === 'clay' ? 0 : s.night * 15; lanternGlow.material.opacity = s.night * 0.32;
    fireflies.material.opacity = 0.15 + s.night * 0.8; fireflies.material.color.set(s.night > 0.4 ? '#d8ffb0' : '#fff6d0');
    world?.traverse((o) => { if ((o as THREE.Sprite).isSprite && o.userData.glow != null && !o.userData.blink) (o as THREE.Sprite).material.opacity = o.userData.glow * (0.22 + s.night * 0.78); });
    S.night = s.night;
  }

  // ── Camera ─────────────────────────────────────────────
  const camDir = new THREE.Vector3(0, 1, 0.92).normalize();
  function stepCamera(dt: number) {
    const c = S.cam, p = S.player;
    c.zoom += (c.zoomT - c.zoom) * Math.min(1, dt * 6);
    let tx = p.x + c.pan.x + c.shift.x, tz = p.z + c.pan.y + c.shift.y;
    const a = S.time * 0.05;
    if (c.intro) { tx = Math.cos(a) * 6; tz = Math.sin(a) * 6 + 4; }
    c.focus.x += (tx - c.focus.x) * Math.min(1, dt * 3.6); c.focus.z += (tz - c.focus.z) * Math.min(1, dt * 3.6); c.focus.y += (p.y - c.focus.y) * Math.min(1, dt * 3);
    const dist = 62 * c.zoom * (c.intro ? 1.35 : 1);
    if (c.intro) camera.position.set(c.focus.x + Math.sin(a) * dist * 0.2, c.focus.y + camDir.y * dist, c.focus.z + camDir.z * dist);
    else camera.position.set(c.focus.x, c.focus.y + camDir.y * dist * 0.83, c.focus.z + camDir.z * dist * 0.83);
    camera.lookAt(c.focus);
    sun.position.copy(c.focus).addScaledVector(ld, 90); sun.target.position.copy(c.focus);
  }
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  // ── Labels and tags ────────────────────────────────────
  const v3 = new THREE.Vector3();
  function project(x: number, y: number, z: number) { v3.set(x, y, z).project(camera); const w = canvas.clientWidth, h = canvas.clientHeight; return { x: ((v3.x + 1) / 2) * w, y: ((1 - v3.y) / 2) * h, w, h }; }
  function updateLabels() {
    for (const { el, loc } of labels) {
      const q = project(loc.x, HSTEP + (loc.kind === 'mast' ? 7 : 4.2), loc.z);
      const dd = Math.hypot(loc.x - S.cam.focus.x, loc.z - S.cam.focus.z);
      const vis = q.x > -120 && q.x < q.w + 120 && q.y > -60 && q.y < q.h + 60;
      el.hidden = !vis || S.cam.intro;
      if (!el.hidden) {
        el.style.opacity = String(Math.max(0.5, Math.min(1, 1.4 - dd / 60)));
        el.style.transform = `translate(-50%,-100%) translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;
        el.classList.toggle('is-near', S.near === loc);
      }
    }
    const aiOn = S.dev && S.overlays.ai;
    for (const c of S.critters) {
      c.label.hidden = !aiOn; if (!aiOn) continue;
      const q = project(c.x, c.y + 0.9, c.z); c.label.textContent = c.state; c.label.dataset.s = c.state;
      c.label.style.transform = `translate(-50%,-100%) translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;
    }
  }

  // ── Minimap ────────────────────────────────────────────
  const mini: { canvas: HTMLCanvasElement | null; base: HTMLCanvasElement | null; scale: number; ox: number; oz: number } = { canvas: null, base: null, scale: 1, ox: 0, oz: 0 };
  function renderMinimapBase() {
    if (!mini.canvas || !S.grid) return;
    const g = S.grid, W = mini.canvas.width, H = mini.canvas.height, base = document.createElement('canvas'); base.width = W; base.height = H;
    const x = base.getContext('2d')!; mini.scale = Math.min(W / g.w, H / g.d); const s = mini.scale; mini.ox = (W - g.w * s) / 2; mini.oz = (H - g.d * s) / 2;
    const col: Record<number, string> = { [T.GRASS]: '#1d3a2b', [T.PATH]: '#a8946a', [T.PAD]: '#54645a', [T.SAND]: '#2d3b2d', [T.ROCK]: '#34403b', [T.FOG]: '#31423b' };
    for (let z = 0; z < g.d; z++) for (let c = 0; c < g.w; c++) { const t = g.type[c + z * g.w]; if (t === T.WATER) continue; x.fillStyle = col[t]; x.fillRect(mini.ox + c * s, mini.oz + z * s, Math.ceil(s), Math.ceil(s)); }
    mini.base = base;
  }
  function drawMinimap() {
    if (!mini.canvas || !mini.base) return;
    const x = mini.canvas.getContext('2d')!, g = S.grid, s = mini.scale;
    x.clearRect(0, 0, mini.canvas.width, mini.canvas.height); x.drawImage(mini.base, 0, 0);
    const X = (wx: number) => mini.ox + (wx - g.minX + 0.5) * s, Z = (wz: number) => mini.oz + (wz - g.minZ + 0.5) * s;
    for (const l of S.locs) {
      const r = l.kind === 'uncharted' ? 3 : 5; x.globalAlpha = l.kind === 'uncharted' ? 0.65 : 1;
      x.beginPath(); x.rect(X(l.x) - r, Z(l.z) - r, r * 2, r * 2);
      if (l.kind === 'uncharted') { x.strokeStyle = l.accent; x.lineWidth = 2; x.stroke(); } else { x.fillStyle = l.accent; x.fill(); }
      x.globalAlpha = 1;
    }
    const p = S.player; x.save(); x.translate(X(p.x), Z(p.z)); x.rotate(Math.PI - p.yaw); x.fillStyle = '#fff'; x.strokeStyle = '#0b1a14'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, -9); x.lineTo(6, 7); x.lineTo(0, 3); x.lineTo(-6, 7); x.closePath(); x.stroke(); x.fill(); x.restore();
  }
  const minimapToWorld = (px: number, py: number) => ({ x: (px - mini.ox) / mini.scale + S.grid.minX - 0.5, z: (py - mini.oz) / mini.scale + S.grid.minZ - 0.5 });

  // ── Render passes and overlays ─────────────────────────
  function applyInstanceColors() {
    for (const o of instanced) {
      if (o.userData.colors === undefined) o.userData.colors = o.instanceColor;
      o.instanceColor = S.view === 'clay' || S.view === 'wireframe' || S.view === 'depth' ? null : o.userData.colors;
    }
  }
  function setView(v: View) {
    S.view = v;
    scene.overrideMaterial = overrides[v] ?? null;
    water.visible = v === 'beauty' || v === 'clay'; fireflies.visible = v === 'beauty'; marker.visible = marker.visible && v === 'beauty';
    world?.traverse((o) => { if ((o as THREE.Sprite).isSprite) o.visible = v === 'beauty'; }); lanternGlow.visible = v === 'beauty';
    if (v === 'depth') { camera.near = 40; camera.far = 120; } else { camera.near = 12; camera.far = 340; } camera.updateProjectionMatrix();
    renderer.toneMapping = v === 'beauty' || v === 'clay' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    applyInstanceColors(); applyLight(); on.view(v);
  }
  function setDev(v: boolean) { S.dev = v; if (!v) setView('beauty'); syncOverlays(); }
  function setOverlay(k: OverlayKey, v: boolean) { S.overlays[k] = v; syncOverlays(); }
  function syncOverlays() { ovl.nav.visible = S.dev && S.overlays.nav; ovl.col.visible = S.dev && S.overlays.colliders; ovl.path.visible = S.dev && S.overlays.path; }
  syncOverlays();

  // ── Input ──────────────────────────────────────────────
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pointers = new Map<number, { x: number; y: number }>(); let dragging = false, downAt: { x: number; y: number } | null = null, pinch = 0;
  const ac = new AbortController(), sig = ac.signal;
  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 1) { downAt = { x: e.clientX, y: e.clientY }; dragging = false; }
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); dragging = true; }
  }, { signal: sig });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId); if (!prev) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) S.cam.zoomT = Math.max(0.55, Math.min(1.7, (S.cam.zoomT * pinch) / d)); pinch = d; return; }
    if (!dragging && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 7) dragging = true;
    if (dragging) { const k = 0.075 * S.cam.zoom * (900 / canvas.clientHeight); S.cam.pan.x -= dx * k; S.cam.pan.y -= dy * k * 1.35; S.cam.pan.clampScalar(-40, 40); canvas.classList.add('is-drag'); }
  }, { signal: sig });
  const up = (e: PointerEvent) => {
    const was = pointers.delete(e.pointerId); canvas.classList.remove('is-drag');
    if (!was || pointers.size) return;
    if (!dragging && downAt && !S.cam.intro && !S.inputLocked) pick(e.clientX, e.clientY);
    downAt = null; dragging = false;
  };
  canvas.addEventListener('pointerup', up, { signal: sig });
  canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); downAt = null; dragging = false; }, { signal: sig });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); S.cam.zoomT = Math.max(0.55, Math.min(1.7, S.cam.zoomT * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false, signal: sig });
  function pick(cx: number, cy: number) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera);
    if (!tiles) return;
    const hit = ray.intersectObject(tiles, false)[0]; if (!hit || hit.instanceId === undefined) return;
    const cell = cells[hit.instanceId]; if (!cell) return;
    walkTo(cell.x, cell.z); sfx.ui();
  }
  const MOVE_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
  addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || S.inputLocked || !MOVE_KEYS.includes(e.code)) return;
    keys.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault();
  }, { signal: sig });
  addEventListener('keyup', (e) => keys.delete(e.code), { signal: sig });
  addEventListener('blur', () => keys.clear(), { signal: sig });

  // Keep walking smooth on weaker machines: lower resolution first, then shadow detail.
  const perf = { t: 0, n: 0, pr: renderer.getPixelRatio(), low: false };
  function adaptQuality(dt: number) {
    if (S.skipRender) return;
    perf.t += dt; perf.n++;
    if (perf.t < 1.5) return;
    const avg = (perf.t / perf.n) * 1000; perf.t = 0; perf.n = 0;
    if (avg > 21 && perf.pr > 1) { perf.pr = Math.max(1, perf.pr - 0.25); renderer.setPixelRatio(perf.pr); }
    else if (avg > 24 && !perf.low) { perf.low = true; sun.shadow.mapSize.setScalar(1024); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  }

  // ── Frame loop ─────────────────────────────────────────
  const clock = new THREE.Clock(); let frameN = 0, running = true, raf = 0;
  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    tick(Math.min(0.05, clock.getDelta()));
  }
  function tick(dt: number) {
    S.time += dt; frameN++;
    S.ms += (dt * 1000 - S.ms) * 0.08; S.fps = 1000 / Math.max(1, S.ms);
    adaptQuality(dt);
    if (!S.cam.intro) stepPlayer(dt); else player.position.set(S.player.x, S.player.y, S.player.z);
    if (S.motion) stepCritters(dt); else for (const c of S.critters) c.o.position.set(c.x, c.y, c.z);
    if (S.motion) for (const d of S.dioramas) if (Math.hypot(d.loc.x - S.cam.focus.x, d.loc.z - S.cam.focus.z) < 62) d.update(S.time, dt);
    if (frameN % 20 === 1) applyLight();
    stepCamera(dt);
    for (let i = 0; i < FF; i++) { const a = ffSeed[i], t = S.motion ? S.time * 0.13 : 0, r = 8 + (a % 34); ffPos[i * 3] = S.cam.focus.x + Math.cos(a * 7 + t * (0.5 + (a % 1))) * r; ffPos[i * 3 + 1] = 1 + (a % 4) + Math.sin(t * 3 + a) * 0.5; ffPos[i * 3 + 2] = S.cam.focus.z + Math.sin(a * 11 + t) * r; }
    (ffGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    if (marker.visible) { marker.userData.t = (marker.userData.t ?? 0) + dt; marker.material.opacity = 0.5 + Math.sin(marker.userData.t * 6) * 0.4; marker.scale.setScalar(1 + Math.sin(marker.userData.t * 6) * 0.1); }
    if (S.dev) { playerCap.position.set(S.player.x, S.player.y + 0.6, S.player.z); updatePathLine(); exploredFade = Math.max(0, exploredFade - dt * 0.55); exploredMesh.material.opacity = exploredFade * 0.5; }
    if (!S.skipRender) { renderer.info.reset(); renderer.clear(); renderer.render(scene, camera); if (S.dev) renderer.render(overlay, camera); }
    updateLabels();
    if (frameN % 4 === 0) drawMinimap();
    on.frame(S);
  }

  build(); applyLight(); setView('beauty'); frame();

  return {
    S, VIEWS,
    setView, setDev, setOverlay, walkTo, minimapToWorld,
    attachMinimap(cv: HTMLCanvasElement) { mini.canvas = cv; renderMinimapBase(); },
    start() { S.cam.intro = false; },
    goTo(loc: Location, onArrive?: () => void) { const t = nearestWalkable(S.grid, loc.x, loc.z + FOOTPRINT[loc.kind] + 1.5); if (t) walkTo(t.x, t.z, { onArrive, silent: true }); },
    setHourOverride(h: number | null) { S.hourOverride = h; applyLight(); },
    setMotion(v: boolean) { S.motion = v; },
    setLocked(v: boolean) { S.inputLocked = v; if (v) keys.clear(); },
    setShift(x: number, z: number) { S.cam.shift.set(x, z); },
    addProject(p: ProjectSeed) { S.projects.push(p); build(); setView(S.view); },
    resetProjects(list: ProjectSeed[]) { S.projects = [...list]; build(); setView(S.view); },
    info: () => renderer.info.render,
    quality: () => perf,
    locOf: (id: string) => S.locs.find((l) => l.id === id),
    /** Test hook: advance fixed frames without rendering the intermediate ones. */
    stepFrames(n: number, dt = 1 / 30) { const r = running; running = false; cancelAnimationFrame(raf); for (let i = 0; i < n; i++) { S.skipRender = i < n - 1; tick(dt); } S.skipRender = false; running = r; if (r) frame(); },
    pause(v: boolean) { const was = running; running = !v; if (running && !was) { clock.getDelta(); frame(); } else if (!running) cancelAnimationFrame(raf); },
    dispose() { running = false; cancelAnimationFrame(raf); ac.abort(); ro.disconnect(); renderer.dispose(); S.critters.forEach((c) => c.label.remove()); labels.forEach((l) => l.el.remove()); },
  };
}
export type Engine = ReturnType<typeof createEngine>;
