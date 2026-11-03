import { describe, expect, it } from 'vitest';
import { buildLayout, generate, bfs, nearestWalkable, slotPos, smoothPath, FOOTPRINT, type LandmarkSeed, type ProjectSeed } from '../src/world/gen';

const landmarks: LandmarkSeed[] = [
  { id: 'station', title: 'Field Station', kind: 'station', accent: '#fff', eyebrow: 'About' },
  { id: 'lab', title: 'The Lab', kind: 'lab', accent: '#fff', eyebrow: 'Lab', slot: 4 },
  { id: 'guild', title: 'Guild Hall', kind: 'guild', accent: '#fff', eyebrow: 'Team', slot: 5 },
  { id: 'mast', title: 'Radio Mast', kind: 'mast', accent: '#fff', eyebrow: 'Contact', slot: 6 },
];
const project = (id: string, kind: ProjectSeed['kind'] = 'generic'): ProjectSeed => ({ id, title: id, kind, accent: '#fff', eyebrow: 'x' });
const four = [project('a', 'arena'), project('b', 'board'), project('c', 'dungeon'), project('d', 'archive')];
const now = () => 0;

describe('layout', () => {
  it('puts the hub at the centre and every other location on its own slot', () => {
    const locs = buildLayout(four, landmarks);
    expect(locs[0]).toMatchObject({ id: 'station', x: 0, z: 0, slot: -1 });
    const slots = locs.slice(1).map((l) => l.slot);
    expect(new Set(slots).size).toBe(slots.length);
    expect(locs.at(-1)?.kind).toBe('uncharted');
  });
  it('keeps projects off the reserved landmark slots', () => {
    const locs = buildLayout(four, landmarks);
    const byId = Object.fromEntries(locs.map((l) => [l.id, l.slot]));
    expect([byId.a, byId.b, byId.c, byId.d]).toEqual([0, 1, 2, 3]);
    expect([byId.lab, byId.guild, byId.mast]).toEqual([4, 5, 6]);
  });
  it('never moves an existing location when projects are added', () => {
    const before = buildLayout(four, landmarks);
    const more = [...four, ...Array.from({ length: 12 }, (_, i) => project(`t${i}`))];
    const after = buildLayout(more, landmarks);
    for (const l of before) {
      if (l.kind === 'uncharted') continue;
      expect(after.find((x) => x.id === l.id)).toMatchObject({ x: l.x, z: l.z });
    }
    expect(after.filter((l) => l.kind === 'uncharted')).toHaveLength(1);
  });
  it('spaces locations at least twelve tiles apart', () => {
    const locs = buildLayout([...four, ...Array.from({ length: 12 }, (_, i) => project(`t${i}`))], landmarks);
    for (const a of locs) for (const b of locs) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(12);
  });
  it('slot positions are deterministic', () => {
    expect(slotPos(3)).toEqual(slotPos(3));
    expect(slotPos(0)).not.toEqual(slotPos(1));
  });
});

describe('world', () => {
  const locs = buildLayout(four, landmarks);
  const g = generate(locs);
  it('connects every location to an earlier one', () => {
    expect(g.edges).toHaveLength(locs.length - 1);
    for (const l of locs.slice(1)) expect(locs.findIndex((x) => x.id === l.parent)).toBeLessThan(locs.indexOf(l));
  });
  it('blocks the footprint under every diorama', () => {
    for (const l of locs) {
      if (!FOOTPRINT[l.kind]) continue;
      expect(g.walk[g.idx(l.x, l.z)]).toBe(0);
    }
  });
  it('makes every location reachable from the hub by BFS', () => {
    const from = nearestWalkable(g, 0, FOOTPRINT.station + 2)!;
    for (const l of locs) {
      const to = nearestWalkable(g, l.x, l.z + FOOTPRINT[l.kind] + 2)!;
      const r = bfs(g, from.x, from.z, to.x, to.z, now);
      expect(r.path, `${l.id} unreachable`).not.toBeNull();
      expect(r.path!.length).toBeGreaterThan(0);
    }
  });
  it('returns no path to water and explores before giving up', () => {
    const r = bfs(g, 0, 4, g.minX, g.minZ, now);
    expect(r.path).toBeNull();
  });
  it('smooths a path without leaving walkable tiles', () => {
    const from = nearestWalkable(g, 0, 4)!, to = nearestWalkable(g, locs[1].x, locs[1].z + 4)!;
    const r = bfs(g, from.x, from.z, to.x, to.z, now);
    const s = smoothPath(g, r.path!);
    expect(s.length).toBeLessThanOrEqual(r.path!.length);
    expect(s[0]).toEqual(r.path![0]);
    expect(s.at(-1)).toEqual(r.path!.at(-1));
    for (const p of s) expect(g.walk[g.idx(p.x, p.z)]).toBe(1);
  });
  it('counts land and walkable tiles consistently', () => {
    let walk = 0; for (let i = 0; i < g.n; i++) walk += g.walk[i];
    expect(walk).toBe(g.walkable);
    expect(g.walkable).toBeLessThan(g.land);
  });
});
