// Phone performance sitting: drives the portfolio tab in a Chromium browser on an Android phone over
// adb-forwarded CDP (cold load, idle frame timing with the field on/off, a touch scroll, one game turn,
// a scroll trace). Setup: USB debugging on, `adb forward tcp:9222 localabstract:chrome_devtools_remote`,
// then take the page id from http://127.0.0.1:9222/json/list. Usage: node tools/phone-trace.mjs <pageId>
import { writeFileSync } from 'node:fs';

const pageId = process.argv[2];
const SITE = 'https://phanto17.github.io/';
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
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const waitEvent = (method, timeout = 20000) =>
  new Promise((res, rej) => {
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
await send('Network.enable');
const out = { device: 'Samsung SM-G781B (Galaxy S20 FE), Brave 156 (Chromium 156), USB CDP', when: new Date().toISOString() };

// ---------- A. cold load ----------
await send('Network.clearBrowserCache');
await send('Page.navigate', { url: 'about:blank' });
await sleep(500);
const nav = send('Page.navigate', { url: SITE });
const loaded = waitEvent('Page.loadEventFired', 30000);
await nav;
await loaded;
await sleep(7000); // let the lazy modules (field, GSAP) arrive and settle
out.coldLoad = await evaluate(`new Promise((done) => {
  const o = {};
  const nav = performance.getEntriesByType('navigation')[0];
  o.navigation = { ttfb: Math.round(nav.responseStart), domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), htmlTransferBytes: nav.transferSize, protocol: nav.nextHopProtocol };
  o.paint = Object.fromEntries(performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)]));
  const lcp = [], lt = [], ls = [];
  new PerformanceObserver((l) => lcp.push(...l.getEntries())).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => lt.push(...l.getEntries())).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => ls.push(...l.getEntries())).observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => {
    o.lcp = lcp.map((e) => ({ at: Math.round(e.startTime), size: e.size, element: (e.element?.tagName || '?') + (e.element?.className ? '.' + String(e.element.className).split(' ')[0] : '') }));
    o.longTasks = lt.map((e) => ({ at: Math.round(e.startTime), ms: Math.round(e.duration) }));
    o.cls = Number(ls.filter((e) => !e.hadRecentInput).reduce((s, e) => s + e.value, 0).toFixed(4));
    const res = performance.getEntriesByType('resource');
    o.resources = { count: res.length, transferBytes: res.reduce((s, r) => s + (r.transferSize || 0), 0),
      largest: res.map((r) => ({ name: r.name.replace(location.origin, '').slice(0, 60), bytes: r.transferSize, ms: Math.round(r.responseEnd - r.startTime) })).sort((a, b) => b.bytes - a.bytes).slice(0, 10) };
    o.flags = { hasField: document.documentElement.classList.contains('has-field'), jsMotion: document.documentElement.classList.contains('js-motion'), hidden: document.hidden, theme: document.documentElement.dataset.theme, motion: document.documentElement.dataset.motion };
    o.viewport = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, saveData: navigator.connection?.saveData, effectiveType: navigator.connection?.effectiveType, cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory };
    done(o);
  }, 300);
})`);

// ---------- B. idle frame timing, field on then off ----------
const frameSample = `new Promise((done) => {
  const deltas = []; const lt = [];
  const po = new PerformanceObserver((l) => lt.push(...l.getEntries())); po.observe({ type: 'longtask' });
  let last = performance.now(); const t0 = last;
  const tick = (now) => { deltas.push(now - last); last = now; if (now - t0 < 4000) requestAnimationFrame(tick); else finish(); };
  const finish = () => { po.disconnect(); deltas.shift(); deltas.sort((a, b) => a - b);
    const p = (q) => Number(deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * q))].toFixed(1));
    done({ frames: deltas.length, fps: Number((deltas.length / 4).toFixed(1)), frameMs: { p50: p(0.5), p95: p(0.95), max: Number(deltas[deltas.length - 1].toFixed(1)) }, framesOver33ms: deltas.filter((d) => d > 33).length, framesOver50ms: deltas.filter((d) => d > 50).length, longTasks: lt.map((e) => Math.round(e.duration)) }); };
  requestAnimationFrame(tick);
})`;
await evaluate(`window.scrollTo(0, 0)`);
await sleep(800);
out.idleFieldOn = await evaluate(frameSample);
await evaluate(`(() => { document.documentElement.dataset.motion = 'reduced'; window.dispatchEvent(new Event('portfolio:motionchange')); })()`);
await sleep(1500);
out.idleFieldOff = await evaluate(frameSample);
await evaluate(`(() => { delete document.documentElement.dataset.motion; window.dispatchEvent(new Event('portfolio:motionchange')); })()`);
await sleep(1500);

// ---------- C. scroll through the page (real touch gesture) with the field on ----------
const sampler = evaluate(frameSample.replace('< 4000', '< 6000').replace('deltas.length / 4', 'deltas.length / 6'));
await sleep(200);
const { w, h } = out.coldLoad.viewport;
await send('Input.synthesizeScrollGesture', { x: Math.round(w / 2), y: Math.round(h * 0.7), yDistance: -Math.round(h * 2.5), speed: 1400, gestureSourceType: 'touch' });
await sleep(400);
await send('Input.synthesizeScrollGesture', { x: Math.round(w / 2), y: Math.round(h * 0.7), yDistance: -Math.round(h * 2.5), speed: 1400, gestureSourceType: 'touch' });
out.scrollFieldOn = await sampler;
out.scrollFieldOn.scrollY = await evaluate('window.scrollY');

// ---------- D. one game turn with real taps ----------
await evaluate(`new Promise((r) => { document.getElementById('lab').scrollIntoView({ block: 'start', behavior: 'auto' }); setTimeout(r, 600); })`);
await evaluate(`(() => { window.__evt = []; new PerformanceObserver((l) => window.__evt.push(...l.getEntries().map((e) => ({ name: e.name, ms: Math.round(e.duration), target: e.target?.id || e.target?.className?.toString().slice(0, 20) })))).observe({ type: 'event', durationThreshold: 16 });
  window.__status = []; const st = document.getElementById('tg-status'); new MutationObserver(() => window.__status.push(st.textContent.trim())).observe(st, { childList: true, characterData: true, subtree: true }); })()`);
const tap = async (selector) => {
  const rect = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({ block: 'center', behavior: 'auto' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await sleep(250);
  const pt = { x: Math.round(rect.x), y: Math.round(rect.y) };
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
await tap('#tg-start');
await sleep(3500); // wave 1: three cues at 500 ms + gaps
const cues = await evaluate(`window.__status.map((s) => /Telegraph (\\d) of \\d: Row (\\d), Col (\\d)/.exec(s)).filter(Boolean).map((m) => ({ step: +m[1], idx: (m[2] - 1) * 4 + (m[3] - 1) }))`);
const seen = new Map(cues.map((c) => [c.step, c.idx]));
for (const step of [1, 2, 3]) if (seen.has(step)) await tap(`#tg-grid .tg-cell[data-idx="${seen.get(step)}"]`);
await sleep(1500);
out.gameTurn = await evaluate(`({ cues: window.__status.filter((s) => /Telegraph \\d of/.test(s)), lastStatus: window.__status.at(-1), inputEvents: window.__evt, worstInputMs: Math.max(0, ...window.__evt.map((e) => e.ms)) })`);

// ---------- E. tracing during a scroll: main-thread and GPU busy share ----------
await evaluate(`window.scrollTo(0, 0)`);
await sleep(800);
await send('Tracing.start', { categories: 'toplevel,disabled-by-default-devtools.timeline,devtools.timeline', transferMode: 'ReturnAsStream' });
const traceT0 = Date.now();
await send('Input.synthesizeScrollGesture', { x: Math.round(w / 2), y: Math.round(h * 0.7), yDistance: -Math.round(h * 3), speed: 1400, gestureSourceType: 'touch' });
await sleep(500);
const traceMs = Date.now() - traceT0;
const complete = waitEvent('Tracing.tracingComplete', 60000);
await send('Tracing.end');
const { stream } = await complete;
let json = '';
for (;;) { const c = await send('IO.read', { handle: stream, size: 1 << 20 }); json += c.base64Encoded ? Buffer.from(c.data, 'base64').toString() : c.data; if (c.eof) break; }
await send('IO.close', { handle: stream });
const events = JSON.parse(json).traceEvents ?? JSON.parse(json);
const names = {};
for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names[`${e.pid}:${e.tid}`] = e.args.name;
const busy = {};
let longest = { ms: 0 };
for (const e of events) {
  if (e.ph !== 'X' || !e.dur) continue;
  const tn = names[`${e.pid}:${e.tid}`];
  if (!['CrRendererMain', 'CrGpuMain', 'Compositor', 'VizCompositorThread'].includes(tn)) continue;
  if (e.cat.includes('toplevel') || e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask') {
    busy[tn] = (busy[tn] || 0) + e.dur / 1000;
    if (tn === 'CrRendererMain' && e.dur / 1000 > longest.ms) longest = { ms: Number((e.dur / 1000).toFixed(1)), name: e.name };
  }
}
out.scrollTrace = { windowMs: traceMs, busyMs: Object.fromEntries(Object.entries(busy).map(([k, v]) => [k, Math.round(v)])), busyPercent: Object.fromEntries(Object.entries(busy).map(([k, v]) => [k, Math.round((v / traceMs) * 100)])), longestRendererTask: longest, traceEvents: events.length };

writeFileSync('phone-trace-result.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
ws.close();
