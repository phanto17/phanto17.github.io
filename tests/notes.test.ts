import { describe, expect, it } from 'vitest';
import { WRITE_UP_RULES, checkWriteUpSource, firstSentence, planWriteUp, type MediaItem } from '../src/lib/notes';

const PRE = '<pre class="astro-code" style="x"><code>a</code></pre>';
const writeUp = [
  '<h2 id="what-it-is">What it is</h2><p>A game.</p>',
  '<h2 id="technical-breakdown">Technical breakdown</h2><p>Intro.</p>',
  `<h3 id="1-grid">1. Grid pathing</h3><p>Pathing is pure C#. It is tested.</p>${PRE}<p>More.</p>${PRE}`,
  '<h3 id="what-changed-in-020">What changed in 0.2.0</h3><p>Shoves.</p>',
  '<h3 id="what-changed-in-010">What changed in 0.1.0</h3><p>First build.</p>',
  '<h3 id="next">What I would do next</h3><p>More levels.</p>',
].join('\n');
const media: MediaItem[] = [
  { type: 'image', src: '/cover.avif', alt: 'cover' },
  { type: 'image', src: '/g1.avif', alt: 'one', caption: 'Fig. 2' },
  { type: 'image', src: '/g2.avif', alt: 'two' },
];
const plan = () => planWriteUp({ html: writeUp, media })!;

describe('planWriteUp: the split', () => {
  it('is null without a breakdown, when another H2 follows it, or with fewer than two notes', () => {
    expect(planWriteUp({ html: '<h2 id="a">About</h2><h3 id="b">B</h3>', media })).toBeNull();
    expect(planWriteUp({ html: `${writeUp}<h2 id="after">After</h2><p>x</p>`, media })).toBeNull();
    expect(planWriteUp({ html: '<h2 id="t">Technical breakdown</h2><h3 id="only">Only</h3><p>x</p>', media })).toBeNull();
  });

  it('keeps everything up to the breakdown heading and the intro after it', () => {
    const p = plan();
    expect(p.before).toContain('What it is');
    expect(p.before).toContain('Technical breakdown');
    expect(p.intro).toContain('Intro.');
  });

  it('makes one note per H3 and merges the release notes into one', () => {
    const { notes } = plan();
    expect(notes.map((n) => n.title)).toEqual(['Grid pathing', 'Release notes', 'What I would do next']);
    expect(notes.map((n) => n.id)).toEqual(['note-1-grid', 'note-release-notes', 'note-next']);
    expect(notes.map((n) => n.code)).toEqual(['N-01', 'N-02', 'N-03']);
  });

  it('splits each note into its heading and its body, demoting merged release headings to H4', () => {
    const [grid, release] = plan().notes;
    expect(grid.headingHtml).toBe('<h3 id="1-grid">1. Grid pathing</h3>');
    expect(grid.bodyHtml.startsWith('<p>Pathing is pure C#.')).toBe(true);
    expect(release.headingHtml).toBe('<h3 id="release-notes">Release notes</h3>');
    expect(release.bodyHtml).toContain('<h4 id="what-changed-in-020">');
    expect(release.bodyHtml).toContain('<h4 id="what-changed-in-010">');
    expect(release.summary).toBe('What changed in each build: 0.1.0, 0.2.0.');
  });

  it('tags by title and summarises with the first sentence', () => {
    const [grid, release, next] = plan().notes;
    expect(grid.tag).toBe('System');
    expect(grid.summary).toBe('Pathing is pure C#.');
    expect(release.tag).toBe('Changelog');
    expect(next.tag).toBe('Roadmap');
    expect(WRITE_UP_RULES.tags.map(([, tag]) => tag)).toEqual(['System', 'Roadmap', 'Process']);
  });
});

