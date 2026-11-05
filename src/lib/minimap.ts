/**
 * The projects index's minimap, drawn at build time from the same generator the 3D map uses
 * (src/world/gen.ts), so it shows the real islands, paths and slots without three.js. Pure: the
 * component (LocationMap.astro) renders the terrain as two SVG paths and the places as HTML links
 * positioned in percent, so labels stay crisp and themable at every width.
 */
import { buildLayout, generate, T, type Grid, type LandmarkSeed, type Location, type ProjectSeed } from '../world/gen';

export interface MinimapPlace {
  id: string;
  title: string;
  type: Location['type'];
  accent: string;
  /** Position in percent of the map's width and depth (the centre of the place's tile). */
  left: number;
  top: number;
  /** Which side of the diamond the label goes: toward the middle, so it never leaves the map. */
  label: 'right' | 'left';
}
export interface Minimap {
  /** The grid in tiles: the SVG viewBox is `0 0 w d`. */
  w: number;
  d: number;
  /** Land (every tile that is not water) and the paths, as runs of whole tiles. */
  land: string;
  path: string;
  places: MinimapPlace[];
}

/** One `M…h…v1h…z` rectangle per horizontal run of tiles that pass `keep`. */
export function runs(g: Pick<Grid, 'w' | 'd' | 'type'>, keep: (tile: number) => boolean): string {
  let out = '';
  for (let z = 0; z < g.d; z++) {
    let c = 0;
    while (c < g.w) {
      if (!keep(g.type[c + z * g.w])) { c++; continue; }
      const start = c;
      while (c < g.w && keep(g.type[c + z * g.w])) c++;
      const len = c - start;
      out += `M${start} ${z}h${len}v1h-${len}z`;
    }
  }
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function minimap(projects: readonly ProjectSeed[], landmarks: readonly LandmarkSeed[]): Minimap {
  const locs = buildLayout(projects, landmarks);
  const g = generate(locs);
  return {
    w: g.w,
    d: g.d,
    land: runs(g, (t) => t !== T.WATER),
    path: runs(g, (t) => t === T.PATH || t === T.PAD),
    places: locs.map((l) => {
      const left = round(((l.x - g.minX + 0.5) / g.w) * 100);
      return {
        id: l.id,
        title: l.title,
        type: l.type,
        accent: l.accent,
        left,
        top: round(((l.z - g.minZ + 0.5) / g.d) * 100),
        label: left > 55 ? ('left' as const) : ('right' as const),
      };
    }),
  };
}
