import { describe, expect, it } from 'vitest';
import { planVisuals, tagFirstCode, type Note } from '../src/lib/notes';

const note = (id: string, html: string): Note => ({ id, headingId: id, code: '', title: id, tag: 'Note', summary: '', html });
const PRE = '<pre class="astro-code" style="x"><code>a</code></pre>';
const media = [
  { type: 'image', src: '/cover.avif', alt: 'cover' },
  { type: 'image', src: '/g1.avif', alt: 'one', caption: 'Fig. 2' },
  { type: 'image', src: '/g2.avif', alt: 'two' },
];

describe('tagFirstCode', () => {
  it('tags the first code block only and returns a copy', () => {
    const html = `<h3>T</h3><p>x</p>${PRE}<p>y</p>${PRE}`;
    const r = tagFirstCode(html)!;
    expect(r.code).toBe(PRE);
    expect(r.html).toBe(`<h3>T</h3><p>x</p><pre data-in-pane class="astro-code" style="x"><code>a</code></pre><p>y</p>${PRE}`);
  });
  it('is null without a code block', () => {
    expect(tagFirstCode('<h3>T</h3><p>x</p>')).toBeNull();
  });
});

describe('planVisuals', () => {
  it('gives the widget slot, code blocks and gallery images in turn', () => {
    const notes = [note('a', '<p>text</p>'), note('b', `<p>t</p>${PRE}`), note('c', '<p>t</p>'), note('d', '<p>t</p>'), note('e', '<p>t</p>')];
    const v = planVisuals(notes, media, 0);
    expect(v.map((x) => x.kind)).toEqual(['widget', 'code', 'image', 'image', 'image']);
    expect(v[1].html).toBe(PRE);
    expect(notes[1].html).toContain('data-in-pane');
    expect(v[2].src).toBe('/g1.avif');
    expect(v[2].caption).toBe('Fig. 2');
    expect(v[3].src).toBe('/g2.avif');
    expect(v[4].src).toBe('/g1.avif'); // wraps round
  });
  it('falls back to the cover, then to an empty image, when there is no gallery', () => {
    expect(planVisuals([note('a', '<p>t</p>')], [media[0]])[0]).toEqual({ kind: 'image', src: '/cover.avif', alt: 'cover', caption: undefined });
    expect(planVisuals([note('a', '<p>t</p>')], [])[0]).toEqual({ kind: 'image' });
  });
  it('does not tag the note when the widget takes its place', () => {
    const notes = [note('a', `<p>t</p>${PRE}`)];
    expect(planVisuals(notes, media, 0)[0]).toEqual({ kind: 'widget' });
    expect(notes[0].html).not.toContain('data-in-pane');
  });
});
