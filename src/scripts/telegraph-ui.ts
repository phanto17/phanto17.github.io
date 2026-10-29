import {
  TELEGRAPH_STAGES,
  TelegraphEngine,
  TelegraphStageController,
  type PortalNodeId,
  type StageId,
} from './telegraph-engine';

declare global {
  interface Window {
    portfolioMotion?: boolean;
  }
}

const engine = new TelegraphEngine();
const stageCtrl = new TelegraphStageController();

const cells = Array.from(document.querySelectorAll<HTMLButtonElement>('#tg-grid .tg-cell'));
const statusEl = document.querySelector<HTMLElement>('#tg-status');
const waveEl = document.querySelector<HTMLElement>('#tg-wave');
const scoreEl = document.querySelector<HTMLElement>('#tg-score');
const startBtn = document.querySelector<HTMLButtonElement>('#tg-start');
const hintBtn = document.querySelector<HTMLButtonElement>('#tg-hint');
const muteBtn = document.querySelector<HTMLButtonElement>('#tg-mute');
const manualBtn = document.querySelector<HTMLButtonElement>('#tg-manual');
const nextCueBtn = document.querySelector<HTMLButtonElement>('#tg-next-cue');

// CRT Popup & StageRouter elements
const popupBackdrop = document.querySelector<HTMLDialogElement>('#tg-crt-popup');
const openPopupBtn = document.querySelector<HTMLButtonElement>('#tg-open-popup');
const closePopupBtn = document.querySelector<HTMLButtonElement>('#tg-close-popup');
const prevStageBtn = document.querySelector<HTMLButtonElement>('#crt-prev-stage');
const nextStageBtn = document.querySelector<HTMLButtonElement>('#crt-next-stage');
const stageRouter = document.querySelector<HTMLElement>('#tg-stage-router');
const stageCodeEl = document.querySelector<HTMLElement>('#crt-stage-code');
const stageTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.crt-stage-tab'));
const stageScenes = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-scene]'));
const previewCells = Array.from(document.querySelectorAll<HTMLElement>('[data-preview-cell]'));
const seqStepLabel = document.querySelector<HTMLElement>('#crt-seq-step-label');

// Non-linear portal elements
const portalBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-portal-id]'));
const popupPortalBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-popup-portal]'));
const portalProgressEl = document.querySelector<HTMLElement>('#tg-portal-progress');
const inspectorEl = document.querySelector<HTMLElement>('#tg-portal-inspector');
const inspectorCode = document.querySelector<HTMLElement>('#inspector-code');
const inspectorTitle = document.querySelector<HTMLElement>('#inspector-title');
const inspectorDetail = document.querySelector<HTMLElement>('#inspector-detail');
const inspectorLink = document.querySelector<HTMLAnchorElement>('#inspector-link');
const inspectorOpenStage3Btn = document.querySelector<HTMLButtonElement>('#inspector-open-stage3');

// Telemetry counters
const interactionCountEl = document.querySelector<HTMLElement>('#tg-interaction-count');
const currentStageBadgeEl = document.querySelector<HTMLElement>('#tg-current-stage-badge');

let muted = true;
let manualCues = false;
let pendingCue: (() => void) | null = null;
let audioCtx: AudioContext | null = null;
let playbackToken = 0;
let stage2Timer: number | null = null;
let nextWaveTimer: number | null = null;
let playingSequence: readonly number[] | null = null;
let replayOnReturn: readonly number[] | null = null;
let lastFocusedBeforeModal: HTMLElement | null = null;

const isReducedMotion = () => document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function playTone(freq: number, type: OscillatorType = 'triangle', duration = 0.11) {
  if (muted) return;
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* AudioContext unavailable or blocked */
  }
}

function syncTelemetryHud() {
  if (interactionCountEl) {
    interactionCountEl.textContent = String(stageCtrl.getInteractionCount());
  }
  if (currentStageBadgeEl) {
    const index = TELEGRAPH_STAGES.findIndex((stage) => stage.id === stageCtrl.getStage()) + 1;
    currentStageBadgeEl.textContent = `STG_${String(index).padStart(2, '0')}`;
  }
  if (portalProgressEl) {
    portalProgressEl.textContent = String(stageCtrl.getExploredPortals().length);
  }
}

