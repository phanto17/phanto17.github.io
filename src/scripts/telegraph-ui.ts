/**
 * Telegraph Recall on the page: queries the lab's elements once, adapts the board's elements to the
 * `BoardView` the controller talks to, binds the CRT popup, and wires the cabinet's keys. The game
 * itself lives in telegraph-board.ts, the popup in telegraph-popup.ts, the copy in telegraph-copy.ts
 * and the pure model in telegraph-engine.ts.
 */
import { TelegraphEngine, TelegraphStageController } from './telegraph-engine';
import { onPage, type PageContext } from './page';
import { prefs } from './prefs';
import { sound } from './sound';
import { cellForKey, createBoard, type BoardView } from './telegraph-board';
import { bindPopup, parseLabHash, type PopupElements } from './telegraph-popup';
import * as copy from './telegraph-copy';

export { parseLabHash };

const UNAVAILABLE_MS = 400;

/** localStorage, or null where it is blocked (private mode): the reward then lasts for this visit only. */
const localStore = (): Storage | null => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};

interface LabElements {
  cells: HTMLButtonElement[];
  status: HTMLElement;
  wave: HTMLElement;
  score: HTMLElement;
  points: HTMLElement;
  startBtn: HTMLButtonElement;
  hintBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  manualBtn: HTMLButtonElement;
  nextCueBtn: HTMLButtonElement;
  popup: PopupElements;
}

/** The lab's elements, or null (with one warning) when the markup lacks one: the script and the markup ship together. */
function queryLab(lab: HTMLElement): LabElements | null {
  const missing: string[] = [];
  const one = <T extends Element>(selector: string): T => {
    const el = document.querySelector<T>(selector);
    if (!el) missing.push(selector);
    return el as T;
  };
  const all = <T extends Element>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));

  const els: LabElements = {
    cells: all<HTMLButtonElement>('#tg-grid .tg-cell'),
    status: one('#tg-status'),
    wave: one('#tg-wave'),
    score: one('#tg-score'),
    points: one('#tg-points'),
    startBtn: one('#tg-start'),
    hintBtn: one('#tg-hint'),
    muteBtn: one('#tg-mute'),
    manualBtn: one('#tg-manual'),
    nextCueBtn: one('#tg-next-cue'),
    popup: {
      dialog: one('#tg-crt-popup'),
      openBtn: one('#tg-open-popup'),
      closeBtn: one('#tg-close-popup'),
      prevBtn: one('#crt-prev-stage'),
      nextBtn: one('#crt-next-stage'),
      router: one('#tg-stage-router'),
      stageCode: one('#crt-stage-code'),
      tabs: all<HTMLButtonElement>('.crt-stage-tab'),
      scenes: all<HTMLElement>('[data-stage-scene]'),
      previewCells: all<HTMLElement>('[data-preview-cell]'),
      seqStepLabel: one('#crt-seq-step-label'),
      portalBtns: all<HTMLButtonElement>('[data-portal-id]'),
      popupPortalBtns: all<HTMLButtonElement>('[data-popup-portal]'),
      portalProgress: one('#tg-portal-progress'),
      inspector: one('#tg-portal-inspector'),
      inspectorCode: one('#inspector-code'),
      inspectorTitle: one('#inspector-title'),
      inspectorDetail: one('#inspector-detail'),
      inspectorLink: one('#inspector-link'),
      inspectorOpenStage3: one('#inspector-open-stage3'),
      interactionCount: one('#tg-interaction-count'),
      stageBadge: one('#tg-current-stage-badge'),
    },
  };
  if (els.cells.length !== TelegraphEngine.GRID_SIZE) missing.push(`#tg-grid .tg-cell ×${TelegraphEngine.GRID_SIZE}`);
  if (missing.length) {
    console.warn(`Telegraph Recall: lab markup is missing ${missing.join(', ')}; not binding.`, lab);
    return null;
  }
  return els;
}

