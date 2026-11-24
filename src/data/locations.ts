/**
 * Ordered site navigation and project directory helpers.
 * Replaces the former field-map coordinate manifest with linear portfolio navigation.
 */

import { PROJECTS_INDEX } from './site';

export type ProjectKind = 'game' | 'tool' | 'engine';
export type WorldKind = 'arena' | 'board' | 'dungeon' | 'archive' | 'generic';

export interface ProjectEntryLike {
  id: string;
  data: {
    title: string;
    genre: string;
    kind?: ProjectKind;
    order?: number;
    world?: { kind: WorldKind; accent: string };
  };
}

export interface ProjectLocation {
  type: 'project';
  id: string;
  title: string;
  eyebrow: string;
  href: string;
  worldKind: WorldKind;
  accent: string;
  order: number;
}

export interface HomeSection {
  id: string;
  num: string;
  title: string;
  meta: string;
}

export const HOME_SECTIONS: readonly HomeSection[] = [
  { id: 'overview', num: '01', title: 'OVERVIEW', meta: 'PORTFOLIO // SPEC & ROSTER' },
  { id: 'projects', num: '02', title: 'PRIVATE & PASSION PROJECTS', meta: '5 PLAYABLE GAMES · SAVE TOOLING' },
  { id: 'about', num: '03', title: 'ABOUT & PRINCIPLES', meta: 'SYSTEMS · DESIGN · PSYCHOLOGY' },
  { id: 'experience', num: '04', title: 'EXPERIENCE & EDUCATION', meta: 'WORK · UNIVERSITY · STACK' },
  { id: 'activities', num: '05', title: 'TEAM PROJECTS & ACTIVITIES', meta: 'COLLABORATION · MEDIA · EVENTS' },
];

/** Top navigation items matching the framed portfolio structure. */
export const NAV = [
  { href: '/', label: 'Home' },
  { href: PROJECTS_INDEX, label: 'Projects' },
  { href: '/#about', label: 'About' },
  { href: '/#experience', label: 'Experience' },
  { href: '/#activities', label: 'Activities' },
  { href: '/#contact', label: 'Contact' },
] as const;

export const projectLocation = (p: ProjectEntryLike): ProjectLocation => ({
  type: 'project',
  id: p.id,
  title: p.data.title,
  eyebrow: p.data.genre,
  href: `${PROJECTS_INDEX}${p.id}/`,
  worldKind: p.data.world?.kind ?? 'generic',
  accent: p.data.world?.accent ?? '#f27c52',
  order: p.data.order ?? 99,
});

/** Projects sorted by `order` ascending, then `id`. */
export const buildLocations = (projects: readonly ProjectEntryLike[]): ProjectLocation[] =>
  [...projects]
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || a.id.localeCompare(b.id))
    .map(projectLocation);