// Per-click visual phosphor ripple + subtle synth click across any [data-crt-ripple] surface
function spawnPhosphorRipple(e: MouseEvent) {
  const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-crt-ripple]');
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const x = e.detail === 0 ? rect.width / 2 : e.clientX - rect.left;
  const y = e.detail === 0 ? rect.height / 2 : e.clientY - rect.top;

  stageCtrl.recordInteraction('click-ripple', target.id || target.className, { x: Math.round(x), y: Math.round(y) });
  syncTelemetryHud();

  if (!isReducedMotion()) {
    const ripple = document.createElement('span');
    ripple.className = 'crt-click-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => ripple.remove(), 650);
  }
}

document.querySelector('[data-crt-interactive-root]')?.addEventListener('click', (e) => {
  spawnPhosphorRipple(e as MouseEvent);
});

// Stage 2 automated preview animation loop
function startStage2PreviewLoop() {
  stopStage2PreviewLoop();
  if (document.hidden) return;
  const demoPath = [2, 5, 10, 13, 7, 8, 15];
  let step = 0;
  const tick = () => {
    previewCells.forEach((c) => c.classList.remove('is-lit'));
    const cellIdx = demoPath[step % demoPath.length];
    previewCells[cellIdx]?.classList.add('is-lit');
    const coord = TelegraphEngine.cellToCoord(cellIdx);
    if (seqStepLabel) {
      seqStepLabel.textContent = `CHUNK 0${(step % demoPath.length) + 1}/07 → ROW ${coord.row}, COL ${coord.col}`;
    }
    playTone(260 + (step % 7) * 45, 'sine', 0.07);
    step += 1;
  };
  tick();
  if (!isReducedMotion()) stage2Timer = window.setInterval(tick, 520);
}

function stopStage2PreviewLoop() {
  if (stage2Timer !== null) {
    window.clearInterval(stage2Timer);
    stage2Timer = null;
  }
  previewCells.forEach((c) => c.classList.remove('is-lit'));
}

const syncPreviewMotion = () => {
  if (popupBackdrop?.open && stageCtrl.getStage() === 'animation-sequence') startStage2PreviewLoop();
};
window.addEventListener('portfolio:motionchange', syncPreviewMotion);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncPreviewMotion);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopStage2PreviewLoop();
    if (playingSequence && !manualCues) {
      replayOnReturn = playingSequence;
      playingSequence = null;
      playbackToken++;
      clearBoardVisuals();
      if (statusEl) statusEl.textContent = 'Sequence paused. It will replay when you return.';
    }
  } else {
    syncPreviewMotion();
    const replay = replayOnReturn;
    replayOnReturn = null;
    if (replay) void playTelegraphSequence(replay);
  }
});

// StageRouter transition renderer
function renderStage(targetStage: StageId, focusScene = false) {
  const { to } = stageCtrl.transitionTo(targetStage);
  syncTelemetryHud();

  if (stageCodeEl) stageCodeEl.textContent = to.code;
  if (stageRouter) {
    stageRouter.setAttribute('data-transition', isReducedMotion() ? 'instant' : to.transition);
    stageRouter.classList.remove('is-transitioning');
    void stageRouter.offsetWidth;
    if (!isReducedMotion()) {
      stageRouter.classList.add('is-transitioning');
    }
  }

  stageScenes.forEach((scene) => {
    const isMatch = scene.getAttribute('data-stage-scene') === targetStage;
    scene.hidden = !isMatch;
    scene.classList.toggle('is-current', isMatch);
  });
  if (focusScene) {
    stageScenes.find((scene) => !scene.hidden)?.querySelector<HTMLElement>('h3')?.focus();
  }

  stageTabs.forEach((tab) => {
    const isMatch = tab.getAttribute('data-stage-target') === targetStage;
    tab.classList.toggle('is-active', isMatch);
    tab.setAttribute('aria-pressed', String(isMatch));
  });

  if (nextStageBtn) {
    nextStageBtn.textContent = to.ctaLabel;
  }
  if (prevStageBtn) prevStageBtn.hidden = targetStage === TELEGRAPH_STAGES[0].id;

  if (targetStage === 'animation-sequence') {
    startStage2PreviewLoop();
  } else {
    stopStage2PreviewLoop();
  }
  if (targetStage === 'title-intro' && window.portfolioMotion && !isReducedMotion()) {
    const logo = stageScenes.find((scene) => !scene.hidden)?.querySelector<HTMLElement>('.crt-logo-title');
    if (logo) void import('./motion').then((m) => m.riseTitle(logo));
  }

  playTone(targetStage === 'welcome' ? 330 : targetStage === 'animation-sequence' ? 440 : 587, 'triangle', 0.14);
}

