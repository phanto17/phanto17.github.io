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

gsap.registerPlugin(ScrollTrigger, SplitText);

declare global {
  interface Window {
    portfolioReveal?: { io: IntersectionObserver; els: HTMLElement[] };
    portfolioMotion?: boolean;
  }
}

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

export const isReducedMotion = (): boolean =>
  root.getAttribute('data-motion') === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ctx: gsap.Context | null = null;
const splits: SplitText[] = [];

/** Reveal takeover: elements the CSS observer has not shown yet get a staggered GSAP rise. */
function takeOverReveals() {
  const pending = (window.portfolioReveal?.els ?? Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))).filter(
    (el) => !el.classList.contains('is-visible'),
  );
  window.portfolioReveal?.io.disconnect();
  if (pending.length === 0) return;
  // From here on GSAP owns these elements: drop the CSS transition so the two never fight.
  pending.forEach((el) => {
    el.classList.add('is-visible');
    el.style.transition = 'none';
  });
  gsap.set(pending, { autoAlpha: 0, y: 20 });
  ScrollTrigger.batch(pending, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: timing.reveal,
        ease: timing.ease,
        stagger: timing.staggerReveal,
        overwrite: true,
        clearProps: 'transform,opacity,visibility',
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

/** Tear everything down: inline styles revert, split headings are restored, reveals are shown. */
function teardown() {
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
  window.portfolioMotion = true;
  const build = () => {
    if (isReducedMotion() || ctx) return;
    ctx = gsap.context(() => {
      takeOverReveals();
      kineticHeadings();
    });
  };
  build();
  window.addEventListener('portfolio:motionchange', () => (isReducedMotion() ? teardown() : build()));
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => (isReducedMotion() ? teardown() : build()));
  // ClientRouter navigations: release the old page's tweens and triggers before the swap, choreograph
  // the new page once it is in (Base.astro has re-armed the reveal observer by then).
  document.addEventListener('astro:before-swap', () => {
    splits.forEach((s) => s.revert());
    splits.length = 0;
    ctx?.revert();
    ctx = null;
  });
  document.addEventListener('astro:page-load', () => {
    if (!isReducedMotion()) build();
  });
  // Watchdog: if requestAnimationFrame stalls (throttled background pane, some embedded browsers),
  // tick GSAP by hand four times a second so nothing it faded out stays hidden.
  let lastFrame = gsap.ticker.frame;
  window.setInterval(() => {
    if (gsap.ticker.frame === lastFrame) gsap.ticker.tick();
    lastFrame = gsap.ticker.frame;
  }, 250);
  window.dispatchEvent(new Event('portfolio:motionready'));
}

export { gsap, ScrollTrigger, SplitText };
