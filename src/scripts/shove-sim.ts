/**
 * Shove visualiser model (R6): a small board on which one unit is shoved one tile, resolved with the
 * rules Push Comes to Shove describes in its write-up: a unit shoved into a wall or the map edge
 * takes collision damage and stays put, a unit shoved into another unit damages both and neither
 * moves, a unit shoved onto a pit is destroyed, otherwise it moves. The geometry (board size, the
 * one-tile step and its edge check) is the Telegraph engine's, so the lab and the mini-game agree.
 *
 * Pure: no DOM, no randomness. The UI lives in src/components/ShoveLab.astro.
 */
import { TelegraphEngine, type Direction } from './telegraph-engine';

export type Terrain = 'floor' | 'pit' | 'rock';
export type Side = 'ally' | 'enemy';

export interface Piece {
  side: Side;
  /** Unit name as the game calls it. */
  name: string;
  /** Collision hits taken in this lab (no hit points are claimed; the game's numbers are its own). */
  hits: number;
}

export interface ShoveBoard {
  side: number;
  terrain: readonly Terrain[];
  pieces: readonly (Piece | null)[];
}

export type ShoveEvent =
  | { kind: 'moved'; from: number; to: number }
  | { kind: 'edge'; cell: number }
  | { kind: 'rock'; cell: number; rock: number }
  | { kind: 'ram'; cell: number; other: number }
  | { kind: 'pit'; from: number; pit: number };

export interface ShoveResult {
  board: ShoveBoard;
  events: ShoveEvent[];
  /** One line in the write-up's words, for the lab's log. */
  summary: string;
}

export const SIDE = Math.round(Math.sqrt(TelegraphEngine.GRID_SIZE));
export const ARROW: Record<Direction, string> = { up: '↑', down: '↓', left: '←', right: '→' };

export const cell = (row: number, col: number): number => row * SIDE + col;

/** The lab's starting position (the engine's 4 × 4 board): two pits, a rock, two allies and three foes within one shove of trouble. */
export function demoBoard(): ShoveBoard {
  const terrain: Terrain[] = Array.from({ length: SIDE * SIDE }, () => 'floor');
  const pieces: (Piece | null)[] = Array.from({ length: SIDE * SIDE }, () => null);
  [cell(0, 3), cell(2, 2)].forEach((c) => (terrain[c] = 'pit'));
  terrain[cell(1, 1)] = 'rock';
  pieces[cell(3, 1)] = { side: 'ally', name: 'Soldier', hits: 0 };
  pieces[cell(3, 3)] = { side: 'ally', name: 'Archer', hits: 0 };
  pieces[cell(2, 1)] = { side: 'enemy', name: 'Goblin', hits: 0 };
  pieces[cell(0, 1)] = { side: 'enemy', name: 'Goblin', hits: 0 };
  pieces[cell(2, 3)] = { side: 'enemy', name: 'Orc Brute', hits: 0 };
  return { side: SIDE, terrain, pieces };
}

const hit = (p: Piece): Piece => ({ ...p, hits: p.hits + 1 });

/** Shove the unit on `from` one tile toward `dir`. A cell without a unit is left as it is. */
export function resolveShove(board: ShoveBoard, from: number, dir: Direction): ShoveResult {
  const piece = board.pieces[from];
  if (!piece) return { board, events: [], summary: 'No unit on that tile.' };
  const pieces = [...board.pieces];
  const to = TelegraphEngine.shoveTarget(from, dir);
  const who = `${piece.name} (${piece.side === 'ally' ? 'ally' : 'foe'})`;

  if (to === null) {
    pieces[from] = hit(piece);
    return {
      board: { ...board, pieces },
      events: [{ kind: 'edge', cell: from }],
      summary: `${who} is shoved ${ARROW[dir]} into the map edge: collision damage, no move.`,
    };
  }
  if (board.terrain[to] === 'rock') {
    pieces[from] = hit(piece);
    return {
      board: { ...board, pieces },
      events: [{ kind: 'rock', cell: from, rock: to }],
      summary: `${who} is shoved ${ARROW[dir]} into a rock: collision damage, no move.`,
    };
  }
  const other = board.pieces[to];
  if (other) {
    pieces[from] = hit(piece);
    pieces[to] = hit(other);
    return {
      board: { ...board, pieces },
      events: [{ kind: 'ram', cell: from, other: to }],
      summary: `${who} rams ${other.name}: both take collision damage, neither moves.`,
    };
  }
  if (board.terrain[to] === 'pit') {
    pieces[from] = null;
    return {
      board: { ...board, pieces },
      events: [{ kind: 'pit', from, pit: to }],
      summary: `${who} is shoved ${ARROW[dir]} onto a pit and is destroyed.`,
    };
  }
  pieces[from] = null;
  pieces[to] = piece;
  return {
    board: { ...board, pieces },
    events: [{ kind: 'moved', from, to }],
    summary: `${who} is shoved ${ARROW[dir]} one tile.`,
  };
}

/** The four shoves a unit can take, with where each one ends, for a preview (the game's amber tiles). */
export function previewShoves(board: ShoveBoard, from: number): Record<Direction, ShoveEvent['kind'] | null> {
  const out = {} as Record<Direction, ShoveEvent['kind'] | null>;
  (['up', 'down', 'left', 'right'] as Direction[]).forEach((dir) => {
    const { events } = resolveShove(board, from, dir);
    out[dir] = events[0]?.kind ?? null;
  });
  return out;
}
