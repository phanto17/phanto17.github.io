/**
 * Every project write-up in src/content/projects follows the conventions the plan relies on
 * (src/lib/notes.ts WRITE_UP_RULES), so a broken write-up fails here instead of rendering wrong on the
 * live page.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WRITE_UP_RULES, checkWriteUpSource } from '../src/lib/notes';

const dir = new URL('../src/content/projects/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const source = (f: string) => readFileSync(new URL(f, dir), 'utf8');
const hasBreakdown = (md: string) =>
  md.split(/\r?\n/).some((line) => {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    return m !== null && WRITE_UP_RULES.breakdownHeading.test(m[1]);
  });

const EXPECTED_SLUGS = [
  'push-comes-to-shove',
  'cinderhold',
  'horde-hours',
  'please-take-a-number',
  'barrowlight',
  'eternity-keeper',
];

describe('project write-ups', () => {
  it('include all six course-portfolio projects', () => {
    expect(files.map((f) => f.replace(/\.md$/, '')).sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  for (const f of files) {
    const md = source(f);
    it(`${f}: technical breakdown follows the notes conventions`, () => {
      expect(hasBreakdown(md)).toBe(true);
      expect(checkWriteUpSource(md)).toEqual([]);
    });
  }

  it('a frontmatter widget names a known kind', () => {
    for (const f of files) {
      const m = /^widget:\s*(\S+)/m.exec(source(f));
      if (m) expect(['shove-lab']).toContain(m[1]);
    }
  });
});
