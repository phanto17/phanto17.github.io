// Phone performance sitting, second pass: the signal field's own cost (idle tracing with the field
// running vs stopped) and a real game turn with taps. Same setup as phone-trace.mjs.
// Usage: node tools/phone-field-cost.mjs <pageId>
import { writeFileSync } from 'node:fs';

const pageId = process.argv[2];
const ws = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${pageId}`);
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  } else if (msg.method) listeners.forEach((l) => l(msg));
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const waitEvent = (method, timeout = 60000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout ${method}`)), timeout);
  const l = (msg) => { if (msg.method === method) { clearTimeout(t); listeners.splice(listeners.indexOf(l), 1); res(msg.params); } };
  listeners.push(l);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception?.description));
  return r.result.value;
};
await send('Page.enable');
await send('Runtime.enable');

const traceWindow = async (ms) => {
  await send('Tracing.start', { categories: 'toplevel,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const t0 = Date.now();
  await sleep(ms);
  const windowMs = Date.now() - t0;
  const complete = waitEvent('Tracing.tracingComplete');
  await send('Tracing.end');
  const { stream } = await complete;
  let json = '';
  for (;;) { const c = await send('IO.read', { handle: stream, size: 1 << 20 }); json += c.base64Encoded ? Buffer.from(c.data, 'base64').toString() : c.data; if (c.eof) break; }
  await send('IO.close', { handle: stream });
  const events = JSON.parse(json).traceEvents ?? JSON.parse(json);
  const names = {};
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names[`${e.pid}:${e.tid}`] = e.args.name;
  const busy = {};
  let longest = 0;
  for (const e of events) {
    if (e.ph !== 'X' || !e.dur) continue;
    const tn = names[`${e.pid}:${e.tid}`];
    if (!['CrRendererMain', 'CrGpuMain', 'Compositor', 'VizCompositorThread'].includes(tn)) continue;
    if (e.cat.includes('toplevel')) {
      busy[tn] = (busy[tn] || 0) + e.dur / 1000;
      if (tn === 'CrRendererMain') longest = Math.max(longest, e.dur / 1000);
    }
  }
  return { windowMs, busyPercent: Object.fromEntries(Object.entries(busy).map(([k, v]) => [k, Math.round((v / windowMs) * 100)])), longestRendererTaskMs: Number(longest.toFixed(1)) };
};

const out = {};
await evaluate(`window.scrollTo(0, 0)`);
await sleep(1000);
out.flags = await evaluate(`({ theme: document.documentElement.dataset.theme, hasField: document.documentElement.classList.contains('has-field'), hidden: document.hidden })`);
out.idleTraceFieldOn = await traceWindow(4000);
await evaluate(`(() => { document.documentElement.dataset.motion = 'reduced'; window.dispatchEvent(new Event('portfolio:motionchange')); })()`);
await sleep(1500);
out.idleTraceFieldOff = await traceWindow(4000);
// Field off but motion otherwise on: hide the canvas and stop its loop by removing it (nothing else draws at idle).
await evaluate(`(() => { delete document.documentElement.dataset.motion; window.dispatchEvent(new Event('portfolio:motionchange')); })()`);
await sleep(1500);
out.idleTraceFieldOnAgain = await traceWindow(4000);

// ---- a real game turn ----
await evaluate(`new Promise((r) => { document.getElementById('lab').scrollIntoView({ block: 'start', behavior: 'auto' }); setTimeout(r, 1800); })`);
await evaluate(`(() => { window.__evt = []; new PerformanceObserver((l) => window.__evt.push(...l.getEntries().map((e) => ({ name: e.name, ms: Math.round(e.duration), target: e.target?.id || String(e.target?.className || '').slice(0, 24) })))).observe({ type: 'event', durationThreshold: 16 });
  window.__status = []; const st = document.getElementById('tg-status'); new MutationObserver(() => window.__status.push(st.textContent.trim())).observe(st, { childList: true, characterData: true, subtree: true }); })()`);
const tap = async (selector) => {
  const rect = await evaluate(`new Promise((r) => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({ block: 'center', behavior: 'auto' }); setTimeout(() => { const b = el.getBoundingClientRect(); r({ x: b.left + b.width / 2, y: b.top + b.height / 2, vis: getComputedStyle(el).visibility, hit: document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)?.id }); }, 900); })`);
  const pt = { x: Math.round(rect.x), y: Math.round(rect.y) };
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  return rect;
};
out.startTap = await tap('#tg-start');
await sleep(3500);
const cues = await evaluate(`window.__status.map((s) => /Telegraph (\\d) of \\d: Row (\\d), Col (\\d)/.exec(s)).filter(Boolean).map((m) => ({ step: +m[1], idx: (m[2] - 1) * 4 + (m[3] - 1) }))`);
const seen = new Map(cues.map((c) => [c.step, c.idx]));
for (const step of [1, 2, 3]) if (seen.has(step)) await tap(`#tg-grid .tg-cell[data-idx="${seen.get(step)}"]`);
await sleep(1500);
out.gameTurn = await evaluate(`({ statuses: window.__status, inputEvents: window.__evt.filter((e) => ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend'].includes(e.name)), worstInputMs: Math.max(0, ...window.__evt.map((e) => e.ms)) })`);
writeFileSync('phone-field-cost-result.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
ws.close();
