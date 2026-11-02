/**
 * Every project write-up in src/content/projects follows the conventions the plan relies on
 * (src/lib/notes.ts WRITE_UP_RULES), so a broken write-up fails here instead of rendering wrong on the
 * live page. A write-up without a "Technical breakdown" renders as plain prose and is allowed; one that
 * has the heading must have it last, with at least two sections.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WRITE_UP_RULES, checkWriteUpSource } from '../src/lib/notes';

const dir = new URL('../src/content/projects/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const source = (f: string) => readFileSync(new URL(f, dir), 'utf8');
const hasBreakdown = (md: string) => md.split(/\r?\n/).some((line) => /^##\s+(.+?)\s*$/.test(line) && WRITE_UP_RULES.breakdownHeading.test(/^##\s+(.+?)\s*$/.exec(line)![1]));

describe('project write-ups', () => {
  it('exist', () => expect(files.length).toBeGreaterThanOrEqual(4));

  for (const f of files) {
    const md = source(f);
    if (!hasBreakdown(md)) continue;
    it(`${f}: the technical breakdown follows the notes conventions`, () => {
      expect(checkWriteUpSource(md)).toEqual([]);
    });
  }

  it('the three games have a technical breakdown', () => {
    for (const id of ['horde-hours', 'push-comes-to-shove', 'cinderhold']) expect(hasBreakdown(source(`${id}.md`))).toBe(true);
  });

  it('a frontmatter widget names a known kind', () => {
    for (const f of files) {
      const m = /^widget:\s*(\S+)/m.exec(source(f));
      if (m) expect(['shove-lab']).toContain(m[1]);
    }
  });
});
