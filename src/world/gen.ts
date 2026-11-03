/**
 * World generation: pure functions from the location list to a tile grid, with no rendering and no
 * DOM, so the layout rules are unit-tested (tests/world-gen.test.ts).
 *
 * The map is generated from data: every location gets a fixed slot on a sunflower spiral, so adding
 * a project never moves an existing one; paths connect each location to its nearest earlier one, so
 * a new project only adds path. Everything else (islands, hills, trees, the nav grid) follows.
 */

export const HSTEP = 0.5;
export const T = { WATER: 0, GRASS: 1, PATH: 2, PAD: 3, SAND: 4, ROCK: 5, FOG: 6 } as const;
export type TileType = (typeof T)[keyof typeof T];

/** The diorama drawn at a project location; `generic` needs no custom code. */
export type ProjectKind = 'arena' | 'board' | 'dungeon' | 'archive' | 'generic';
export type LandmarkKind = 'station' | 'lab' | 'guild' | 'mast';
export type Kind = ProjectKind | LandmarkKind | 'uncharted';

/** Half-size, in tiles, of the blocked footprint under each diorama. */
export const FOOTPRINT: Readonly<Record<Kind, number>> = {
  arena: 1, board: 3, dungeon: 3, archive: 2, generic: 1, station: 2, lab: 2, guild: 2, mast: 1, uncharted: 0,
};

export interface ProjectSeed {
  id: string;
  title: string;
  kind: ProjectKind;
  accent: string;
  eyebrow: string;
}
export interface LandmarkSeed {
  id: string;
  title: string;
  kind: LandmarkKind;
  accent: string;
  eyebrow: string;
  /** Reserved spiral slot; the hub (no slot) is always the centre. */
  slot?: number;
}
export interface Location {
  id: string;
  title: string;
  kind: Kind;
  accent: string;
  eyebrow: string;
  type: 'project' | 'landmark' | 'uncharted';
  slot: number;
  x: number;
  z: number;
  parent?: string;
}

const hash = (x: number, z: number): number => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number): number => t * t * (3 - 2 * t);
function vnoise(x: number, z: number): number {
  const xi = Math.floor(x), zi = Math.floor(z), xf = smooth(x - xi), zf = smooth(z - zi);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  const top = a + (b - a) * xf;
  return top + (c + (d - c) * xf - top) * zf;
}
export const fbm = (x: number, z: number): number => vnoise(x * 0.09, z * 0.09) * 0.65 + vnoise(x * 0.23 + 9, z * 0.23 + 4) * 0.35;

/** Sunflower spiral: slot `i` always lands on the same tile, however many slots exist. */
export function slotPos(i: number): { x: number; z: number } {
  const a = i * 2.399963 + 1.1, r = 14.5 * Math.sqrt(i + 1.6);
  return { x: Math.round(Math.cos(a) * r), z: Math.round(Math.sin(a) * r * 0.86) };
}

export function buildLayout(projects: readonly ProjectSeed[], landmarks: readonly LandmarkSeed[]): Location[] {
  const reserved = new Set(landmarks.filter((l) => l.slot != null).map((l) => l.slot as number));
  const locs: Location[] = [];
  for (const l of landmarks) {
    const pos = l.slot == null ? { x: 0, z: 0 } : slotPos(l.slot);
    locs.push({ ...l, type: 'landmark', slot: l.slot ?? -1, ...pos });
  }
  let s = 0;
  for (const p of projects) {
    while (reserved.has(s)) s++;
    locs.push({ ...p, type: 'project', slot: s, ...slotPos(s) });
    s++;
  }
  while (reserved.has(s)) s++;
  locs.push({ id: 'uncharted', title: 'Uncharted', kind: 'uncharted', type: 'uncharted', accent: '#8fb5a6', eyebrow: 'Next project lands here', slot: s, ...slotPos(s) });
  return locs.sort((a, b) => a.slot - b.slot);
}

export interface Tree { x: number; z: number; y: number; s: number; r: number }
export interface Collider { x0: number; x1: number; z0: number; z1: number; y: number }
export interface Grid {
  minX: number; maxX: number; minZ: number; maxZ: number; w: number; d: number; n: number;
  idx(x: number, z: number): number;
  type: Uint8Array; h: Int8Array; blocked: Uint8Array; walk: Uint8Array; dist: Int16Array;
  trees: Tree[]; rocks: Tree[]; colliders: Collider[]; edges: [Location, Location][];
  land: number; walkable: number;
}

