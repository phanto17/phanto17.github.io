import { describe, expect, it } from 'vitest';
import { SIDE, cell, demoBoard, previewShoves, resolveShove } from '../src/scripts/shove-sim';
import { TelegraphEngine } from '../src/scripts/telegraph-engine';

describe('shove visualiser model', () => {
  it('uses the Telegraph engine board', () => {
    expect(SIDE * SIDE).toBe(TelegraphEngine.GRID_SIZE);
    expect(SIDE).toBe(4);
  });

  it('starts from a fixed position with pits, a rock and five units on floor', () => {
    const b = demoBoard();
    expect(b.terrain.filter((t) => t === 'pit')).toHaveLength(2);
    expect(b.terrain.filter((t) => t === 'rock')).toHaveLength(1);
    expect(b.pieces.filter(Boolean)).toHaveLength(5);
    b.pieces.forEach((p, i) => {
      if (p) expect(b.terrain[i]).toBe('floor');
    });
  });

  it('moves a unit one tile onto free floor', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(3, 1), 'left');
    expect(r.events).toEqual([{ kind: 'moved', from: cell(3, 1), to: cell(3, 0) }]);
    expect(r.board.pieces[cell(3, 1)]).toBeNull();
    expect(r.board.pieces[cell(3, 0)]?.name).toBe('Soldier');
    expect(r.summary).toBe('Soldier (ally) is shoved ← one tile.');
    expect(b.pieces[cell(3, 1)]?.name).toBe('Soldier'); // the input board is untouched
  });

  it('rams the map edge: collision damage, no move', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(2, 1), 'left'); // goblin to col 0
    expect(r.events[0].kind).toBe('moved');
    const r2 = resolveShove(r.board, cell(2, 0), 'left');
    expect(r2.events).toEqual([{ kind: 'edge', cell: cell(2, 0) }]);
    expect(r2.board.pieces[cell(2, 0)]).toEqual({ side: 'enemy', name: 'Goblin', hits: 1 });
    expect(r2.summary).toMatch(/map edge: collision damage, no move/);
  });

  it('rams a rock: collision damage, no move', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(2, 1), 'up'); // rock at (1,1)
    expect(r.events).toEqual([{ kind: 'rock', cell: cell(2, 1), rock: cell(1, 1) }]);
    expect(r.board.pieces[cell(2, 1)]?.hits).toBe(1);
  });

  it('rams another unit: both take damage, neither moves', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(3, 3), 'up'); // archer into the brute at (2,3)
    expect(r.events).toEqual([{ kind: 'ram', cell: cell(3, 3), other: cell(2, 3) }]);
    expect(r.board.pieces[cell(3, 3)]?.hits).toBe(1);
    expect(r.board.pieces[cell(2, 3)]?.hits).toBe(1);
    expect(r.summary).toBe('Archer (ally) rams Orc Brute: both take collision damage, neither moves.');
  });

  it('a unit shoved onto a pit is destroyed', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(2, 3), 'left'); // brute into the pit at (2,2)
    expect(r.events).toEqual([{ kind: 'pit', from: cell(2, 3), pit: cell(2, 2) }]);
    expect(r.board.pieces[cell(2, 3)]).toBeNull();
    expect(r.board.pieces[cell(2, 2)]).toBeNull();
    expect(r.board.pieces.filter(Boolean)).toHaveLength(4);
  });

  it('does nothing for an empty tile', () => {
    const b = demoBoard();
    const r = resolveShove(b, cell(0, 0), 'up');
    expect(r.events).toEqual([]);
    expect(r.board).toBe(b);
  });

  it('previews all four directions of a unit', () => {
    const b = demoBoard();
    expect(previewShoves(b, cell(2, 3))).toEqual({ up: 'moved', down: 'ram', left: 'pit', right: 'edge' });
    expect(previewShoves(b, cell(3, 3))).toEqual({ up: 'ram', down: 'edge', left: 'moved', right: 'edge' });
  });
});
