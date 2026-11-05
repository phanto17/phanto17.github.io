/**
 * The status line at the foot of every text page, the map's HUD in one row: the Poznań clock and
 * phase (the hour the map is lit at) and how many locations the visitor has explored on the map.
 * Pure: the footer's script hands it the hour, the stored visited list and the location ids.
 */
import { fmtHour, phaseName } from '../world/daylight';

/** localStorage key of the map's visited list (a JSON array of location ids), written by the map. */
export const VISITED_KEY = 'portfolio-world-visited';

/** The stored visited list; anything unreadable is an empty list. */
export function parseVisited(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export interface StatusLine {
  /** "13:43" */
  time: string;
  /** "Day", "Golden hour", … */
  phase: string;
  /** "3/8 explored": only locations that still exist count, each once. */
  explored: string;
}

export function statusLine(hour: number, visited: readonly string[], locationIds: readonly string[]): StatusLine {
  const known = new Set(locationIds);
  const seen = new Set(visited.filter((id) => known.has(id)));
  return { time: fmtHour(hour), phase: phaseName(hour), explored: `${seen.size}/${known.size} explored` };
}
