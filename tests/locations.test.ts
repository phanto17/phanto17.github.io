import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLocations, LANDMARKS, NAV, toLandmarkSeed, toProjectSeed, type ProjectEntryLike, type ProjectLocation } from '../src/data/locations';
import { OVERVIEW } from '../src/data/site';
import { projectView } from '../src/lib/project-view';
import { buildLayout } from '../src/world/gen';

const entry = (id: string, order: number): ProjectEntryLike => ({
  id,
  data: { title: id.toUpperCase(), genre: `${id} genre`, order, world: { kind: 'generic', accent: '#123456' } },
});
const three = [entry('c', 3), entry('a', 1), entry('b', 2)];

describe('the location list', () => {
  it('puts the projects first, in their order, then the four landmarks', () => {
    expect(buildLocations(three).map((l) => l.id)).toEqual(['a', 'b', 'c', 'station', 'lab', 'guild', 'mast']);
  });

  it('gives every location a text page and a place on the map', () => {
    for (const l of buildLocations(three)) {
      expect(l.href, l.id).toMatch(/^\/[a-z0-9/#-]*$/);
      expect(l.mapHref, l.id).toBe(`/#${l.id}`);
      expect(l.accent, l.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(buildLocations(three)[0]).toMatchObject({ type: 'project', href: '/projects/a/', eyebrow: 'a genre', title: 'A' });
  });

  it('adds exactly one location per project file, everywhere', () => {
    const before = buildLocations(three);
    const after = buildLocations([...three, entry('d', 4)]);
    expect(after.length).toBe(before.length + 1);
    const seeds = (list: typeof after) => list.filter((l): l is ProjectLocation => l.type === 'project').map(toProjectSeed);
    const layout = (list: typeof after) => buildLayout(seeds(list), LANDMARKS.map(toLandmarkSeed));
    expect(layout(after).length).toBe(layout(before).length + 1);
  });

  it('refuses a project whose id is a landmark', () => {
    expect(() => buildLocations([entry('lab', 1)])).toThrow(/lab/);
  });

  it('links every landmark to an overview section that exists', () => {
    const sources = ['src/pages/overview.astro', 'src/components/TelegraphMiniGame.astro']
      .map((p) => readFileSync(join(__dirname, '..', p), 'utf8'))
      .join('\n');
    for (const l of LANDMARKS) {
      expect(l.href.startsWith(`${OVERVIEW}#`), l.id).toBe(true);
      expect(sources, l.href).toContain(`id="${l.href.split('#')[1]}"`);
    }
  });

  it('builds the nav from the map and the landmarks', () => {
    expect(NAV.map((n) => n.label)).toEqual(['Map', 'About', 'Projects', 'Lab', 'Activities', 'Contact']);
    for (const l of LANDMARKS) expect(NAV).toContainEqual({ href: l.href, label: l.nav });
  });
});

describe('the project view', () => {
  const game = { status: 'playable' as const, dates: { start: '2026-03' }, itchUrl: 'https://x.itch.io/g' };
  it('reads a playable game', () => {
    expect(projectView(game)).toEqual({
      status: 'Playable',
      period: '2026-03 – now',
      liveTerm: 'Play',
      live: { href: 'https://x.itch.io/g', label: '▶ Play on itch.io', short: 'itch.io ↗' },
      pending: 'Not on itch.io yet',
    });
  });
  it('reads a released tool by its download page', () => {
    const v = projectView({ kind: 'tool', status: 'released', dates: { start: '2026-07', end: '2026-10' }, downloadUrl: 'https://github.com/r' });
    expect(v).toMatchObject({ status: 'Released', period: '2026-07 – 2026-10', liveTerm: 'Download', live: { label: '↓ Download on GitHub' } });
  });
  it('has no live link while nothing is published', () => {
    expect(projectView({ status: 'in-progress', dates: { start: '2026-11' } })).toMatchObject({ status: 'Build in progress', live: null });
    expect(projectView({ kind: 'tool', status: 'planned', dates: { start: '2026-11' } })).toMatchObject({ status: 'Rework planned', live: null, pending: 'Not released yet' });
  });
});