function openCrtPopup(initialStage: StageId = TELEGRAPH_STAGES[0].id) {
  if (!popupBackdrop) return;
  lastFocusedBeforeModal = document.activeElement as HTMLElement | null;
  stageCtrl.setPopupOpen(true);
  popupBackdrop.showModal();
  renderStage(initialStage);
  closePopupBtn?.focus();
}

function closeCrtPopup() {
  if (!popupBackdrop?.open) return;
  stopStage2PreviewLoop();
  stageCtrl.setPopupOpen(false);
  popupBackdrop.close();
  syncTelemetryHud();
  playTone(220, 'sine', 0.1);
  lastFocusedBeforeModal?.focus();
}

openPopupBtn?.addEventListener('click', () => openCrtPopup());
closePopupBtn?.addEventListener('click', () => closeCrtPopup());
popupBackdrop?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCrtPopup();
});
inspectorOpenStage3Btn?.addEventListener('click', () => openCrtPopup('title-intro'));

popupBackdrop?.addEventListener('click', (e) => {
  if (e.target === popupBackdrop) closeCrtPopup();
});

prevStageBtn?.addEventListener('click', () => {
  const idx = TELEGRAPH_STAGES.findIndex((stage) => stage.id === stageCtrl.getStage());
  if (idx > 0) renderStage(TELEGRAPH_STAGES[idx - 1].id, true);
});

nextStageBtn?.addEventListener('click', () => {
  if (stageCtrl.getStageConfig().action === 'play') {
    closeCrtPopup();
    document.querySelector<HTMLElement>('#tg-start')?.focus();
    if (nextWaveTimer !== null) window.clearTimeout(nextWaveTimer);
    nextWaveTimer = null;
    if (startBtn) startBtn.textContent = '↻ Restart';
    const seq = engine.startCampaign();
    void playTelegraphSequence(seq);
    return;
  }
  const idx = TELEGRAPH_STAGES.findIndex((stage) => stage.id === stageCtrl.getStage());
  const next = TELEGRAPH_STAGES[idx + 1];
  if (next) renderStage(next.id, true);
});

stageTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-stage-target') as StageId | null;
    if (target) renderStage(target);
  });
});

// Focus trap + keyboard shortcuts inside PopupCRT
document.addEventListener('keydown', (e) => {
  if (!popupBackdrop?.open) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeCrtPopup();
    return;
  }
  const editable = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]');
  const shortcut = !editable && /^[1-9]$/.test(e.key) ? TELEGRAPH_STAGES[Number(e.key) - 1] : undefined;
  if (shortcut && !e.ctrlKey && !e.altKey && !e.metaKey) {
    renderStage(shortcut.id, true);
    return;
  }
  if (e.key === 'Tab') {
    const focusable = Array.from(
      popupBackdrop.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.closest('[hidden]'));
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
});

// Non-linear Portal selection logic
function activatePortalNode(portalId: PortalNodeId) {
  const { node } = stageCtrl.selectPortal(portalId);
  syncTelemetryHud();
  playTone(392, 'triangle', 0.1);

  portalBtns.forEach((btn) => {
    const id = btn.getAttribute('data-portal-id') as PortalNodeId;
    const isSelected = id === portalId;
    btn.classList.toggle('is-active', isSelected);
    if (isSelected) btn.classList.add('is-explored');
    btn.setAttribute('aria-pressed', String(isSelected));
    const statusBadge = btn.querySelector<HTMLElement>('.panel-status');
    if (statusBadge) {
      statusBadge.textContent = isSelected
        ? '● ACTIVE'
        : stageCtrl.getExploredPortals().includes(id)
          ? '✓ EXPLORED'
          : '○ PORTAL';
    }
  });

  if (inspectorCode) inspectorCode.innerHTML = `<b>${node.code}</b> · ${node.tag}`;
  if (inspectorTitle) inspectorTitle.textContent = node.title;
  if (inspectorDetail) inspectorDetail.textContent = node.detail;
  if (inspectorLink) {
    inspectorLink.href = node.projectHref ?? '#tg-grid';
    inspectorLink.textContent = node.projectLabel ?? 'Jump to 4×4 Tactical Board ↓';
  }
}

portalBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-portal-id') as PortalNodeId | null;
    if (id) activatePortalNode(id);
  });
});

popupPortalBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-popup-portal') as PortalNodeId | null;
    if (id) {
      activatePortalNode(id);
      closeCrtPopup();
      inspectorTitle?.focus({ preventScroll: true });
      inspectorEl?.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
  });
});

function clearBoardVisuals() {
  cells.forEach((cell) => {
    cell.classList.remove('telegraph', 'hit', 'miss');
    const badge = cell.querySelector<HTMLElement>('.step-badge');
    if (badge) badge.textContent = '';
  });
}

function syncHud() {
  if (waveEl) waveEl.textContent = String(engine.getWave());
  if (scoreEl) scoreEl.textContent = String(engine.getStreak());
  if (hintBtn) {
    hintBtn.textContent = `Forecast Hint (${engine.getHintsRemaining()})`;
    hintBtn.disabled = !engine.isAcceptingInput() || engine.getHintsRemaining() <= 0;
  }
}

async function playTelegraphSequence(seq: readonly number[]) {
  const myToken = ++playbackToken;
  replayOnReturn = null;
  pendingCue?.();
  pendingCue = null;
  engine.setAcceptingInput(false);
  clearBoardVisuals();
  syncHud();
  if (manualBtn) manualBtn.disabled = true;
  if (document.hidden && !manualCues) {
    replayOnReturn = seq;
    if (statusEl) statusEl.textContent = 'Sequence paused. It will replay when you return.';
    return;
  }
  playingSequence = seq;

  const waitForNextCue = () => new Promise<void>((resolve) => { pendingCue = resolve; });
  if (manualCues && nextCueBtn) {
    nextCueBtn.hidden = false;
    nextCueBtn.textContent = 'Show first cue';
    if (statusEl) statusEl.textContent = 'Press Show first cue when you are ready.';
    await waitForNextCue();
    if (myToken !== playbackToken) return;
  }

  const stepMs = isReducedMotion() ? 640 : 500;
  for (let i = 0; i < seq.length; i++) {
    if (myToken !== playbackToken) return;
    if (manualCues) clearBoardVisuals();
    const idx = seq[i];
    const cell = cells[idx];
    const badge = cell?.querySelector<HTMLElement>('.step-badge');
    cell?.classList.add('telegraph');
    if (badge) badge.textContent = String(i + 1);
    playTone(300 + i * 55, 'triangle', 0.12);

    if (statusEl) {
      const { row, col } = TelegraphEngine.cellToCoord(idx);
      statusEl.textContent = `Wave ${engine.getWave()} Telegraph ${i + 1} of ${seq.length}: Row ${row}, Col ${col}`;
    }

    if (manualCues && nextCueBtn) {
      nextCueBtn.textContent = i === seq.length - 1 ? 'Start recall' : 'Show next cue';
      await waitForNextCue();
    } else {
      await new Promise((r) => setTimeout(r, stepMs));
    }
    if (myToken !== playbackToken) return;

    if (!isReducedMotion()) {
      cell?.classList.remove('telegraph');
      if (badge) badge.textContent = '';
    }
    if (!manualCues) await new Promise((r) => setTimeout(r, 110));
  }

  if (myToken !== playbackToken) return;
  playingSequence = null;
  clearBoardVisuals();
  const focusWasOnCue = document.activeElement === nextCueBtn;
  if (nextCueBtn) nextCueBtn.hidden = true;
  if (manualBtn) manualBtn.disabled = false;
  engine.setAcceptingInput(true);
  syncHud();
  if (statusEl) {
    statusEl.textContent = `Your turn: reproduce all ${seq.length} telegraphed tiles in order.`;
  }
  if (focusWasOnCue) cells[0]?.focus();
}