const DIRS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function generate(locs: Location[]): Grid {
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
  for (const l of locs) { minX = Math.min(minX, l.x); maxX = Math.max(maxX, l.x); minZ = Math.min(minZ, l.z); maxZ = Math.max(maxZ, l.z); }
  const M = 15; minX -= M; maxX += M; minZ -= M; maxZ += M;
  const w = maxX - minX + 1, d = maxZ - minZ + 1, n = w * d;
  const idx = (x: number, z: number): number => (x < minX || x > maxX || z < minZ || z > maxZ ? -1 : x - minX + (z - minZ) * w);
  const type = new Uint8Array(n), h = new Int8Array(n), blocked = new Uint8Array(n), walk = new Uint8Array(n);
  const dist = new Int16Array(n).fill(-1);
  const edges: [Location, Location][] = [];
  const seeds: number[] = [];
  const mark = (x: number, z: number, t: TileType) => {
    const i = idx(x, z); if (i < 0) return;
    if (type[i] !== T.PAD && type[i] !== T.FOG) type[i] = t;
    if (dist[i] !== 0) { dist[i] = 0; seeds.push(i); }
  };

  // Paths: each location joins its nearest earlier one, so a new project only ever adds path.
  for (let k = 1; k < locs.length; k++) {
    const a = locs[k];
    let best = locs[0], bd = Infinity;
    for (let j = 0; j < k; j++) { const dd = (locs[j].x - a.x) ** 2 + (locs[j].z - a.z) ** 2; if (dd < bd) { bd = dd; best = locs[j]; } }
    a.parent = best.id; edges.push([best, a]);
    const len = Math.sqrt(bd), px = -(a.z - best.z) / len, pz = (a.x - best.x) / len, seed = hash(a.x, a.z) * 6.28;
    const steps = Math.ceil(len * 2);
    for (let t = 0; t <= steps; t++) {
      const u = t / steps, wob = Math.sin(u * Math.PI) * Math.sin(u * 6 + seed) * 3.2;
      const x = Math.round(best.x + (a.x - best.x) * u + px * wob), z = Math.round(best.z + (a.z - best.z) * u + pz * wob);
      for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) mark(x + ox, z + oz, T.PATH);
    }
  }
  // Pads under every location
  for (const l of locs) {
    const R = l.kind === 'uncharted' ? 4 : 6;
    for (let x = l.x - R; x <= l.x + R; x++) for (let z = l.z - R; z <= l.z + R; z++) {
      if ((x - l.x) ** 2 + (z - l.z) ** 2 > R * R + 2) continue;
      const i = idx(x, z); if (i < 0) continue;
      type[i] = l.kind === 'uncharted' ? T.FOG : T.PAD;
      if (dist[i] !== 0) { dist[i] = 0; seeds.push(i); }
    }
  }
  // Distance from the nearest path or pad (multi-source BFS): land hugs the paths, water fills the rest.
  for (let q = 0; q < seeds.length; q++) {
    const i = seeds[q], x = i % w, z = (i - x) / w;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= w || nz >= d) continue;
      const j = nx + nz * w; if (dist[j] < 0) { dist[j] = dist[i] + 1; seeds.push(j); }
    }
  }
  const trees: Tree[] = [], rocks: Tree[] = [];
  let land = 0;
  for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) {
    const i = idx(x, z), dd = dist[i], reach = 4 + fbm(x, z) * 9;
    if (type[i] === T.PAD || type[i] === T.PATH || type[i] === T.FOG) { h[i] = 1; land++; continue; }
    if (dd > reach) { type[i] = T.WATER; h[i] = 0; continue; }
    land++;
    const edge = reach - dd;
    if (edge < 1.1) { type[i] = T.SAND; h[i] = edge < 0.5 ? 0 : 1; continue; }
    const hill = Math.floor(Math.max(0, dd - 1.5) * 0.55 + fbm(x + 40, z - 17) * 2.4);
    const lim = Math.floor(edge * 0.9) + 1;
    h[i] = Math.min(1 + hill, lim, 6);
    type[i] = h[i] >= 4 ? T.ROCK : T.GRASS;
    const r = hash(x * 3.1, z * 1.7);
    if (dd >= 2 && h[i] <= 3 && type[i] === T.GRASS) {
      if (r < 0.08 + fbm(x - 70, z + 31) * 0.28) { trees.push({ x, z, y: h[i] * HSTEP, s: 0.75 + hash(x, z * 2) * 0.7, r: hash(z, x) }); blocked[i] = 1; }
      else if (r > 0.975) { rocks.push({ x, z, y: h[i] * HSTEP, s: 0.5 + hash(x * 2, z) * 0.5, r: hash(z * 3, x) }); blocked[i] = 1; }
    }
  }
  const colliders: Collider[] = [];
  for (const l of locs) {
    const f = FOOTPRINT[l.kind]; if (!f) continue;
    colliders.push({ x0: l.x - f, x1: l.x + f, z0: l.z - f, z1: l.z + f, y: 3.2 });
    for (let x = l.x - f; x <= l.x + f; x++) for (let z = l.z - f; z <= l.z + f; z++) { const i = idx(x, z); if (i >= 0) blocked[i] = 1; }
  }
  let walkable = 0;
  for (let i = 0; i < n; i++) { walk[i] = type[i] !== T.WATER && !blocked[i] && h[i] >= 1 && h[i] <= 3 ? 1 : 0; walkable += walk[i]; }
  const grid: Grid = { minX, maxX, minZ, maxZ, w, d, n, idx, type, h, blocked, walk, dist, trees, rocks, colliders, edges, land, walkable };
  // Only tiles reachable from the hub stay walkable: no islands you can see but never reach.
  const reach = floodFrom(grid, 0, FOOTPRINT.station + 2);
  for (let i = 0; i < n; i++) if (walk[i] && !reach[i]) { walk[i] = 0; walkable--; }
  grid.walkable = walkable;
  return grid;
}

