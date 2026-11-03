/**
 * "Make a mess": the owner's name as throwable letters. A small fixed-timestep 2D solver (gravity,
 * wall bounces, circle collisions, a shockwave on an empty click), written by hand, no library.
 */
export interface LettersDeps { thud(v: number): void; shock(): void; ui(): void }

interface P { ch: string; x: number; y: number; vx: number; vy: number; r: number; a: number; w: number; c: string }

/** Every listener goes on `signal`, so leaving the page leaves nothing bound (src/scripts/page.ts). */
export function mountLetters(root: HTMLElement, word: string, deps: LettersDeps, { signal }: { signal: AbortSignal }) {
  const cv = root.querySelector<HTMLCanvasElement>('canvas')!, x = cv.getContext('2d')!;
  const gravBtn = root.querySelector<HTMLButtonElement>('[data-mess-gravity]')!, resetBtn = root.querySelector<HTMLButtonElement>('[data-mess-reset]')!;
  let W = 0, H = 0, dpr = 1, raf = 0, active = false, grav = true, grab: { p: P; tx: number; ty: number } | null = null, last = 0, acc = 0;
  let ring: { x: number; y: number; r: number; o: number } | null = null;
  const P: P[] = [];
  const COL = ['#f3e6d3', '#f27c52', '#7fd6c2', '#f6d370'];
  const font = () => getComputedStyle(root).getPropertyValue('--font-display') || 'Fraunces, Georgia, serif';
  function reset() {
    P.length = 0; const r = Math.max(22, Math.min(44, W / (word.length + 5)));
    [...word].forEach((ch, i) => P.push({ ch, x: W / 2 + (i - (word.length - 1) / 2) * r * 1.9, y: r + 10 + Math.random() * 40, vx: (Math.random() - 0.5) * 60, vy: 0, r, a: 0, w: 0, c: COL[i % 4] }));
  }
  function size() {
    dpr = Math.min(devicePixelRatio, 2); const b = cv.getBoundingClientRect(); W = b.width; H = b.height; cv.width = W * dpr; cv.height = H * dpr;
    if (!P.length) reset(); P.forEach((p) => { p.x = Math.min(W - p.r, p.x); p.y = Math.min(H - p.r, p.y); });
  }
  function step(dt: number) {
    const g = grav ? 1400 : 0, damp = grav ? 0.999 : 0.9995, e = 0.62;
    for (const p of P) {
      if (p === grab?.p) { p.vx = ((grab.tx - p.x) / dt) * 0.35; p.vy = ((grab.ty - p.y) / dt) * 0.35; }
      else { p.vy += g * dt; p.vx *= damp; p.vy *= damp; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.w * dt; p.w *= 0.995;
      if (p.x < p.r) { p.x = p.r; if (p.vx < 0) { p.vx *= -e; p.w += p.vy * 0.01; } }
      if (p.x > W - p.r) { p.x = W - p.r; if (p.vx > 0) { p.vx *= -e; p.w -= p.vy * 0.01; } }
      if (p.y < p.r) { p.y = p.r; if (p.vy < 0) p.vy *= -e; }
      if (p.y > H - p.r) { p.y = H - p.r; if (p.vy > 0) { if (p.vy > 200) deps.thud(p.vy / 60); p.vy *= -e; p.vx *= 0.97; p.w += p.vx * 0.012; } }
    }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r;
      if (d >= min) continue;
      const nx = dx / d, ny = dy / d, ov = (min - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv > 0) continue;
      const imp = (-(1 + 0.6) * rv) / 2; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; a.w -= imp * 0.008; b.w += imp * 0.008;
    }
  }
  function draw() {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (ring) { x.strokeStyle = `rgba(242,124,82,${ring.o})`; x.lineWidth = 2; x.beginPath(); x.arc(ring.x, ring.y, ring.r, 0, 6.3); x.stroke(); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const p of P) { x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.font = `600 ${p.r * 1.7}px ${font()}`; x.fillStyle = p.c; x.fillText(p.ch, 0, p.r * 0.05); x.restore(); }
  }
  function loop(t: number) {
    if (!active) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; acc += dt; const h = 1 / 120;
    while (acc >= h) { step(h); acc -= h; }
    if (ring) { ring.r += dt * 900; ring.o -= dt * 1.8; if (ring.o <= 0) ring = null; }
    draw();
  }
  function shock(sx: number, sy: number) {
    deps.shock(); ring = { x: sx, y: sy, r: 8, o: 0.9 };
    for (const p of P) { const dx = p.x - sx, dy = p.y - sy, d = Math.hypot(dx, dy) || 1, f = Math.max(0, 1 - d / (W * 0.8)) * 1500; p.vx += (dx / d) * f; p.vy += (dy / d) * f; p.w += (Math.random() - 0.5) * 8; }
  }
  const pos = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  cv.addEventListener('pointerdown', (e) => { const q = pos(e), hit = P.find((p) => Math.hypot(p.x - q.x, p.y - q.y) < p.r * 1.15); if (hit) { grab = { p: hit, tx: q.x, ty: q.y }; cv.setPointerCapture(e.pointerId); } else shock(q.x, q.y); }, { signal });
  cv.addEventListener('pointermove', (e) => { if (grab) { const q = pos(e); grab.tx = q.x; grab.ty = q.y; } }, { signal });
  const rel = () => { grab = null; }; cv.addEventListener('pointerup', rel, { signal }); cv.addEventListener('pointercancel', rel, { signal });
  resetBtn.addEventListener('click', () => { reset(); deps.ui(); }, { signal });
  gravBtn.addEventListener('click', () => { grav = !grav; gravBtn.setAttribute('aria-pressed', String(!grav)); deps.ui(); }, { signal });
  addEventListener('resize', () => { if (active) size(); }, { signal });
  return {
    start() { if (active) return; active = true; size(); last = performance.now(); raf = requestAnimationFrame(loop); },
    stop() { active = false; cancelAnimationFrame(raf); },
    state: () => P,
  };
}
