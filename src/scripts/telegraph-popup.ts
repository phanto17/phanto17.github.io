/**
 * The CRT popup of Telegraph Recall: the three-stage router, its preview loop, the focus trap and
 * keyboard shortcuts, the `#lab?stage=…` deep links, and the portal cards with their inspector. The
 * stage controller (telegraph-engine.ts) holds the state; this module presents it.
 */
import { TELEGRAPH_PORTAL_NODES, TELEGRAPH_STAGES, TelegraphEngine, TelegraphStageController, type PortalNodeId, type StageId } from './telegraph-engine';
import { shared } from './page';
import type { SoundPlayer } from './sound';
import * as copy from './telegraph-copy';

const STAGE_IDS = new Set<string>(TELEGRAPH_STAGES.map((stage) => stage.id));
const PORTAL_IDS = new Set<string>(TELEGRAPH_PORTAL_NODES.map((node) => node.id));

export const toStageId = (value: unknown): StageId | null => (typeof value === 'string' && STAGE_IDS.has(value) ? (value as StageId) : null);
export const toPortalId = (value: unknown): PortalNodeId | null =>
  typeof value === 'string' && PORTAL_IDS.has(value) ? (value as PortalNodeId) : null;

/** `#lab` or `#lab?stage=<StageId>`: the lab section, optionally with the popup open on a stage. */
export function parseLabHash(hash: string): { lab: boolean; stage: StageId | null } {
  const match = /^#lab(?:\?stage=([a-z-]+))?$/.exec(hash);
  if (!match) return { lab: false, stage: null };
  return { lab: true, stage: toStageId(match[1]) };
}

/** The stage a number key (1–3) selects inside the popup. */
export const stageForKey = (key: string): StageId | null => (/^[1-9]$/.test(key) ? (TELEGRAPH_STAGES[Number(key) - 1]?.id ?? null) : null);

/**
 * The hash to leave after closing: the one the visitor arrived with, unless that was itself a stage
 * deep link (then plain `#lab`).
 */
export const hashAfterClose = (hashBeforeOpen: string | null): string =>
  hashBeforeOpen !== null && !parseLabHash(hashBeforeOpen).stage ? hashBeforeOpen : '#lab';

/** The stage-2 preview's demo path over the 4×4 board. */
export const PREVIEW_PATH: readonly number[] = [2, 5, 10, 13, 7, 8, 15];
export const PREVIEW_STEP_MS = 520;

export interface PopupElements {
  dialog: HTMLDialogElement;
  openBtn: HTMLButtonElement;
  closeBtn: HTMLButtonElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  router: HTMLElement;
  stageCode: HTMLElement;
  tabs: HTMLButtonElement[];
  scenes: HTMLElement[];
  previewCells: HTMLElement[];
  seqStepLabel: HTMLElement;
  portalBtns: HTMLButtonElement[];
  popupPortalBtns: HTMLButtonElement[];
  portalProgress: HTMLElement;
  inspector: HTMLElement;
  inspectorCode: HTMLElement;
  inspectorTitle: HTMLElement;
  inspectorDetail: HTMLElement;
  inspectorLink: HTMLAnchorElement;
  inspectorOpenStage3: HTMLButtonElement;
  interactionCount: HTMLElement;
  stageBadge: HTMLElement;
}

export interface PopupDeps {
  /** The lab section (scrolled to on a deep link). */
  lab: HTMLElement;
  els: PopupElements;
  stageCtrl: TelegraphStageController;
  sound: SoundPlayer;
  isReducedMotion: () => boolean;
  isHidden: () => boolean;
  /** The page's signal, for the window/document listeners. */
  signal: AbortSignal;
  /** The last stage's key: the popup has closed, start the game. */
  onPlay: () => void;
}

export interface Popup {
  open(stage?: StageId): void;
  close(): void;
  isOpen(): boolean;
  /** Repaint the cabinet's readouts (interactions, stage, explored portals). */
  syncHud(): void;
  /** Motion allowed/reduced changed: restart the preview loop for the new rule. */
  syncPreview(): void;
  visibility(hidden: boolean): void;
  dispose(): void;
}

