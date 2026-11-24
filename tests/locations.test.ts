import { describe, expect, it } from 'vitest';
import { buildLocations, HOME_SECTIONS, NAV, projectLocation, type ProjectEntryLike } from '../src/data/locations';
import { PROJECTS_INDEX } from '../src/data/site';
import { projectView } from '../src/lib/project-view';

const entry = (id: string, order: number): ProjectEntryLike => ({
  id,
  data: {
    title: id.toUpperCase(),
    genre: `${id} genre`,
    order,
    world: { kind: 'generic', accent: '#123456' },
  },
});

const three = [entry('c', 3), entry('a', 1), entry('b', 2)];

describe('portfolio navigation and project ordering', () => {
  it('sorts projects by order ascending, then id', () => {
    expect(buildLocations(three).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    const tied = [entry('beta', 2), entry('alpha', 2)];
    expect(buildLocations(tied).map((p) => p.id)).toEqual(['alpha', 'beta']);
  });

  it('gives every project a canonical subpage href and accent', () => {
    for (const p of buildLocations(three)) {
      expect(p.href, p.id).toBe(`${PROJECTS_INDEX}${p.id}/`);
      expect(p.accent, p.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(projectLocation(entry('demo', 1))).toMatchObject({
      type: 'project',
      id: 'demo',
      href: '/projects/demo/',
      eyebrow: 'demo genre',
      title: 'DEMO',
    });
  });

  it('exposes the map-free linear navigation without Map or Lab items', () => {
    const labels = NAV.map((n) => n.label);
    expect(labels).toEqual(['Home', 'Projects', 'About', 'Experience', 'Activities', 'Contact']);
    expect(labels).not.toContain('Map');
    expect(labels).not.toContain('Lab');
    expect(NAV[0]).toEqual({ href: '/', label: 'Home' });
    expect(NAV.find((n) => n.label === 'Projects')?.href).toBe(PROJECTS_INDEX);
  });

  it('numbers home sections sequentially from 01 to 05', () => {
    expect(HOME_SECTIONS.map((s) => s.num)).toEqual(['01', '02', '03', '04', '05']);
    expect(HOME_SECTIONS.map((s) => s.id)).toEqual([
      'overview',
      'projects',
      'about',
      'experience',
      'activities',
    ]);
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

  it('reads a playable desktop game hosted on GitHub', () => {
    expect(
      projectView({
        kind: 'game',
        status: 'playable',
        dates: { start: '2026-10', end: '2026-11' },
        githubUrl: 'https://github.com/phanto17/text-rpg-engine',
      }),
    ).toEqual({
      status: 'Playable',
      period: '2026-10 – 2026-11',
      liveTerm: 'Play',
      live: {
        href: 'https://github.com/phanto17/text-rpg-engine',
        label: '▶ Get & Play on GitHub',
        short: 'GitHub ↗',
      },
      pending: 'Not on itch.io yet',
    });
  });

  it('reads a released tool by its download page', () => {
    const v = projectView({
      kind: 'tool',
      status: 'released',
      dates: { start: '2026-07', end: '2026-10' },
      downloadUrl: 'https://github.com/r',
    });
    expect(v).toMatchObject({
      status: 'Released',
      period: '2026-07 – 2026-10',
      liveTerm: 'Download',
      live: { label: '↓ Download on GitHub' },
    });
  });

  it('reads an open-source engine by its GitHub repository', () => {
    const v = projectView({
      kind: 'engine',
      status: 'released',
      dates: { start: '2026-10', end: '2026-11' },
      githubUrl: 'https://github.com/phanto17/text-rpg-engine',
    });
    expect(v).toMatchObject({
      status: 'Released',
      period: '2026-10 – 2026-11',
      liveTerm: 'Source',
      live: {
        href: 'https://github.com/phanto17/text-rpg-engine',
        label: 'View on GitHub ↗',
        short: 'GitHub ↗',
      },
    });
  });

  it('has no live link while nothing is published', () => {
    expect(projectView({ status: 'in-progress', dates: { start: '2026-11' } })).toMatchObject({
      status: 'Build in progress',
      live: null,
    });
    expect(projectView({ kind: 'tool', status: 'planned', dates: { start: '2026-11' } })).toMatchObject({
      status: 'Rework planned',
      live: null,
      pending: 'Not released yet',
    });
    expect(projectView({ kind: 'engine', status: 'in-progress', dates: { start: '2026-10' } })).toMatchObject({
      status: 'Build in progress',
      live: null,
      liveTerm: 'Source',
      pending: 'Repository pending',
    });
  });
});
