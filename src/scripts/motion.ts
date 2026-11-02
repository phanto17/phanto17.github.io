/**
 * Motion toolkit — the one place GSAP is imported on the site.
 *
 * Loaded lazily by Base.astro after the `load` event, only when motion is allowed (no OS
 * reduced-motion preference, site motion switch on, no data saver). Everything here is additive:
 * the CSS reveal and the kinetic H1 work without it. Durations and staggers are read from the
 * design-system tokens (src/styles/tokens.css) so the choreography and the stylesheet agree.
 *
 * Phase 2 of docs: "GSAP foundation" and "Kinetic type with SplitText".
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { onPage, shared } from './page';
import { prefs } from './prefs';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const token = (name: string, fallback: string): string => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
/** "550ms" | "0.55s" | "28s" → seconds. */
const seconds = (value: string): number => (value.endsWith('ms') ? parseFloat(value) / 1000 : parseFloat(value));

/** Timing read from the token file; the same numbers the CSS uses. */
export const timing = {
  reveal: seconds(token('--t-reveal', '550ms')),
  lift: seconds(token('--t-lift', '250ms')),
  staggerReveal: seconds(token('--stagger-reveal', '70ms')),
  staggerWord: seconds(token('--stagger-word', '75ms')),
  /** ease-out-expo (0.22, 1, 0.36, 1) is the house curve; GSAP's expo.out is its closest built-in. */
  ease: 'expo.out',
  easeQuint: 'power4.out',
};

export const isReducedMotion = (): boolean => !prefs.isMotionAllowed();

let ctx: gsap.Context | null = null;
const splits: SplitText[] = [];

/** Reveal takeover: elements the CSS observer has not shown yet get a staggered GSAP rise. */
function takeOverReveals() {
  const pending = (shared.reveal?.els ?? Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))).filter(
    (el) => !el.classList.contains('is-visible'),
  );
  shared.reveal?.io.disconnect();
  if (pending.length === 0) return;
  // From here on GSAP owns these elements: drop the CSS transition so the two never fight.
  pending.forEach((el) => {
    el.classList.add('is-visible');
    el.style.transition = 'none';
  });
  const tipUps = pending.filter((el) => el.matches(tipUpSelector));
  const plain = pending.filter((el) => !el.matches(tipUpSelector));
  if (tipUps.length > 0) {
    tipUps.forEach((el) =>
      gsap.set(el, { opacity: 0, y: 12, rotateX: -tiltOf(el) * 4, transformPerspective: 900, transformOrigin: '50% 0%' }),
    );
    ScrollTrigger.batch(tipUps, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: timing.reveal * 1.3,
          ease: timing.ease,
          stagger: timing.staggerReveal * 1.5,
          overwrite: true,
          clearProps: 'transform,opacity',
        }),
    });
  }
  if (plain.length === 0) return;
  // Opacity, not autoAlpha: an element waiting to be revealed must stay focusable (visibility: hidden
  // would skip it in the tab order); focusing it scrolls it into view, which reveals it.
  gsap.set(plain, { opacity: 0, y: 20 });
  ScrollTrigger.batch(plain, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: timing.reveal,
        ease: timing.ease,
        stagger: timing.staggerReveal,
        overwrite: true,
        clearProps: 'transform,opacity',
      }),
  });
}

/**
 * Kinetic section headings: each H2 inside a section head bar is split into characters that rise in
 * sequence the first time the heading scrolls into view. SplitText's aria option keeps the accessible
 * name on the heading and hides the fragments from assistive tech.
 */
function kineticHeadings() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>('.section-head-bar h2, .hero h1 + .lead'));
  headings.forEach((heading) => {
    if (!heading.matches('h2')) return;
    const split = SplitText.create(heading, { type: 'chars,words', charsClass: 'kinetic-char', aria: 'auto' });
    splits.push(split);
    gsap.set(split.chars, { yPercent: 60, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: heading,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(split.chars, {
          yPercent: 0,
          autoAlpha: 1,
          duration: timing.reveal,
          ease: timing.ease,
          stagger: { each: 0.028, from: 'start' },
          onComplete: () => {
            // Hand the heading back to the CSS (hover grow, font-variation transitions) once it has arrived.
            split.revert();
          },
        }),
    });
  });
}

