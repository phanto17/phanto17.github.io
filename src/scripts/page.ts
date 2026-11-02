/**
 * Page lifecycle under Astro's ClientRouter.
 *
 * Scripts are evaluated once per session, while the page's elements are replaced on every client-side
 * navigation. Anything that binds to elements therefore registers a *binder* here with `onPage`: it
 * runs once for the page that is on screen (at once if that page has already loaded, otherwise on
 * `astro:page-load`) and again for every page the router brings in. Each run gets an AbortSignal for
 * its `window` / `document` / media-query listeners and may return a cleanup; both fire on
 * `astro:before-swap`, before the old page leaves. One binder never runs twice for the same page, so
 * no per-element "ready" flags are needed.
 *
 * `trackHover` is the delegated alternative to binding pointer listeners on every element of a kind
 * (which would stack listeners on elements that persist across navigations, such as the nav's keys).
 *
 * `shared` holds the handles scripts hand each other (the smooth scroller, the reveal observer), in
 * place of `window.*` globals.
 */
import type Lenis from 'lenis';

export interface PageContext {
  /** Aborted before the page is swapped out; pass it to every listener that outlives the page. */
  signal: AbortSignal;
}
export type Cleanup = () => void;
export type Binder = (page: PageContext) => void | Cleanup;

export interface HoverHandlers {
  /** The pointer moved over (or within) a matching element. */
  move(el: HTMLElement, event: PointerEvent): void;
  /** The pointer left the element, the window, or the page is being swapped out. */
  leave(el: HTMLElement): void;
}

export interface PageLifecycle {
  /** Register a binder; returns the unregister. */
  onPage(bind: Binder): () => void;
  /** Follow the pointer over elements matching `selector` with one delegated listener. */
  trackHover(selector: string, handlers: HoverHandlers): void;
}

export interface PageDeps {
  /** Where the router's events arrive (the document). */
  target: EventTarget;
  /** Whether the first page had already loaded when this module was created (a lazily loaded module). */
  loaded: () => boolean;
  onError?: (error: unknown) => void;
}

export function createPageLifecycle(deps: PageDeps): PageLifecycle {
  const { target } = deps;
  const report = deps.onError ?? ((error: unknown) => console.error(error));
  const binders = new Set<Binder>();
  /** Binders that have run for the page on screen. */
  const bound = new Set<Binder>();
  const cleanups: Cleanup[] = [];
  let controller: AbortController | null = null;
  let loaded = deps.loaded();

  const run = (bind: Binder) => {
    if (bound.has(bind)) return;
    bound.add(bind);
    controller ??= new AbortController();
    try {
      const cleanup = bind({ signal: controller.signal });
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    } catch (error) {
      report(error);
    }
  };

  target.addEventListener('astro:page-load', () => {
    loaded = true;
    for (const bind of binders) run(bind);
  });
  target.addEventListener('astro:before-swap', () => {
    controller?.abort();
    controller = null;
    for (const cleanup of cleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch (error) {
        report(error);
      }
    }
    bound.clear();
  });

  return {
    onPage(bind) {
      binders.add(bind);
      if (loaded) run(bind);
      return () => {
        binders.delete(bind);
        bound.delete(bind);
      };
    },
    trackHover(selector, handlers) {
      let current: HTMLElement | null = null;
      const release = () => {
        if (current) handlers.leave(current);
        current = null;
      };
      target.addEventListener(
        'pointermove',
        (event) => {
          const el = ((event.target as Element | null)?.closest?.(selector) as HTMLElement | null) ?? null;
          if (el !== current) {
            release();
            current = el;
          }
          if (el) handlers.move(el, event as PointerEvent);
        },
        { passive: true },
      );
      // Leaving the window: pointerout with no element on the other side.
      target.addEventListener('pointerout', (event) => {
        if (!(event as PointerEvent).relatedTarget) release();
      });
      target.addEventListener('astro:before-swap', release);
    },
  };
}

/** The handles scripts share, in place of `window.*` globals. */
export interface SharedHandles {
  /** The Lenis instance while smooth scroll is on (desktop, motion allowed); pages may scrollTo through it. */
  lenis: Lenis | null;
  /** Base.astro's reveal observer and the elements it watches, for the motion toolkit to take over. */
  reveal: { io: IntersectionObserver; els: HTMLElement[] } | null;
  /** The motion toolkit (GSAP) has loaded. */
  motionReady: boolean;
}
export const shared: SharedHandles = { lenis: null, reveal: null, motionReady: false };

const browser: PageLifecycle =
  typeof document === 'undefined'
    ? createPageLifecycle({ target: new EventTarget(), loaded: () => false })
    : createPageLifecycle({ target: document, loaded: () => document.readyState === 'complete' });

export const onPage: PageLifecycle['onPage'] = (bind) => browser.onPage(bind);
export const trackHover: PageLifecycle['trackHover'] = (selector, handlers) => browser.trackHover(selector, handlers);
