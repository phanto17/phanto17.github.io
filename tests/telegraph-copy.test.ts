import { describe, expect, it } from 'vitest';
import { TELEGRAPH_PORTAL_NODES } from '../src/scripts/telegraph-engine';
import * as copy from '../src/scripts/telegraph-copy';

describe('telegraph copy', () => {
  it('describes a cue by row and column, with the shove when there is one', () => {
    expect(copy.cueShown(2, 1, 4, { shown: 0, shove: null, target: 0 })).toBe('Wave 2 Telegraph 1 of 4: Row 1, Col 1');
    expect(copy.cueShown(4, 3, 6, { shown: 5, shove: 'right', target: 6 })).toBe(
      'Wave 4 Telegraph 3 of 6: Row 2, Col 2, shoved right. Answer with the tile it lands on.',
    );
    expect(copy.cueBadge(2, { shown: 5, shove: 'up', target: 1 })).toBe('2↑');
    expect(copy.cueBadge(2, { shown: 5, shove: null, target: 5 })).toBe('2');
  });

  it('hands the turn over with or without shoves', () => {
    expect(copy.yourTurn([{ shown: 0, shove: null, target: 0 }, { shown: 1, shove: null, target: 1 }])).toBe(
      'Your turn: reproduce all 2 telegraphed tiles in order.',
    );
    expect(copy.yourTurn([{ shown: 0, shove: 'down', target: 4 }])).toBe('Your turn: reproduce all 1 tiles in order, shoved cues where they land.');
  });

  it('reports waves, misses and the cleared campaign', () => {
    expect(copy.waveCleared({ kind: 'wave-cleared', completedWave: 3, nextWave: 4, nextLength: 6, streak: 12, waveMs: 2345, waveScore: 540, score: 1500 })).toBe(
      'Wave 3 resolved in 2.3s (+540). Preparing Wave 4 (6 tiles, 1 shove)...',
    );
    expect(copy.disrupted({ kind: 'disrupted', failedAtStep: 2, expectedCell: 6, actualCell: 10, distance: 1, expectedShove: 'left', streak: 0 })).toBe(
      'Telegraph missed at step 2: that cue was shoved left, so the answer was Row 2, Col 3, 1 tile from your pick. Press Retry.',
    );
    const cleared = { kind: 'campaign-cleared' as const, totalWaves: 5, streak: 25, waveMs: 4000, waveScore: 900, score: 3200 };
    expect(copy.campaignCleared(cleared, 3200, true, true)).toBe(
      'All 5 waves cleared! Last wave 4.0s (+900). Score 3200, a new best. Signal cleared: the hero stamp and the Signal theme are unlocked.',
    );
    expect(copy.campaignCleared(cleared, 4000, false, false)).toBe('All 5 waves cleared! Last wave 4.0s (+900). Score 3200, best 4000.');
  });

  it('appends the blocked instruction to the current status without stacking it', () => {
    expect(copy.blocked('', false)).toBe('Start or restart a turn to play.');
    const once = copy.blocked('Step 1 of 3 locked in.', true);
    expect(once).toBe('Step 1 of 3 locked in. Wait for the sequence to finish.');
    // The controller keeps the base status, so a second press renders the same line.
    expect(copy.blocked('Step 1 of 3 locked in.', true)).toBe(once);
  });

  it('labels the keys and readouts', () => {
    expect(copy.nextCueLabel(0, 3)).toBe('Show next cue');
    expect(copy.nextCueLabel(2, 3)).toBe('Start recall');
    expect(copy.hintLabel(1)).toBe('Forecast Hint (1)');
    expect(copy.stageBadge(2)).toBe('STG_02');
    expect(copy.previewChunk(3, 7, 10)).toBe('CHUNK 03/07 → ROW 3, COL 3');
    expect(copy.portalStatus(true, true)).toBe('● ACTIVE');
    expect(copy.portalStatus(false, true)).toBe('✓ EXPLORED');
    expect(copy.portalStatus(false, false)).toBe('○ PORTAL');
    expect(copy.inspectorLink(TELEGRAPH_PORTAL_NODES[3])).toEqual({ href: '#tg-grid', label: 'Jump to 4×4 Tactical Board ↓' });
  });
});
