/**
 * The site's locations, built once: every project (from the content collection) and the four
 * landmarks. The field map places them, the nav and the overview link to them, and a page finds its
 * own location here: its accent, its place on the map (`mapHref`) and its text page (`href`).
 *
 * A project file adds exactly one location (tests/locations.test.ts, tests/world-gen.test.ts). Landmark
 * accents are the `loc-*` tokens in design/tokens.json; the interface tones every accent per theme
 * (field-kit.css `--acc-ui`). Pure apart from reading the token file, so tests import it directly.
 */
import tokens from '../../design/tokens.json';
import type { LandmarkKind, LandmarkSeed, ProjectKind, ProjectSeed } from '../world/gen';
import { OVERVIEW } from './site';

interface LocationBase {
  id: string;
  title: string;
  /** The line over the title on the map label and the panel. */
  eyebrow: string;
  /** One colour: the 3D world and the minimap use it as it is, the interface tones it. */
  accent: string;
  /** The text page for this place. */
  href: string;
  /** This place on the map: the map opens its panel after Explore. */
  mapHref: string;
}
export interface ProjectLocation extends LocationBase {
  type: 'project';
  kind: ProjectKind;
}
export interface LandmarkLocation extends LocationBase {
  type: 'landmark';
  kind: LandmarkKind;
  /** Reserved spiral slot; the hub (none) is the centre. */
  slot?: number;
  /** The nav's word for this place. */
  nav: string;
}
export type SiteLocation = ProjectLocation | LandmarkLocation;

const tokenColour = (name: string): string => {
  const t = tokens.color.tokens.find((x) => x.name === name);
  if (!t || typeof t.value !== 'string') throw new Error(`design/tokens.json has no single-value colour ${name}`);
  return t.value;
};
const landmark = (l: Omit<LandmarkLocation, 'type' | 'accent' | 'mapHref'>): LandmarkLocation => ({
  ...l,
  type: 'landmark',
  accent: tokenColour(`loc-${l.id}`),
  mapHref: `/#${l.id}`,
});

/** The landmarks, hub first. Their `href` is the overview section with the same content. */
export const LANDMARKS: readonly LandmarkLocation[] = [
  landmark({ id: 'station', title: 'Field Station', kind: 'station', eyebrow: 'About me', href: `${OVERVIEW}#about`, nav: 'About' }),
  landmark({ id: 'lab', title: 'The Lab', kind: 'lab', eyebrow: 'Mini-games', slot: 4, href: `${OVERVIEW}#lab`, nav: 'Lab' }),
  landmark({ id: 'guild', title: 'Guild Hall', kind: 'guild', eyebrow: 'Team projects & channel', slot: 5, href: `${OVERVIEW}#activities`, nav: 'Activities' }),
  landmark({ id: 'mast', title: 'Radio Mast', kind: 'mast', eyebrow: 'Contact', slot: 6, href: `${OVERVIEW}#contact`, nav: 'Contact' }),
];

export const landmarkById = (id: LandmarkKind): LandmarkLocation => LANDMARKS.find((l) => l.id === id)!;

/** The fields of a project entry this reads (a `getCollection('projects')` entry fits). */
export interface ProjectEntryLike {
  id: string;
  data: { title: string; genre: string; order: number; world: { kind: ProjectKind; accent: string } };
}

export function projectLocation(p: ProjectEntryLike): ProjectLocation {
  return {
    id: p.id,
    title: p.data.title,
    eyebrow: p.data.genre,
    accent: p.data.world.accent,
    kind: p.data.world.kind,
    type: 'project',
    href: `/projects/${p.id}/`,
    mapHref: `/#${p.id}`,
  };
}

/** Every location: projects in their `order`, then the landmarks. Ids are unique across both. */
export function buildLocations(projects: readonly ProjectEntryLike[]): SiteLocation[] {
  const list = [...projects].sort((a, b) => a.data.order - b.data.order).map(projectLocation);
  const all: SiteLocation[] = [...list, ...LANDMARKS];
  const ids = all.map((l) => l.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`Two locations share the id "${dup}"`);
  return all;
}

/** What the map engine needs from a location (src/world/gen.ts seeds), and nothing else. */
export const toProjectSeed = (l: ProjectLocation): ProjectSeed => ({ id: l.id, title: l.title, kind: l.kind, accent: l.accent, eyebrow: l.eyebrow });
export const toLandmarkSeed = (l: LandmarkLocation): LandmarkSeed => ({
  id: l.id,
  title: l.title,
  kind: l.kind,
  accent: l.accent,
  eyebrow: l.eyebrow,
  ...(l.slot === undefined ? {} : { slot: l.slot }),
});

/** The main nav: the map, then the landmarks in their overview order with the projects after About. */
export const NAV: readonly { href: string; label: string }[] = [
  { href: '/', label: 'Map' },
  { href: landmarkById('station').href, label: landmarkById('station').nav },
  { href: `${OVERVIEW}#projects`, label: 'Projects' },
  ...LANDMARKS.slice(1).map((l) => ({ href: l.href, label: l.nav })),
];
