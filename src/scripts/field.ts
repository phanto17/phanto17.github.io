/**
 * Signal field — the animated, grainy, cursor-reactive colour field behind the page.
 *
 * One fullscreen WebGL quad at half resolution: domain-warped fractal noise ramps through the
 * theme's five `field-*` colours (sunset ochre / red / plum / teal in Prism), the cursor pulls and
 * brightens the field around itself, a per-pixel hash adds film grain, and everything is mixed
 * toward `bg` so text on the page keeps its contrast: the centre lane under the content column stays
 * darkest, the page edges glow. Under reduced motion (OS or site switch) it renders one still
 * frame; with no WebGL it does nothing and the CSS gradient on <body> stays.
 */

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_scroll;
uniform vec3 u_c0, u_c1, u_c2, u_c3, u_c4, u_bg; uniform float u_lane, u_edge, u_bloom, u_half, u_feather;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return v; }
vec3 ramp(float t){
  t = clamp(t, 0., 1.);
  vec3 c = mix(u_c0, u_c1, smoothstep(0.00, 0.30, t));
  c = mix(c, u_c2, smoothstep(0.30, 0.52, t));
  c = mix(c, u_c3, smoothstep(0.52, 0.76, t));
  c = mix(c, u_c4, smoothstep(0.76, 1.00, t));
  return c;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y + u_scroll * 0.00012);
  float t = u_time * 0.028;
  vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);
  float d = distance(p, m);
  vec2 pull = (m - p) * 0.45 * exp(-d * d * 2.2);
  vec2 q = vec2(fbm(p * 1.15 + t), fbm(p * 1.15 - t * 0.7 + 3.1));
  vec2 r = vec2(fbm(p + 1.9 * q + pull + vec2(1.7, 9.2) + t * 0.4), fbm(p + 1.9 * q - pull + vec2(8.3, 2.8) - t * 0.3));
  float f = fbm(p * 0.9 + 2.4 * r);
  vec3 col = ramp(f * 1.35 - 0.1);
  float lane = smoothstep(u_half, u_half + u_feather, abs(gl_FragCoord.x - u_res.x * 0.5));
  float intensity = mix(u_lane, u_edge, lane);
  col = mix(u_bg, col, intensity);
  col += u_c0 * u_bloom * exp(-d * d * 7.0) * lane;
  float g = hash(gl_FragCoord.xy + fract(u_time * 0.37) * 211.) - 0.5;
  col += g * 0.055;
  gl_FragColor = vec4(col, 1.);
}`;

type Uniforms = Record<string, WebGLUniformLocation | null>;

const root = document.documentElement;
const isReducedMotion = () => root.getAttribute('data-motion') === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function cssColour(name: string, fallback: string): [number, number, number] {
  const raw = getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as [number, number, number];
  const rgb = raw.match(/rgba?\(([^)]+)\)/);
  if (rgb) { const [r, g, b] = rgb[1].split(',').map((s) => Number(s.trim()) / 255); return [r, g, b]; }
  return [0.1, 0.09, 0.07];
}

export function init(canvas: HTMLCanvasElement): void {
  const gl = (canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) ||
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
  if (!gl) return;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
  } catch {
    return;
  }
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const u: Uniforms = {};
  ['u_res', 'u_time', 'u_mouse', 'u_scroll', 'u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_c4', 'u_bg', 'u_lane', 'u_edge', 'u_bloom', 'u_half', 'u_feather'].forEach((n) => (u[n] = gl.getUniformLocation(program, n)));

  // Theme colours: the six palette uniforms ease toward the new theme over a few frames instead of
  // snapping, so a theme change is a cross-fade in the field too (a still frame just takes the target).
  const target: number[][] = [];
  const current: number[][] = [];
  let settling = false;
  const applyTheme = () => {
    const names = ['--field-1', '--field-2', '--field-3', '--field-4', '--field-5', '--bg'];
    const fallback = ['#ed8a3f', '#e1241f', '#251218', '#162c30', '#445951', '#1a1713'];
    names.forEach((n, i) => {
      target[i] = cssColour(n, fallback[i]);
      if (!current[i]) current[i] = [...target[i]];
    });
    const num = (n: string, f: number) => parseFloat(getComputedStyle(root).getPropertyValue(n)) || f;
    gl.uniform1f(u.u_lane, num('--field-lane', 0.2));
    gl.uniform1f(u.u_edge, num('--field-edge', 0.62));
    gl.uniform1f(u.u_bloom, num('--field-bloom', 0.16));
    settling = true;
    kick();
  };
  /** Move the palette toward the theme and upload it; returns true while still moving. */
  const settleColours = (snap: boolean): boolean => {
    let moving = false;
    for (let i = 0; i < target.length; i++) {
      for (let k = 0; k < 3; k++) {
        const d = target[i][k] - current[i][k];
        if (snap || Math.abs(d) < 0.002) current[i][k] = target[i][k];
        else { current[i][k] += d * 0.14; moving = true; }
      }
      gl.uniform3fv(i < 5 ? u[`u_c${i}`] : u.u_bg, current[i]);
    }
    return moving;
  };

  let w = 0, h = 0;
  const resize = () => {
    const scale = 0.5;
    w = Math.max(1, Math.round(window.innerWidth * scale));
    h = Math.max(1, Math.round(window.innerHeight * scale));
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.u_res, w, h);
    // The dark lane follows the content column (container + gutters), not the viewport fraction.
    const container = parseFloat(getComputedStyle(root).getPropertyValue('--container')) || 1040;
    gl.uniform1f(u.u_half, (container / 2 + 32) * scale);
    gl.uniform1f(u.u_feather, 260 * scale);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const pointer = { x: 0.5, y: 0.55 };
  const mouse = { x: 0.5, y: 0.55 };
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX / window.innerWidth; pointer.y = 1 - e.clientY / window.innerHeight; }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.x = 0.5; pointer.y = 0.55; });

  const start = performance.now();
  let last = 0;
  let raf: number | null = null;
  const draw = (now: number) => {
    raf = null;
    const still = isReducedMotion();
    if (!still && now - last < 1000 / 30) { raf = requestAnimationFrame(draw); return; }
    last = now;
    const k = still ? 1 : 0.08;
    mouse.x += (pointer.x - mouse.x) * k; mouse.y += (pointer.y - mouse.y) * k;
    if (settling) settling = settleColours(still);
    gl.uniform1f(u.u_time, still ? 40 : (now - start) / 1000);
    gl.uniform2f(u.u_mouse, mouse.x, mouse.y);
    gl.uniform1f(u.u_scroll, window.scrollY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if ((!still || settling) && !document.hidden) raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (raf === null) raf = requestAnimationFrame(draw); };
  applyTheme();
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);
  kick();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  window.addEventListener('portfolio:motionchange', kick);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', kick);
  if (isReducedMotion()) window.addEventListener('scroll', () => kick(), { passive: true });
  root.classList.add('has-field');
}