function handleCellInput(idx: number) {
  const outcome = engine.submitCell(idx);
  if (outcome.kind === 'ignored') {
    const cell = cells[idx];
    cell?.classList.add('unavailable');
    window.setTimeout(() => cell?.classList.remove('unavailable'), 400);
    if (statusEl) {
      const prior = (statusEl.textContent ?? '').replace(/ (?:Wait for the sequence to finish|Start or restart a turn to play)\.$/, '');
      const waiting = playingSequence || replayOnReturn || nextWaveTimer !== null;
      const instruction = waiting ? 'Wait for the sequence to finish.' : 'Start or restart a turn to play.';
      statusEl.textContent = `${prior} ${instruction}`.trim();
    }
    playTone(210, 'sine', 0.05);
    return;
  }

  const cell = cells[idx];
  const badge = cell?.querySelector<HTMLElement>('.step-badge');

  if (outcome.kind === 'step-ok') {
    cell?.classList.add('hit');
    if (badge) badge.textContent = String(outcome.step);
    playTone(440 + outcome.step * 60, 'sine', 0.1);
    syncHud();
    if (statusEl) {
      statusEl.textContent = `Step ${outcome.step} of ${outcome.total} locked in.`;
    }
    return;
  }

  if (outcome.kind === 'wave-cleared') {
    cell?.classList.add('hit');
    if (badge) badge.textContent = String(engine.getSequence().length);
    playTone(660, 'triangle', 0.22);
    syncHud();
    if (statusEl) {
      statusEl.textContent = `Wave ${outcome.completedWave} resolved! Preparing Wave ${outcome.nextWave} (${outcome.nextLength} tiles)...`;
    }
    const nextSeq = engine.rollWaveSequence();
    nextWaveTimer = window.setTimeout(() => {
      nextWaveTimer = null;
      void playTelegraphSequence(nextSeq);
    }, 900);
    return;
  }

  if (outcome.kind === 'campaign-cleared') {
    cell?.classList.add('hit');
    if (badge) badge.textContent = String(engine.getSequence().length);
    playTone(784, 'triangle', 0.28);
    syncHud();
    if (statusEl) {
      statusEl.textContent = `Perfect 7-tile recall! All ${outcome.totalWaves} waves cleared (Streak: ${outcome.streak}).`;
    }
    if (startBtn) startBtn.textContent = '↻ Play Again';
    window.dispatchEvent(
      new CustomEvent('portfolio:track', {
        detail: { event: 'minigame-cleared', meta: `streak-${outcome.streak}`, ts: Date.now() },
      }),
    );
    return;
  }

  if (outcome.kind === 'disrupted') {
    cell?.classList.add('miss');
    const expCell = cells[outcome.expectedCell];
    expCell?.classList.add('telegraph');
    const expBadge = expCell?.querySelector<HTMLElement>('.step-badge');
    if (expBadge) expBadge.textContent = String(outcome.failedAtStep);
    playTone(110, 'sawtooth', 0.25);
    syncHud();
    if (statusEl) {
      const { row, col } = TelegraphEngine.cellToCoord(outcome.expectedCell);
      statusEl.textContent = `Telegraph missed at step ${outcome.failedAtStep} (expected Row ${row}, Col ${col}). Press Retry.`;
    }
    if (startBtn) startBtn.textContent = '↻ Retry from Wave 1';
  }
}

cells.forEach((cell, idx) => {
  cell.addEventListener('click', () => handleCellInput(idx));
  cell.addEventListener('keydown', (e) => {
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') next = row * 4 + ((col + 1) % 4);
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') next = row * 4 + ((col + 3) % 4);
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') next = ((row + 1) % 4) * 4 + col;
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') next = ((row + 3) % 4) * 4 + col;
    else return;
    e.preventDefault();
    cells[next]?.focus();
  });
});

startBtn?.addEventListener('click', () => {
  if (nextWaveTimer !== null) window.clearTimeout(nextWaveTimer);
  nextWaveTimer = null;
  startBtn.textContent = '↻ Restart';
  const seq = engine.startCampaign();
  void playTelegraphSequence(seq);
});

hintBtn?.addEventListener('click', () => {
  if (engine.useForecastHint()) {
    void playTelegraphSequence(engine.getSequence());
  }
});

muteBtn?.addEventListener('click', () => {
  muted = !muted;
  muteBtn.setAttribute('aria-pressed', String(!muted));
  muteBtn.textContent = muted ? 'Sound: off' : 'Sound: on';
});

manualBtn?.addEventListener('click', () => {
  manualCues = !manualCues;
  manualBtn.setAttribute('aria-pressed', String(manualCues));
  manualBtn.textContent = manualCues ? 'Manual cues: on' : 'Manual cues: off';
  if (statusEl) statusEl.textContent = manualCues
    ? 'Manual cues on. Start or restart a turn to advance each cue at your own pace.'
    : 'Manual cues off. The next sequence will play automatically.';
});

nextCueBtn?.addEventListener('click', () => {
  const resume = pendingCue;
  pendingCue = null;
  resume?.();
});
