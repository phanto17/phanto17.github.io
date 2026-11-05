import { describe, expect, it } from 'vitest';
import { minimap, runs } from '../src/lib/minimap';
import { buildLayout, generate, T, type LandmarkSeed, type ProjectSeed } from '../src/world/gen';

const landmarks: LandmarkSeed[] = [
  { id: 'station', title: 'Field Station', kind: 'station', accent: '#fff', eyebrow: 'About' },
  { id: 'lab', title: 'The Lab', kind: 'lab', accent: '#fff', eyebrow: 'Lab', slot: 4 },
  { id: 'guild', title: 'Guild Hall', kind: 'guild', accent: '#fff', eyebrow: 'Team', slot: 5 },
  { id: 'mast', title: 'Radio Mast', kind: 'mast', accent: '#fff', eyebrow: 'Contact', slot: 6 },
];
const project = (id: string, kind: ProjectSeed['kind'] = 'generic'): ProjectSeed => ({ id, title: id, kind, accent: '#123456', eyebrow: 'x' });
const four = [project('a', 'arena'), project('b', 'board'), project('c', 'dungeon'), project('d', 'archive')];

/** Tile area of a runs() path: the sum of its `h` lengths (each run is one tile deep). */
const area = (d: string) => [...d.matchAll(/h(\d+)v1/g)].reduce((n, m) => n + Number(m[1]), 0);

describe('the projects index minimap', () => {
  it('draws exactly the land and path tiles the 3D map generates', () => {
    const g = generate(buildLayout(four, landmarks));
    const map = minimap(four, landmarks);
    expect([map.w, map.d]).toEqual([g.w, g.d]);
    expect(area(map.land)).toBe(Array.from(g.type).filter((t) => t !== T.WATER).length);
    expect(area(map.path)).toBe(Array.from(g.type).filter((t) => t === T.PATH || t === T.PAD).length);
  });

  it('places every location, the uncharted slot included, inside the map', () => {
    const map = minimap(four, landmarks);
    expect(map.places.map((p) => p.id).sort()).toEqual(['a', 'b', 'c', 'd', 'guild', 'lab', 'mast', 'station', 'uncharted']);
    for (const p of map.places) {
      expect(p.left, p.id).toBeGreaterThan(0);
      expect(p.left, p.id).toBeLessThan(100);
      expect(p.top, p.id).toBeGreaterThan(0);
      expect(p.top, p.id).toBeLessThan(100);
    }
    expect(map.places.find((p) => p.id === 'a')).toMatchObject({ type: 'project', accent: '#123456' });
    // Labels point toward the middle, so the ones on the east side sit left of their diamond.
    for (const p of map.places) expect(p.label, p.id).toBe(p.left > 55 ? 'left' : 'right');
  });

  it('merges a row of tiles into one run', () => {
    const type = Uint8Array.from([T.WATER, T.GRASS, T.GRASS, T.WATER, T.PATH]);
    expect(runs({ w: 5, d: 1, type }, (t) => t !== T.WATER)).toBe('M1 0h2v1h-2zM4 0h1v1h-1z');
  });
});