/**
 * Scroll choreography (Phase 2). Everything is scrubbed by scroll position or fires once on entry;
 * the document always scrolls natively (no pinning spacers, no scroll-jacking, no parallax).
 * - The outlined section numeral (01–06) fills with coral as its section arrives.
 * - The prism band (shown when the WebGL field is unavailable) turns a few degrees with scroll.
 * - Timeline cards tip up from a rotateX tied to their tilt limit when they enter.
 * The Projects head bar stays in view while the rows scroll under it: that is CSS `position: sticky`
 * (global.css), toggled to its stuck look by index.astro, so it also works without this module.
 */
function scrollChoreography() {
  document.querySelectorAll<HTMLElement>('.section-index-tag').forEach((tag) => {
    const section = tag.closest('section') ?? tag;
    gsap.fromTo(
      tag,
      { '--fill': '0%' },
      {
        '--fill': '100%',
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 30%', scrub: 0.4 },
      },
    );
  });

  document.querySelectorAll<HTMLElement>('.prism-wrap').forEach((wrap) => {
    gsap.fromTo(
      wrap,
      { rotate: -2.5 },
      {
        rotate: 2.5,
        ease: 'none',
        scrollTrigger: { trigger: wrap.parentElement ?? wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      },
    );
  });
}

/**
 * Decode reveal (R1): sub-heads, kickers and the hero lead resolve from scrambled glyphs, left to
 * right, the first time they scroll into view (the "uncoding" the owner asked for). The real text
 * stays in the DOM: SplitText's aria option keeps it as the accessible name while the fragments are
 * hidden from assistive tech, and the split is reverted as soon as the text has resolved. Elements
 * holding links or controls, and anything inside a dialog, keep their plain reveal.
 */
const DECODE_GLYPHS = '#%&@$0123456789<>/\\|=+*-_~^:;!?';
const decodeSelector = '.sub-h, .kicker, .hero .lead, [data-decode]';
function decodeReveals() {
  const els = Array.from(document.querySelectorAll<HTMLElement>(decodeSelector)).filter(
    (el) => !el.dataset.decoded && !el.closest('dialog') && !el.querySelector('a, button, input'),
  );
  const glyph = () => DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];
  els.forEach((el) => {
    el.dataset.decoded = '1';
    const text = el.textContent ?? '';
    const hadLabel = el.hasAttribute('aria-label');
    const split = SplitText.create(el, { type: 'chars', charsClass: 'decode-char', aria: 'hidden' });
    const chars = split.chars as HTMLElement[];
    if (chars.length === 0) {
      split.revert();
      return;
    }
    splits.push(split);
    // The glyph spans are aria-hidden; the real text stays readable in a visually hidden span until the
    // element is reverted (an aria-label is not permitted on a paragraph).
    const sr = document.createElement('span');
    sr.className = 'decode-sr';
    sr.textContent = text;
    el.appendChild(sr);
    const originals = chars.map((c) => c.textContent ?? '');
    // Each span keeps its real glyph's width while it shows a random one, so the text never reflows
    // (the scramble must not move the layout under the reader: zero layout shift).
    const widths = chars.map((c) => c.getBoundingClientRect().width);
    chars.forEach((c, i) => {
      c.style.width = `${widths[i].toFixed(2)}px`;
      c.style.textAlign = 'center';
      c.classList.add('is-scrambled');
      c.textContent = glyph();
    });
    const state = { progress: 0 };
    let lastShuffle = 0;
    const settle = () => {
      chars.forEach((c, i) => {
        c.textContent = originals[i];
        c.classList.remove('is-scrambled');
      });
      const idx = splits.indexOf(split);
      if (idx >= 0) splits.splice(idx, 1);
      sr.remove();
      split.revert();
      if (!hadLabel) el.removeAttribute('aria-label');
    };
    const tween = gsap.to(state, {
      progress: 1,
      duration: Math.min(1.1, 0.5 + chars.length * 0.004),
      ease: 'none',
      paused: true,
      onUpdate: () => {
        const resolved = Math.floor(state.progress * chars.length);
        const now = performance.now();
        const shuffle = now - lastShuffle > 45;
        if (shuffle) lastShuffle = now;
        chars.forEach((c, i) => {
          if (i < resolved) {
            if (c.classList.contains('is-scrambled')) {
              c.textContent = originals[i];
              c.classList.remove('is-scrambled');
            }
          } else if (shuffle) {
            c.textContent = glyph();
          }
        });
      },
      onComplete: settle,
    });
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => tween.play() });
  });
}