export function bindPopup(deps: PopupDeps): Popup {
  const { els, stageCtrl, sound, signal } = deps;
  const { dialog } = els;
  let previewTimer: number | null = null;
  let hashBeforeOpen: string | null = null;
  let lastFocusedBeforeModal: HTMLElement | null = null;

  const syncHud = () => {
    els.interactionCount.textContent = String(stageCtrl.getInteractionCount());
    els.stageBadge.textContent = copy.stageBadge(TELEGRAPH_STAGES.findIndex((stage) => stage.id === stageCtrl.getStage()) + 1);
    els.portalProgress.textContent = String(stageCtrl.getExploredPortals().length);
  };

  // Stage 2: an automated preview over the mini board.
  function startPreview() {
    stopPreview();
    if (deps.isHidden()) return;
    let step = 0;
    const tick = () => {
      els.previewCells.forEach((c) => c.classList.remove('is-lit'));
      const cell = PREVIEW_PATH[step % PREVIEW_PATH.length];
      els.previewCells[cell]?.classList.add('is-lit');
      els.seqStepLabel.textContent = copy.previewChunk((step % PREVIEW_PATH.length) + 1, PREVIEW_PATH.length, cell);
      sound.play('preview', step % PREVIEW_PATH.length);
      step += 1;
    };
    tick();
    if (!deps.isReducedMotion()) previewTimer = window.setInterval(tick, PREVIEW_STEP_MS);
  }
  function stopPreview() {
    if (previewTimer !== null) window.clearInterval(previewTimer);
    previewTimer = null;
    els.previewCells.forEach((c) => c.classList.remove('is-lit'));
  }
  const syncPreview = () => {
    if (dialog.open && stageCtrl.getStage() === 'animation-sequence') startPreview();
  };

  const replaceHash = (hash: string) => {
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
    } catch {
      /* history unavailable */
    }
  };

  function renderStage(stage: StageId, focusScene = false) {
    // Next/previous already moved the controller; a re-render of the current stage is not a second transition.
    const to = stageCtrl.getStage() === stage ? stageCtrl.getStageConfig() : stageCtrl.transitionTo(stage);
    syncHud();
    els.stageCode.textContent = to.code;
    const reduced = deps.isReducedMotion();
    els.router.setAttribute('data-transition', reduced ? 'instant' : to.transition);
    els.router.classList.remove('is-transitioning');
    void els.router.offsetWidth;
    if (!reduced) els.router.classList.add('is-transitioning');

    els.scenes.forEach((scene) => {
      const match = scene.getAttribute('data-stage-scene') === stage;
      scene.hidden = !match;
      scene.classList.toggle('is-current', match);
    });
    const scene = els.scenes.find((s) => !s.hidden);
    if (focusScene) scene?.querySelector<HTMLElement>('h3')?.focus();

    els.tabs.forEach((tab) => {
      const match = tab.getAttribute('data-stage-target') === stage;
      tab.classList.toggle('is-active', match);
      tab.setAttribute('aria-pressed', String(match));
    });
    els.nextBtn.textContent = to.ctaLabel;
    els.prevBtn.hidden = stage === TELEGRAPH_STAGES[0].id;

    if (stage === 'animation-sequence') startPreview();
    else stopPreview();
    if (stage === 'title-intro' && shared.motionReady && !reduced) {
      const logo = scene?.querySelector<HTMLElement>('.crt-logo-title');
      if (logo) void import('./motion').then((m) => m.riseTitle(logo));
    }

    sound.play(stage === 'welcome' ? 'stage-welcome' : stage === 'animation-sequence' ? 'stage-sequence' : 'stage-title');
    // While the popup is open the URL follows the stage (no history entries), so any stage can be shared.
    if (dialog.open) replaceHash(`#lab?stage=${stage}`);
  }

  function open(stage: StageId = TELEGRAPH_STAGES[0].id) {
    lastFocusedBeforeModal = document.activeElement as HTMLElement | null;
    hashBeforeOpen = location.hash;
    stageCtrl.recordInteraction('popup-toggle');
    shared.lenis?.stop();
    dialog.showModal();
    renderStage(stage);
    els.closeBtn.focus();
  }

  function close() {
    if (!dialog.open) return;
    stopPreview();
    stageCtrl.recordInteraction('popup-toggle');
    dialog.close();
    shared.lenis?.start();
    syncHud();
    sound.play('close');
    replaceHash(hashAfterClose(hashBeforeOpen));
    hashBeforeOpen = null;
    // Back to the element that opened the popup; if it cannot take focus any more (the signal landing's
    // key is hidden once it has been used, a deep link had none), the lab's own key stands in.
    const back = lastFocusedBeforeModal;
    lastFocusedBeforeModal = null;
    back?.focus();
    if (!back || document.activeElement !== back) els.openBtn.focus();
  }

  const applyLabHash = () => {
    const { lab, stage } = parseLabHash(location.hash);
    if (!lab || !stage) return;
    // No element has the id `lab?stage=…`, so the browser could not scroll there itself. Through Lenis
    // when smooth scroll is on (its CSS makes native smooth scrolling instant).
    const reduced = deps.isReducedMotion();
    if (shared.lenis && !reduced) shared.lenis.scrollTo(deps.lab, { offset: 0 }); // Lenis applies the root scroll-padding itself
    else deps.lab.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (dialog.open) {
      if (stageCtrl.getStage() !== stage) renderStage(stage, true);
      return;
    }
    open(stage);
  };
  window.addEventListener('hashchange', applyLabHash, { signal });

  els.openBtn.addEventListener('click', () => open());
  els.closeBtn.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  els.inspectorOpenStage3.addEventListener('click', () => open('title-intro'));

  els.prevBtn.addEventListener('click', () => {
    const prev = stageCtrl.prevStage();
    if (prev) renderStage(prev.id, true);
  });
  els.nextBtn.addEventListener('click', () => {
    if (stageCtrl.getStageConfig().action === 'play') {
      close();
      deps.onPlay();
      return;
    }
    const next = stageCtrl.nextStage();
    if (next) renderStage(next.id, true);
  });
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = toStageId(tab.getAttribute('data-stage-target'));
      if (target) renderStage(target);
    });
  });

  // Focus trap + keyboard shortcuts while the popup is open.
  document.addEventListener(
    'keydown',
    (e) => {
      if (!dialog.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      const editable = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]');
      const shortcut = editable || e.ctrlKey || e.altKey || e.metaKey ? null : stageForKey(e.key);
      if (shortcut) {
        renderStage(shortcut, true);
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter(
          (el) => !el.closest('[hidden]'),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    { signal },
  );

  // Portal cards and their inspector.
  function activatePortal(portalId: PortalNodeId) {
    const node = stageCtrl.selectPortal(portalId);
    syncHud();
    sound.play('portal');
    els.portalBtns.forEach((btn) => {
      const id = toPortalId(btn.getAttribute('data-portal-id'));
      const selected = id === portalId;
      btn.classList.toggle('is-active', selected);
      if (selected) btn.classList.add('is-explored');
      btn.setAttribute('aria-pressed', String(selected));
      const badge = btn.querySelector<HTMLElement>('.panel-status');
      if (badge) badge.textContent = copy.portalStatus(selected, id !== null && stageCtrl.isExplored(id));
    });
    els.inspectorCode.innerHTML = copy.inspectorCodeHtml(node);
    els.inspectorTitle.textContent = node.title;
    els.inspectorDetail.textContent = node.detail;
    const link = copy.inspectorLink(node);
    els.inspectorLink.href = link.href;
    els.inspectorLink.textContent = link.label;
  }
  els.portalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = toPortalId(btn.getAttribute('data-portal-id'));
      if (id) activatePortal(id);
    });
  });
  els.popupPortalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = toPortalId(btn.getAttribute('data-popup-portal'));
      if (!id) return;
      activatePortal(id);
      close();
      els.inspectorTitle.focus({ preventScroll: true });
      els.inspector.scrollIntoView({ behavior: deps.isReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    });
  });

  // Arriving on `/#lab?stage=…` (first load or client-side navigation): open the popup on that stage.
  applyLabHash();

  return {
    open,
    close,
    isOpen: () => dialog.open,
    syncHud,
    syncPreview,
    visibility(hidden) {
      if (hidden) stopPreview();
      else syncPreview();
    },
    dispose() {
      stopPreview();
      if (dialog.open) {
        dialog.close();
        shared.lenis?.start();
      }
    },
  };
}

/** For the DOM adapter: the engine's coordinate helper, re-exported so the composition imports one module. */
export const cellToCoord = TelegraphEngine.cellToCoord;