/** The board's elements as the controller sees them. */
function domView(els: LabElements): BoardView {
  const setBadge = (index: number, text: string) => {
    const badge = els.cells[index]?.querySelector<HTMLElement>('.step-badge');
    if (badge) badge.textContent = text;
  };
  return {
    showCue(index, cue, badge) {
      const cell = els.cells[index];
      if (!cell) return;
      cell.classList.add('telegraph');
      if (cue.shove) {
        cell.classList.add('shove');
        cell.dataset.shove = cue.shove;
      }
      setBadge(index, badge);
    },
    hideCue(index) {
      const cell = els.cells[index];
      if (!cell) return;
      cell.classList.remove('telegraph', 'shove');
      delete cell.dataset.shove;
      setBadge(index, '');
    },
    clearBoard() {
      els.cells.forEach((cell, index) => {
        cell.classList.remove('telegraph', 'shove', 'hit', 'miss');
        delete cell.dataset.shove;
        setBadge(index, '');
      });
    },
    markHit(index, badge) {
      els.cells[index]?.classList.add('hit');
      setBadge(index, badge);
    },
    markMiss(index) {
      els.cells[index]?.classList.add('miss');
    },
    markExpected(index, badge) {
      els.cells[index]?.classList.add('telegraph');
      setBadge(index, badge);
    },
    flashUnavailable(index) {
      const cell = els.cells[index];
      if (!cell) return;
      cell.classList.add('unavailable');
      window.setTimeout(() => cell.classList.remove('unavailable'), UNAVAILABLE_MS);
    },
    setStatus(text) {
      els.status.textContent = text;
    },
    setHud(hud) {
      els.wave.textContent = String(hud.wave);
      els.score.textContent = String(hud.streak);
      els.points.textContent = String(hud.score);
      els.hintBtn.textContent = copy.hintLabel(hud.hintsLeft);
      els.hintBtn.disabled = !hud.hintEnabled;
    },
    setNextCue(visible, label) {
      els.nextCueBtn.hidden = !visible;
      if (label !== undefined) els.nextCueBtn.textContent = label;
    },
    setManual(on, enabled) {
      els.manualBtn.setAttribute('aria-pressed', String(on));
      els.manualBtn.textContent = copy.manualLabel(on);
      els.manualBtn.disabled = !enabled;
    },
    setStartLabel(label) {
      els.startBtn.textContent = label;
    },
    nextCueHasFocus: () => document.activeElement === els.nextCueBtn,
    focusFirstCell: () => els.cells[0]?.focus(),
    play: (cue, step) => sound.play(cue, step),
  };
}

let registered = false;

/**
 * Load the Telegraph Recall UI: binds the lab on the page on screen and on every later arrival at the
 * home page (src/scripts/page.ts). Called by the lazy loader in TelegraphMiniGame.astro; a no-op
 * after the first call.
 */
export function init(): void {
  if (registered) return;
  registered = true;
  onPage(bindLab);
}

/**
 * Bind one page's lab. Listeners on `window`, `document` and media queries hang on the page's signal;
 * element listeners leave with their elements; the returned cleanup stops timers and closes the popup.
 */
function bindLab({ signal }: PageContext): (() => void) | undefined {
  const lab = document.getElementById('lab');
  if (!lab) return;
  const els = queryLab(lab);
  if (!els) return;

  const engine = new TelegraphEngine();
  const stageCtrl = new TelegraphStageController();
  const isReducedMotion = () => !prefs.isMotionAllowed();
  const isHidden = () => document.hidden;

  const board = createBoard({
    view: domView(els),
    engine,
    storage: localStore(),
    isReducedMotion,
    isHidden,
    signalUnlocked: () => prefs.signalUnlocked(),
    onReward: (reward, score) => {
      // The hero stamp listens; the theme key reads the record on its next press.
      prefs.refreshSignal();
      window.dispatchEvent(new CustomEvent('portfolio:signalcleared', { detail: { reward, score } }));
    },
  });
  const popup = bindPopup({
    lab,
    els: els.popup,
    stageCtrl,
    sound,
    isReducedMotion,
    isHidden,
    signal,
    onPlay: () => {
      els.startBtn.focus();
      board.start();
    },
  });

  // The board's tiles and keys.
  els.cells.forEach((cell, index) => {
    cell.addEventListener('click', () => board.cell(index));
    cell.addEventListener('keydown', (e) => {
      const next = cellForKey(index, e.key);
      if (next === null) return;
      e.preventDefault();
      els.cells[next]?.focus();
    });
  });
  els.startBtn.addEventListener('click', () => board.start());
  els.hintBtn.addEventListener('click', () => board.hint());
  els.nextCueBtn.addEventListener('click', () => board.nextCue());
  els.manualBtn.addEventListener('click', () => board.toggleManual());

  // Sound is a site preference; this key presents it.
  const syncSoundUi = () => {
    const on = prefs.isSoundOn();
    els.muteBtn.setAttribute('aria-pressed', String(on));
    els.muteBtn.textContent = copy.soundLabel(on);
  };
  syncSoundUi();
  prefs.onChange('sound', syncSoundUi, { signal });
  els.muteBtn.addEventListener('click', () => prefs.set('sound', prefs.isSoundOn() ? 'off' : 'on'));

  // Every press on a ripple surface counts on the cabinet's PULSES readout (the ripple itself is site-wide, Base.astro).
  lab.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement | null)?.closest('[data-crt-ripple]')) return;
    stageCtrl.recordInteraction('click-ripple');
    popup.syncHud();
  });
  popup.syncHud();

  prefs.onChange('motion', () => popup.syncPreview(), { signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      board.visibility(document.hidden);
      popup.visibility(document.hidden);
    },
    { signal },
  );

  // Leaving the page (ClientRouter): cancel timers and sequences, close the popup.
  return () => {
    board.dispose();
    popup.dispose();
  };
}
