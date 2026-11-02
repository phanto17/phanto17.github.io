/**
 * Every string Telegraph Recall shows, as pure functions of the game's model. The board controller
 * and the popup call these; nothing here touches the DOM.
 */
import { TelegraphEngine, type Cue, type Direction, type PortalNode, type StepOutcome } from './telegraph-engine';

export const ARROW: Readonly<Record<Direction, string>> = { up: '↑', down: '↓', left: '←', right: '→' };

export const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;
export const tiles = (n: number): string => `${n} tile${n === 1 ? '' : 's'}`;

type Outcome<K extends StepOutcome['kind']> = Extract<StepOutcome, { kind: K }>;

/** The start key's label after a campaign starts, is cleared, or is lost. */
export const START = { restart: '↻ Restart', again: '↻ Play Again', retry: '↻ Retry from Wave 1' } as const;

export const PAUSED = 'Sequence paused. It will replay when you return.';
export const MANUAL_READY = 'Press Show first cue when you are ready.';
export const FIRST_CUE_LABEL = 'Show first cue';

/** The badge on a telegraphed tile: its 1-based position, with the shove arrow when it is one. */
export const cueBadge = (index1: number, cue: Cue): string => (cue.shove ? `${index1}${ARROW[cue.shove]}` : String(index1));

export function cueShown(wave: number, index1: number, total: number, cue: Cue): string {
  const { row, col } = TelegraphEngine.cellToCoord(cue.shown);
  const shove = cue.shove ? `, shoved ${cue.shove}. Answer with the tile it lands on.` : '';
  return `Wave ${wave} Telegraph ${index1} of ${total}: Row ${row}, Col ${col}${shove}`;
}

/** The manual-cue key's label while a sequence is being stepped through. */
export const nextCueLabel = (index: number, total: number): string => (index === total - 1 ? 'Start recall' : 'Show next cue');

export function yourTurn(seq: readonly Cue[]): string {
  const shoves = seq.filter((cue) => cue.shove).length;
  return shoves
    ? `Your turn: reproduce all ${seq.length} tiles in order, shoved cues where they land.`
    : `Your turn: reproduce all ${seq.length} telegraphed tiles in order.`;
}

export const stepLocked = (step: number, total: number): string => `Step ${step} of ${total} locked in.`;

export function waveCleared(o: Outcome<'wave-cleared'>): string {
  const shoves = TelegraphEngine.shovesForWave(o.nextWave);
  const extra = shoves ? `, ${shoves} shove${shoves === 1 ? '' : 's'}` : '';
  return `Wave ${o.completedWave} resolved in ${seconds(o.waveMs)} (+${o.waveScore}). Preparing Wave ${o.nextWave} (${o.nextLength} tiles${extra})...`;
}

export function campaignCleared(o: Outcome<'campaign-cleared'>, best: number, newBest: boolean, firstUnlock: boolean): string {
  const record = newBest ? 'a new best' : `best ${best}`;
  const unlock = firstUnlock ? ' Signal cleared: the hero stamp and the Signal theme are unlocked.' : '';
  return `All ${o.totalWaves} waves cleared! Last wave ${seconds(o.waveMs)} (+${o.waveScore}). Score ${o.score}, ${record}.${unlock}`;
}

export function disrupted(o: Outcome<'disrupted'>): string {
  const { row, col } = TelegraphEngine.cellToCoord(o.expectedCell);
  const why = o.expectedShove ? `that cue was shoved ${o.expectedShove}, so ` : '';
  return `Telegraph missed at step ${o.failedAtStep}: ${why}the answer was Row ${row}, Col ${col}, ${tiles(o.distance)} from your pick. Press Retry.`;
}

/** A press the board is not taking: the current status plus what to do, never stacked twice. */
export function blocked(currentStatus: string, waiting: boolean): string {
  const instruction = waiting ? 'Wait for the sequence to finish.' : 'Start or restart a turn to play.';
  return `${currentStatus} ${instruction}`.trim();
}

export const manualToggled = (on: boolean): string =>
  on
    ? 'Manual cues on. Start or restart a turn to advance each cue at your own pace.'
    : 'Manual cues off. The next sequence will play automatically.';

export const manualLabel = (on: boolean): string => (on ? 'Manual cues: on' : 'Manual cues: off');
export const soundLabel = (on: boolean): string => (on ? 'Sound: on' : 'Sound: off');
export const hintLabel = (remaining: number): string => `Forecast Hint (${remaining})`;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** The stage-2 preview's step readout: `CHUNK 03/07 → ROW 2, COL 1`. */
export function previewChunk(step1: number, total: number, cell: number): string {
  const { row, col } = TelegraphEngine.cellToCoord(cell);
  return `CHUNK ${pad2(step1)}/${pad2(total)} → ROW ${row}, COL ${col}`;
}

/** The cabinet's stage readout: `STG_02`. */
export const stageBadge = (index1: number): string => `STG_${pad2(index1)}`;

/** A portal card's status line. */
export const portalStatus = (selected: boolean, explored: boolean): string => (selected ? '● ACTIVE' : explored ? '✓ EXPLORED' : '○ PORTAL');

/** The inspector's code line (HTML: the code is bold). */
export const inspectorCodeHtml = (node: PortalNode): string => `<b>${node.code}</b> · ${node.tag}`;

export const inspectorLink = (node: PortalNode): { href: string; label: string } => ({
  href: node.projectHref ?? '#tg-grid',
  label: node.projectLabel ?? 'Jump to 4×4 Tactical Board ↓',
});
