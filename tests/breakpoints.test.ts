import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MEDIA } from '../src/scripts/generated/breakpoints';

const root = join(__dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(join(root, 'src')).filter((f) => /\.(css|astro|ts)$/.test(f));
const read = (f: string) => readFileSync(f, 'utf8');
const allowed = new Set<string>(Object.values(MEDIA));

describe('three breakpoints (design/tokens.json bp-wide / bp-mid / bp-narrow)', () => {
  it('names five queries for three widths', () => {
    expect(MEDIA).toEqual({
      wide: '(min-width: 981px)',
      belowWide: '(max-width: 980px)',
      mid: '(max-width: 760px)',
      aboveMid: '(min-width: 761px)',
      narrow: '(max-width: 420px)',
    });
  });

  it('every media query in the styles uses one of them', () => {
    const wrong: string[] = [];
    for (const f of files.filter((x) => !x.endsWith('.ts'))) {
      for (const m of read(f).matchAll(/\((?:min|max)-width:\s*[\d.]+(?:px|em|rem)\)/g)) {
        if (!allowed.has(m[0])) wrong.push(`${relative(root, f)}: ${m[0]}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('scripts check widths through MEDIA, not their own numbers', () => {
    const wrong: string[] = [];
    for (const f of files) {
      if (f.includes('generated')) continue;
      const src = read(f);
      for (const m of src.matchAll(/matchMedia\(\s*['"`][^'"`]*width[^'"`]*['"`]/g)) wrong.push(`${relative(root, f)}: ${m[0]}`);
      for (const m of src.matchAll(/innerWidth\s*[<>]=?\s*\d+/g)) wrong.push(`${relative(root, f)}: ${m[0]}`);
    }
    expect(wrong).toEqual([]);
  });
});
