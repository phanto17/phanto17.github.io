import { describe, expect, it } from 'vitest';
import { RANKS, rankFor, nextRank, rankLabel } from '../src/scripts/signal-reward';

describe('ranks', () => {
  it('start at Cadet with no clear and climb with the best score', () => {
    expect(rankFor(0).name).toBe('Cadet');
    expect(rankFor(1000).name).toBe('Scout');
    expect(rankFor(3900).name).toBe(RANKS.at(-1)!.name);
  });
  it('are ordered by threshold', () => {
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].at).toBeGreaterThan(RANKS[i - 1].at);
    expect(RANKS[0].at).toBe(0);
  });
  it('names the next rank and its gap, or nothing at the top', () => {
    expect(nextRank(0)).toEqual({ name: 'Scout', missing: RANKS[1].at });
    expect(nextRank(99999)).toBeNull();
  });
  it('labels the stamp', () => {
    expect(rankLabel({ best: 2650, clears: 1, since: '' })).toMatch(/^SIGNAL CLEARED · 2650 · /);
  });
});