function floodFrom(g: Grid, x: number, z: number): Uint8Array {
  const seen = new Uint8Array(g.n), q = [g.idx(x, z)]; seen[q[0]] = 1;
  for (let k = 0; k < q.length; k++) {
    const i = q[k], cx = i % g.w, cz = (i - cx) / g.w;
    for (const [dx, dz] of DIRS) {
      const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= g.w || nz >= g.d) continue;
      const j = nx + nz * g.w;
      if (!seen[j] && g.walk[j] && Math.abs(g.h[j] - g.h[i]) <= 1) { seen[j] = 1; q.push(j); }
    }
  }
  return seen;
}

export interface PathResult { path: { x: number; z: number }[] | null; explored: number[]; ms: number }

/** Breadth-first search on the nav grid; `explored` is what Dev Mode draws. Steps taller than one level are impassable. */
export function bfs(g: Grid, sx: number, sz: number, gx: number, gz: number, now: () => number = () => performance.now()): PathResult {
  const t0 = now();
  const start = g.idx(sx, sz), goal = g.idx(gx, gz);
  if (start < 0 || goal < 0 || !g.walk[goal]) return { path: null, explored: [], ms: 0 };
  const prev = new Int32Array(g.n).fill(-1), explored = [start], q = [start]; prev[start] = start;
  let found = start === goal;
  for (let k = 0; k < q.length && !found; k++) {
    const i = q[k], cx = i % g.w, cz = (i - cx) / g.w;
    for (const [dx, dz] of DIRS) {
      const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= g.w || nz >= g.d) continue;
      const j = nx + nz * g.w;
      if (prev[j] !== -1 || !g.walk[j] || Math.abs(g.h[j] - g.h[i]) > 1) continue;
      prev[j] = i; q.push(j); explored.push(j);
      if (j === goal) { found = true; break; }
    }
  }
  if (!found) return { path: null, explored, ms: now() - t0 };
  const path: { x: number; z: number }[] = [];
  for (let i = goal; ; i = prev[i]) { const cx = i % g.w; path.push({ x: cx + g.minX, z: (i - cx) / g.w + g.minZ }); if (i === start) break; }
  path.reverse();
  return { path, explored, ms: now() - t0 };
}

/** The closest walkable tile to a point, searched outward in square rings. */
export function nearestWalkable(g: Grid, x: number, z: number, maxR = 24): { x: number; z: number } | null {
  x = Math.round(x); z = Math.round(z);
  for (let r = 0; r <= maxR; r++) {
    let best: { x: number; z: number } | null = null, bd = Infinity;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const i = g.idx(x + dx, z + dz);
      if (i >= 0 && g.walk[i]) { const dd = dx * dx + dz * dz; if (dd < bd) { bd = dd; best = { x: x + dx, z: z + dz }; } }
    }
    if (best) return best;
  }
  return null;
}

/** Drop waypoints that sit on a clear straight line, so walking does not look grid-locked. */
export function smoothPath(g: Grid, path: { x: number; z: number }[]): { x: number; z: number }[] {
  if (path.length < 3) return path;
  const clear = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => {
    const L = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.ceil(L * 3);
    let ph = g.h[g.idx(a.x, a.z)];
    for (let s = 1; s <= steps; s++) {
      const u = s / steps, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u;
      for (const [ox, oz] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) {
        const i = g.idx(Math.round(x + ox), Math.round(z + oz));
        if (i < 0 || !g.walk[i] || Math.abs(g.h[i] - ph) > 1) return false;
      }
      ph = g.h[g.idx(Math.round(x), Math.round(z))];
    }
    return true;
  };
  const out = [path[0]];
  let a = 0;
  while (a < path.length - 1) { let b = path.length - 1; while (b > a + 1 && !clear(path[a], path[b])) b--; out.push(path[b]); a = b; }
  return out;
}