describe('planWriteUp: the visuals', () => {
  it('lifts the first code block into the pane and tags the note copy; images rotate through the gallery', () => {
    const [grid, release, next] = plan().notes;
    expect(grid.visual).toEqual({ kind: 'code', html: PRE });
    expect(grid.bodyHtml.trim()).toBe(`<p>Pathing is pure C#. It is tested.</p><pre data-in-pane class="astro-code" style="x"><code>a</code></pre><p>More.</p>${PRE}`);
    expect(release.visual).toEqual({ kind: 'image', src: '/g1.avif', alt: 'one', caption: 'Fig. 2' });
    expect(next.visual).toEqual({ kind: 'image', src: '/g2.avif', alt: 'two', caption: undefined });
  });

  it('puts the widget on the first note, leaving its code block in place', () => {
    const [grid, release] = planWriteUp({ html: writeUp, media, widget: 'shove-lab' })!.notes;
    expect(grid.visual).toEqual({ kind: 'widget', widget: 'shove-lab' });
    expect(grid.bodyHtml).not.toContain('data-in-pane');
    expect(release.visual).toMatchObject({ kind: 'image', src: '/g1.avif' });
  });

  it('wraps round the gallery, falls back to the cover, then to an empty image', () => {
    const many = [1, 2, 3, 4, 5].map((i) => `<h3 id="n${i}">Note ${i}</h3><p>t</p>`).join('');
    const html = `<h2 id="t">Technical breakdown</h2>${many}`;
    const rotated = planWriteUp({ html, media })!.notes.map((n) => (n.visual.kind === 'image' ? n.visual.src : n.visual.kind));
    expect(rotated).toEqual(['/g1.avif', '/g2.avif', '/g1.avif', '/g2.avif', '/g1.avif']);
    expect(planWriteUp({ html, media: [media[0]] })!.notes[0].visual).toEqual({ kind: 'image', src: '/cover.avif', alt: 'cover', caption: undefined });
    expect(planWriteUp({ html, media: [] })!.notes[0].visual).toEqual({ kind: 'image' });
  });

  it('is a pure function of its input', () => {
    const mediaCopy = structuredClone(media);
    const a = planWriteUp({ html: writeUp, media });
    const b = planWriteUp({ html: writeUp, media });
    expect(a).toEqual(b);
    expect(media).toEqual(mediaCopy);
    // A plan with a widget does not touch the one without.
    planWriteUp({ html: writeUp, media, widget: 'shove-lab' });
    expect(planWriteUp({ html: writeUp, media })).toEqual(a);
  });
});

describe('firstSentence', () => {
  it('strips tags and stops at the first full stop', () => {
    expect(firstSentence('<p>One <b>two</b>. Three.</p>')).toBe('One two.');
  });
});

describe('checkWriteUpSource', () => {
  const good = `---\ntitle: X\n---\n\n## The game\n\ntext\n\n## Technical breakdown\n\n### 1. Grid\n\nx\n\n### What changed in 0.2.0 (October 2026)\n\ny\n\n### What's next\n\nz\n`;

  it('accepts a write-up that follows the rules', () => {
    expect(checkWriteUpSource(good)).toEqual([]);
  });

  it('names each problem', () => {
    expect(checkWriteUpSource('## The game\n\n### A\n\n### B\n')).toEqual(['no "Technical breakdown" H2 (the notes need one)']);
    expect(checkWriteUpSource(`${good}\n## Credits\n\nmore\n`)).toEqual(['"Technical breakdown" must be the last H2; "Credits" follows it']);
    expect(checkWriteUpSource('## Technical breakdown\n\n### Only\n\nx\n')).toEqual(['the breakdown has 1 H3 section(s); at least 2 are needed for notes']);
    // A release note without a version is allowed: the summary lists only the versions that are named.
    expect(checkWriteUpSource('## Technical breakdown\n\n### A\n\n### What changed lately\n\nx\n')).toEqual([]);
  });

  it('ignores headings inside fenced code', () => {
    const fenced = `## Technical breakdown\n\n### A\n\n\`\`\`md\n## Not a heading\n### Nor this\n\`\`\`\n\n### B\n\nx\n`;
    expect(checkWriteUpSource(fenced)).toEqual([]);
  });
});