/**
 * Smooth scroll (Lenis), desktop only: a fine pointer that can hover, motion allowed. Never on touch
 * (the phone trace of 2026-11-01: the native scroll already keeps the main thread busy there) and
 * never under reduced motion. Lenis drives the window scroll from GSAP's ticker, ScrollTrigger reads
 * it, and in-page anchor links glide to their section under the nav. Wheel events inside the
 * Telegraph dialog and over `[data-lenis-prevent]` elements are left to the browser.
 */
let lenis: Lenis | null = null;
let lenisTick: ((time: number) => void) | null = null;
// Lenis already subtracts the root's scroll-padding-top (the 88px under the sticky nav) from an element target.
const NAV_OFFSET = 0;

function smoothScroll() {
  if (lenis || !window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;
  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
    anchors: false,
    prevent: (node) => node.closest('dialog') !== null,
  });
  lenis.on('scroll', ScrollTrigger.update);
  lenisTick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
  shared.lenis = lenis;
}

function stopSmoothScroll() {
  if (lenisTick) gsap.ticker.remove(lenisTick);
  lenisTick = null;
  lenis?.destroy();
  lenis = null;
  shared.lenis = null;
  const dropClasses = () => root.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
  dropClasses();
  requestAnimationFrame(dropClasses); // Lenis touches the classes once more from its own frame

}

/** Same-page `#section` links glide through Lenis; everything else stays with the browser and the router. */
function onAnchorClick(event: MouseEvent) {
  if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]');
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash.includes('?')) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  lenis.scrollTo(target, { offset: NAV_OFFSET });
  history.pushState(history.state, '', url.hash);
}

/** Timeline cards: a 3D tip-up on entry instead of the plain rise (they keep the shared batch timing). */
const tipUpSelector = '.tl > article[data-reveal]';
const tiltOf = (el: HTMLElement): number => Number(el.dataset.tiltMax ?? 3);

/** Characters of a title rise in sequence; used by the Telegraph popup for the stage-3 logo title. */
export function riseTitle(el: HTMLElement): void {
  if (isReducedMotion()) return;
  const split = SplitText.create(el, { type: 'chars', aria: 'auto' });
  gsap.fromTo(
    split.chars,
    { yPercent: 40, autoAlpha: 0, rotateX: -40 },
    {
      yPercent: 0,
      autoAlpha: 1,
      rotateX: 0,
      duration: timing.reveal,
      ease: timing.ease,
      stagger: { each: 0.03, from: 'start' },
      onComplete: () => split.revert(),
    },
  );
}

/** Tear everything down: inline styles revert, split headings and decoded text are restored, reveals are shown. */
function teardown() {
  stopSmoothScroll();
  splits.forEach((s) => s.revert());
  splits.length = 0;
  ctx?.revert();
  ctx = null;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    el.classList.add('is-visible');
    el.style.removeProperty('transition');
  });
}

let initialised = false;
export function init(): void {
  if (initialised) return;
  initialised = true;
  shared.motionReady = true;
  const build = () => {
    if (isReducedMotion() || ctx) return;
    ctx = gsap.context(() => {
      takeOverReveals();
      kineticHeadings();
      decodeReveals();
      scrollChoreography();
    });
    smoothScroll();
  };
  document.addEventListener('click', onAnchorClick, { capture: true });
  // The motion key or the OS preference: both arrive as one preference change.
  prefs.onChange('motion', () => (isReducedMotion() ? teardown() : build()));
  // Choreograph the page on screen now and every page the router brings in (Base.astro's reveal
  // observer is re-armed first: it registered earlier); release the tweens and triggers before a swap.
  onPage(() => {
    if (!isReducedMotion()) build();
    lenis?.resize();
    return () => {
      splits.forEach((s) => s.revert());
      splits.length = 0;
      ctx?.revert();
      ctx = null;
    };
  });
  // Watchdog: if requestAnimationFrame stalls (throttled background pane, some embedded browsers),
  // tick GSAP by hand four times a second so nothing it faded out stays hidden.
  let lastFrame = gsap.ticker.frame;
  window.setInterval(() => {
    if (gsap.ticker.frame === lastFrame) gsap.ticker.tick();
    lastFrame = gsap.ticker.frame;
  }, 250);
}

export { gsap, ScrollTrigger, SplitText };
