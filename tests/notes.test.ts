import { describe, expect, it } from 'vitest';
import { firstSentence, splitWriteUp } from '../src/lib/notes';

const writeUp = [
  '<h2 id="what-it-is">What it is</h2><p>A game.</p>',
  '<h2 id="technical-breakdown">Technical breakdown</h2><p>Intro.</p>',
  '<h3 id="1-grid">1. Grid pathing</h3><p>Pathing is pure C#. It is tested.</p>',
  '<h3 id="what-changed-in-020">What changed in 0.2.0</h3><p>Shoves.</p>',
  '<h3 id="what-changed-in-010">What changed in 0.1.0</h3><p>First build.</p>',
  '<h3 id="next">What I would do next</h3><p>More levels.</p>',
].join('\n');

describe('splitWriteUp', () => {
  it('returns null without a "Technical breakdown" section', () => {
    expect(splitWriteUp('<h2 id="a">About</h2><h3 id="b">B</h3>')).toBeNull();
  });

  it('keeps everything up to the breakdown heading and the intro after it', () => {
    const split = splitWriteUp(writeUp)!;
    expect(split.before).toContain('What it is');
    expect(split.before).toContain('Technical breakdown');
    expect(split.intro).toContain('Intro.');
  });

  it('makes one note per H3 and merges the release notes into one', () => {
    const { notes } = splitWriteUp(writeUp)!;
    expect(notes.map((n) => n.title)).toEqual(['Grid pathing', 'Release notes', 'What I would do next']);
    expect(notes.map((n) => n.id)).toEqual(['note-1-grid', 'note-release-notes', 'note-next']);
    expect(notes.map((n) => n.code)).toEqual(['N-01', 'N-02', 'N-03']);
  });

  it('demotes the merged release headings to H4 and keeps their ids', () => {
    const release = splitWriteUp(writeUp)!.notes[1];
    expect(release.html).toMatch(/^<h3 id="release-notes">Release notes<\/h3>/);
    expect(release.html).toContain('<h4 id="what-changed-in-020">');
    expect(release.html).toContain('<h4 id="what-changed-in-010">');
  });

  it('tags numbered sections as systems and summarises with the first sentence', () => {
    const [grid, , next] = splitWriteUp(writeUp)!.notes;
    expect(grid.tag).toBe('System');
    expect(grid.summary).toBe('Pathing is pure C#.');
    expect(next.tag).toBe('Roadmap');
  });
});

describe('firstSentence', () => {
  it('strips tags and stops at the first full stop', () => {
    expect(firstSentence('<p>One <b>two</b>. Three.</p>')).toBe('One two.');
  });
});
