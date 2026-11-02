import { describe, expect, it, vi } from 'vitest';
import { createPageLifecycle, type Binder } from '../src/scripts/page';

const fire = (target: EventTarget, type: string) => target.dispatchEvent(new Event(type));

function lifecycle(loaded = false) {
  const target = new EventTarget();
  const errors: unknown[] = [];
  const page = createPageLifecycle({ target, loaded: () => loaded, onError: (e) => errors.push(e) });
  return { target, page, errors };
}

describe('onPage', () => {
  it('waits for the first page-load when the page has not loaded yet, then runs per page', () => {
    const { target, page } = lifecycle(false);
    const runs: AbortSignal[] = [];
    const cleanup = vi.fn();
    page.onPage(({ signal }) => {
      runs.push(signal);
      return cleanup;
    });
    expect(runs).toHaveLength(0);

    fire(target, 'astro:page-load');
    expect(runs).toHaveLength(1);
    expect(runs[0].aborted).toBe(false);
    expect(cleanup).not.toHaveBeenCalled();

    fire(target, 'astro:before-swap');
    expect(runs[0].aborted).toBe(true);
    expect(cleanup).toHaveBeenCalledTimes(1);

    fire(target, 'astro:page-load');
    expect(runs).toHaveLength(2);
    expect(runs[1]).not.toBe(runs[0]);
    expect(runs[1].aborted).toBe(false);
  });

  it('runs at once for a page that has already loaded, and not again for the same page', () => {
    const { target, page } = lifecycle(true);
    const bind = vi.fn();
    page.onPage(bind);
    expect(bind).toHaveBeenCalledTimes(1);
    fire(target, 'astro:page-load'); // a late page-load for the same page
    expect(bind).toHaveBeenCalledTimes(1);
    fire(target, 'astro:before-swap');
    fire(target, 'astro:page-load');
    expect(bind).toHaveBeenCalledTimes(2);
  });

  it('never runs a binder twice for one page', () => {
    const { target, page } = lifecycle(false);
    const bind = vi.fn();
    page.onPage(bind);
    fire(target, 'astro:page-load');
    fire(target, 'astro:page-load');
    expect(bind).toHaveBeenCalledTimes(1);
  });

  it('runs cleanups in reverse order and isolates a throwing binder', () => {
    const { target, page, errors } = lifecycle(true);
    const order: string[] = [];
    page.onPage(() => () => order.push('a'));
    page.onPage(() => {
      throw new Error('boom');
    });
    page.onPage(() => () => order.push('b'));
    expect(errors).toHaveLength(1);
    fire(target, 'astro:before-swap');
    expect(order).toEqual(['b', 'a']);
  });

  it('a binder with no cleanup is fine, and unregistering stops future runs', () => {
    const { target, page } = lifecycle(false);
    const bind: Binder = vi.fn();
    const off = page.onPage(bind);
    fire(target, 'astro:page-load');
    expect(bind).toHaveBeenCalledTimes(1);
    off();
    fire(target, 'astro:before-swap');
    fire(target, 'astro:page-load');
    expect(bind).toHaveBeenCalledTimes(1);
  });

  it('all binders see the same signal for one page', () => {
    const { target, page } = lifecycle(true);
    const seen: AbortSignal[] = [];
    page.onPage(({ signal }) => void seen.push(signal));
    page.onPage(({ signal }) => void seen.push(signal));
    expect(seen[0]).toBe(seen[1]);
    fire(target, 'astro:before-swap');
    expect(seen[0].aborted).toBe(true);
  });
});

describe('trackHover', () => {
  /** An element-like with `closest`: `match` is what it answers for the tracked selector. */
  const el = (name: string, match: object | null) => ({ name, closest: () => match });
  const pointer = (type: string, target: object | null, relatedTarget: object | null = {}) => {
    const event = new Event(type);
    Object.defineProperty(event, 'target', { value: target });
    Object.defineProperty(event, 'relatedTarget', { value: relatedTarget });
    return event;
  };

  it('calls move while over a match, leave when the pointer moves to another or off', () => {
    const { target, page } = lifecycle(true);
    const log: string[] = [];
    page.trackHover('.btn', {
      move: (e) => log.push(`move ${(e as unknown as { name: string }).name}`),
      leave: (e) => log.push(`leave ${(e as unknown as { name: string }).name}`),
    });
    const a = el('a', null);
    const b = el('b', null);
    (a as { closest: () => object | null }).closest = () => a;
    (b as { closest: () => object | null }).closest = () => b;
    const plain = el('plain', null);

    target.dispatchEvent(pointer('pointermove', a));
    target.dispatchEvent(pointer('pointermove', a));
    target.dispatchEvent(pointer('pointermove', b));
    target.dispatchEvent(pointer('pointermove', plain));
    expect(log).toEqual(['move a', 'move a', 'leave a', 'move b', 'leave b']);
  });

  it('releases on leaving the window and on a page swap', () => {
    const { target, page } = lifecycle(true);
    const log: string[] = [];
    page.trackHover('.btn', { move: () => log.push('move'), leave: () => log.push('leave') });
    const a = el('a', null);
    (a as { closest: () => object | null }).closest = () => a;

    target.dispatchEvent(pointer('pointermove', a));
    target.dispatchEvent(pointer('pointerout', a, {})); // into another element: no release
    target.dispatchEvent(pointer('pointerout', a, null)); // out of the window
    expect(log).toEqual(['move', 'leave']);

    target.dispatchEvent(pointer('pointermove', a));
    fire(target, 'astro:before-swap');
    expect(log).toEqual(['move', 'leave', 'move', 'leave']);
    fire(target, 'astro:before-swap'); // nothing tracked: no second leave
    expect(log).toHaveLength(4);
  });
});
