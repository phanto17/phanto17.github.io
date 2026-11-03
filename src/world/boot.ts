/**
 * Boots the field map after Explore: creates the engine, binds the HUD, the field log, the minimap,
 * Dev Mode, the drawer (panels are the component's <template>s) and the Lab overlay. Sound goes
 * through the site's cue table and preference; nothing here has its own settings store.
 */
import { createEngine, type Engine, type View, type OverlayKey } from './engine';
import { startAmbient, type Ambient } from './ambient';
import { mountLetters } from './letters';
import { fmtHour, phaseName, poznanHour } from './light';
import type { Location, ProjectSeed, LandmarkSeed } from './gen';
import { prefs } from '../scripts/prefs';
import { sound, audioContext } from '../scripts/sound';

interface WorldData { seeds: ProjectSeed[]; landmarks: LandmarkSeed[]; word: string }
const VISITED_KEY = 'portfolio-world-visited';

const read = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') as string[]; } catch { return []; } };
const write = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the log just does not persist */ } };

export function bootWorld(root: HTMLElement, { signal }: { signal: AbortSignal }) {
  const $ = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel) as T;
  const $$ = <T extends HTMLElement>(sel: string): T[] => Array.from(root.querySelectorAll<T>(sel));
  const data = JSON.parse($('#world-data').textContent ?? '{}') as WorldData;
  const canvas = $<HTMLCanvasElement>('#world-gl'), start = $('#world-start'), hud = $('#world-hud'), dev = $('#world-dev'), drawer = $('#world-drawer'), lab = $('#world-lab');
  const visited = new Set(read(VISITED_KEY));
  let engine: Engine | null = null, openId: string | null = null, hintDone = false, lastTick = 0, ambient: Ambient | null = null, letters: ReturnType<typeof mountLetters> | null = null;

  // ── Sound: the site's cues, plus the ambient bed while sound is on ──────────────
  const sfx = { step: () => sound.play('walk'), ui: () => sound.play('click'), arrive: () => sound.play('arrive') };
  const syncAmbient = () => {
    const on = prefs.isSoundOn();
    if (on && !ambient) { const ctx = audioContext(); if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); ambient = startAmbient(ctx); } }
    if (!on && ambient) { ambient.stop(); ambient = null; }
    const key = $('#world-sound'); key.setAttribute('aria-pressed', String(on)); key.textContent = `Sound: ${on ? 'on' : 'off'}`;
  };
  prefs.onChange('sound', syncAmbient, { signal });
  $('#world-sound').addEventListener('click', () => prefs.set('sound', prefs.isSoundOn() ? 'off' : 'on'), { signal });

  // ── Engine ──────────────────────────────────────────────────────────────────────
  try {
    engine = createEngine(canvas, $('#world-labels'), {
      projects: data.seeds, landmarks: data.landmarks, motion: prefs.isMotionAllowed(), sfx,
      on: {
        world: () => { if (engine) renderLog(); },
        open: (l) => openLoc(l),
        near: (l) => { const p = $('#world-prompt'); if (l) { $('#world-prompt-name').textContent = l.title; p.hidden = false; } else p.hidden = true; },
        view: (v) => $$('#world-views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v))),
        frame: () => { if (engine) tick(); },
      },
    });
  } catch (error) {
    console.warn('The map needs WebGL; the overview has everything.', error);
    $('#world-nogl').hidden = false; $('#world-enter-sound').hidden = true; $('#world-enter-quiet').hidden = true;
    return { dispose() {} };
  }
  const eng: Engine = engine;
  eng.attachMinimap($<HTMLCanvasElement>('#world-mini'));
  renderLog();
  prefs.onChange('motion', () => eng.setMotion(prefs.isMotionAllowed()), { signal });

  // ── Start ───────────────────────────────────────────────────────────────────────
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function montage() {
    if (!prefs.isMotionAllowed()) return;
    const f = $('#world-pass'); f.hidden = false;
    for (const v of ['wireframe', 'normals', 'clay'] as View[]) { eng.setView(v); f.textContent = `Render pass: ${v}`; await wait(330); }
    eng.setView('beauty'); f.hidden = true;
  }
  async function begin() {
    syncAmbient();
    start.classList.add('is-leaving'); eng.start(); hud.hidden = false;
    await montage();
    setTimeout(() => { start.hidden = true; }, 500);
    const hash = location.hash.replace(/^#/, '').split('?')[0];
    if (hash === 'lab') openLab();
    else if (hash) { const l = eng.locOf(hash); if (l) openLoc(l); }
  }
  void begin();

  // ── Panels ──────────────────────────────────────────────────────────────────────
  function openLoc(l: Location) {
    if (l.kind === 'uncharted') return;
    markVisited(l.id);
    if (l.kind === 'lab') { openLab(); eng.goTo(l); return; }
    const tpl = root.querySelector<HTMLTemplateElement>(`template[data-panel="${CSS.escape(l.id)}"]`); if (!tpl) return;
    openId = l.id;
    const body = $('#world-drawer-body'); body.replaceChildren(tpl.content.cloneNode(true)); body.scrollTop = 0;
    body.querySelector<HTMLVideoElement>('video')?.play().catch(() => {});
    bindCopy(body);
    drawer.hidden = false; drawer.style.setProperty('--acc', l.accent); requestAnimationFrame(() => drawer.classList.add('is-open'));
    $('#world-drawer-close').focus({ preventScroll: true });
    sound.play('open');
    eng.goTo(l); const phone = innerWidth < 760; eng.setShift(phone ? 0 : 11, phone ? 5 : 0);
    history.replaceState(null, '', `#${l.id}`);
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.classList.remove('is-open'); openId = null; eng.setShift(0, 0); sound.play('close');
    if (location.hash) history.replaceState(null, '', location.pathname);
    setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 260);
  }
  function bindCopy(scope: HTMLElement) {
    const b = scope.querySelector<HTMLButtonElement>('[data-copy-mail]'), mail = scope.querySelector<HTMLElement>('[data-mail]'); if (!b || !mail) return;
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mail.textContent ?? ''); b.textContent = 'Copied'; }
      catch { const r = document.createRange(); r.selectNodeContents(mail); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); b.textContent = 'Selected: press Ctrl+C'; }
      setTimeout(() => (b.textContent = 'Copy'), 1800);
    });
  }
  function markVisited(id: string) { if (visited.has(id)) return; visited.add(id); write(VISITED_KEY, [...visited]); renderLog(); }

  // ── The Lab ─────────────────────────────────────────────────────────────────────
  function openLab(tab = 'recall') {
    lab.hidden = false; eng.setLocked(true); sound.play('open');
    letters ??= mountLetters($('[data-lab-panel="mess"]'), data.word, { thud: () => sound.play('thud'), shock: () => sound.play('shock'), ui: () => sound.play('click') });
    setLabTab(tab); $('#world-lab-close').focus({ preventScroll: true });
    history.replaceState(null, '', '#lab');
  }
  function setLabTab(t: string) {
    $$('[data-lab-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.labTab === t)));
    $$('[data-lab-panel]').forEach((p) => (p.hidden = p.dataset.labPanel !== t));
    if (t === 'mess') letters?.start(); else letters?.stop();
  }
  function closeLab() {
    if (lab.hidden) return;
    lab.hidden = true; letters?.stop(); eng.setLocked(false); sound.play('close');
    if (location.hash) history.replaceState(null, '', location.pathname);
  }
  $('#world-lab-close').addEventListener('click', closeLab, { signal });
  $$('[data-lab-tab]').forEach((b) => b.addEventListener('click', () => setLabTab(b.dataset.labTab ?? 'recall'), { signal }));

  // ── HUD ─────────────────────────────────────────────────────────────────────────
  function renderLog() {
    const locs = eng.S.locs.filter((l) => l.kind !== 'uncharted'), done = locs.filter((l) => visited.has(l.id)).length;
    $('#world-log-count').textContent = `${done}/${locs.length} explored`;
    const list = $('#world-log-list'); list.replaceChildren();
    for (const l of locs) {
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--acc', l.accent);
      const dot = document.createElement('i'); dot.className = 'world-dot' + (visited.has(l.id) ? ' is-done' : ''); dot.setAttribute('aria-hidden', 'true');
      const t = document.createElement('span'); t.textContent = l.title;
      b.append(dot, t); if (visited.has(l.id)) { const v = document.createElement('span'); v.className = 'sr-only'; v.textContent = ' (visited)'; b.append(v); }
      b.addEventListener('click', () => { openLoc(l); if (innerWidth < 760) $('#world-log').classList.remove('is-open'); });
      li.append(b); list.append(li);
    }
  }
  $('#world-log-toggle').addEventListener('click', () => $('#world-log').classList.toggle('is-open'), { signal });
  $('#world-prompt-open').addEventListener('click', () => { if (eng.S.near) openLoc(eng.S.near); }, { signal });
  $('#world-drawer-close').addEventListener('click', closeDrawer, { signal });
  $<HTMLCanvasElement>('#world-mini').addEventListener('click', (e) => {
    const cv = e.currentTarget as HTMLCanvasElement, b = cv.getBoundingClientRect(), k = cv.width / b.width, w = eng.minimapToWorld((e.clientX - b.left) * k, (e.clientY - b.top) * k);
    const hit = eng.S.locs.filter((l) => l.kind !== 'uncharted').map((l) => ({ l, d: Math.hypot(l.x - w.x, l.z - w.z) })).sort((a, c) => a.d - c.d)[0];
    if (hit && hit.d < 7) eng.goTo(hit.l); else eng.walkTo(w.x, w.z);
  }, { signal });

  // ── Dev Mode ────────────────────────────────────────────────────────────────────
  function setDev(on: boolean) {
    eng.setDev(on); dev.hidden = !on; $('#world-log').classList.toggle('is-dev', on);
    const key = $('#world-dev-key'); key.setAttribute('aria-pressed', String(on)); key.textContent = `Dev Mode: ${on ? 'on' : 'off'}`;
    if (on) refreshDevTime();
  }
  const refreshDevTime = () => {
    const S = eng.S, r = $<HTMLInputElement>('#world-time-range');
    if (S.hourOverride == null) r.value = String(poznanHour());
    $('#world-time-val').textContent = `${fmtHour(S.hour)} · ${phaseName(S.hour)}`;
    $<HTMLButtonElement>('#world-time-now').disabled = S.hourOverride == null;
  };
  $('#world-dev-key').addEventListener('click', () => setDev(!eng.S.dev), { signal });
  $('#world-dev-close').addEventListener('click', () => setDev(false), { signal });
  $$('#world-views button').forEach((b) => b.addEventListener('click', () => eng.setView(b.dataset.view as View), { signal }));
  $$<HTMLInputElement>('#world-overlays input').forEach((c) => c.addEventListener('change', () => eng.setOverlay(c.dataset.ovl as OverlayKey, c.checked), { signal }));
  $<HTMLInputElement>('#world-time-range').addEventListener('input', (e) => { eng.setHourOverride(Number((e.target as HTMLInputElement).value)); refreshDevTime(); }, { signal });
  $('#world-time-now').addEventListener('click', () => { eng.setHourOverride(null); refreshDevTime(); }, { signal });
  let testN = 0; const ACC = ['#9dd96a', '#ff9ec7', '#7ab8ff', '#ffd166'];
  $('#world-add').addEventListener('click', () => {
    testN++;
    const id = `test-${testN}`;
    eng.addProject({ id, title: `Test Project ${testN}`, kind: 'generic', accent: ACC[testN % 4], eyebrow: 'Added from Dev Mode' });
    $<HTMLButtonElement>('#world-remove').disabled = false;
    const l = eng.locOf(id); if (l) eng.goTo(l);
    $('#world-add-msg').textContent = `${l?.title} added: a free slot, a path to the nearest location, a label and a log entry. Nothing else moved.`;
  }, { signal });
  $('#world-remove').addEventListener('click', () => { eng.resetProjects(data.seeds); testN = 0; $<HTMLButtonElement>('#world-remove').disabled = true; closeDrawer(); $('#world-add-msg').textContent = 'Back to the real project list.'; }, { signal });

  // ── Keyboard ────────────────────────────────────────────────────────────────────
  addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range' && (target as HTMLInputElement).type !== 'checkbox' || target.tagName === 'TEXTAREA')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') { if (!lab.hidden) { if (!document.querySelector('dialog[open]')) closeLab(); } else if (!drawer.hidden) closeDrawer(); else if (eng.S.dev) setDev(false); return; }
    if (eng.S.cam.intro || !lab.hidden) return;
    if (e.code === 'Backquote') { e.preventDefault(); setDev(!eng.S.dev); return; }
    const control = target?.closest?.<HTMLElement>('button, a, input');
    if ((e.code === 'Enter' || e.code === 'KeyE') && eng.S.near && drawer.hidden && (e.code === 'KeyE' || !control || !control.offsetParent)) { e.preventDefault(); openLoc(eng.S.near); return; }
    if (eng.S.dev) {
      const n = '12345'.indexOf(e.key); if (n >= 0) { eng.setView(eng.VIEWS[n]); return; }
      const map: Record<string, OverlayKey> = { KeyN: 'nav', KeyC: 'colliders', KeyI: 'ai', KeyP: 'path' }, k = map[e.code];
      if (k) { const c = $<HTMLInputElement>(`#world-overlays input[data-ovl="${k}"]`); c.checked = !c.checked; eng.setOverlay(k, c.checked); }
    }
  }, { signal });
  // After a mouse click on the HUD, hand the keyboard back to the world so Enter and WASD keep working.
  root.addEventListener('click', (e) => { if (e.detail > 0 && (e.target as HTMLElement).closest('.world-hud, .world-dev')) (document.activeElement as HTMLElement | null)?.blur?.(); }, { signal });

  // ── Per-frame readouts (throttled) ──────────────────────────────────────────────
  function tick() {
    const S = eng.S;
    if (S.player.moving && !hintDone) { hintDone = true; $('#world-hint').classList.add('is-fade'); setTimeout(() => ($('#world-hint').hidden = true), 2200); }
    const now = performance.now(); if (now - lastTick < 250) return; lastTick = now;
    $('#world-clock-time').textContent = fmtHour(S.hour); $('#world-clock-phase').textContent = phaseName(S.hour);
    ambient?.setNight(S.night);
    const note = $('#world-drawer-body').querySelector<HTMLElement>('[data-dev-note]');
    if (!S.dev) { if (note) note.hidden = true; return; }
    const g = S.grid, r = eng.info();
    $('#world-stat-fps').textContent = `${S.fps.toFixed(0)} fps · ${S.ms.toFixed(1)} ms · ${eng.quality().pr}x`;
    $('#world-stat-draw').textContent = `${r.calls} calls · ${(r.triangles / 1000).toFixed(1)}k tris`;
    $('#world-stat-world').textContent = `${g.land} tiles · ${g.walkable} walkable`;
    $('#world-stat-actors').textContent = `${S.critters.length} AI · ${S.locs.length - 1} locations`;
    $('#world-stat-bfs').textContent = S.lastBfs.n ? `${S.lastBfs.n} explored · ${S.lastBfs.ms.toFixed(2)} ms · ${S.lastBfs.len} steps` : 'Click the ground to run it';
    const near = S.near ? S.dioramas.find((d) => d.loc === S.near) : null;
    $('#world-stat-near').textContent = near ? near.info() : 'Walk to a location';
    refreshDevTime();
    if (note) { const d = S.dioramas.find((x) => x.loc.id === openId); note.hidden = !d; if (d) note.textContent = `Live diorama state: ${d.info()}`; }
  }

  // Test hooks (tools/check-browser.cjs).
  (window as unknown as { __world?: unknown }).__world = { eng, openLoc, openLab, setDev, letters: () => letters };
  return {
    dispose() { ambient?.stop(); letters?.stop(); eng.dispose(); delete (window as unknown as { __world?: unknown }).__world; },
  };
}
