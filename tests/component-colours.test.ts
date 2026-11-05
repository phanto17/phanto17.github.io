import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * P7: components draw with tokens. A theme colour lives in design/tokens.json (and a location's accent
 * comes in through --acc), so no component carries a hex value or a tinted rgb()/hsl(). Neutral light
 * and shade — pure black or white at some alpha, the glass keys' gloss and bevel — may stay literal,
 * since every theme uses them the same way.
 */
const dir = join(__dirname, '..', 'src', 'components');
const files = readdirSync(dir).filter((f) => f.endsWith('.astro'));

/** A colour literal: #rgb … #rrggbbaa, or a functional colour. Fragment links (href="#about") are not colours. */
const HEX = /(?<!href=["'])(?<![\w&/-])#[0-9a-fA-F]{3,8}\b(?![\w-])/g;
const FUNC = /\b(?:rgba?|hsla?)\(([^)]*)\)/g;
const NEUTRAL = /^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*(,\s*[\d.]+\s*)?$/;

function colourLiterals(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(HEX)) found.push(m[0]);
  for (const m of source.matchAll(FUNC)) if (!NEUTRAL.test(m[1])) found.push(m[0]);
  return found;
}

describe('component colours', () => {
  it('finds the literals it is meant to catch', () => {
    expect(colourLiterals('<path fill="#fff" />')).toEqual(['#fff']);
    expect(colourLiterals('a { color: #f27c52; background: rgba(242, 124, 82, 0.3); }')).toEqual(['#f27c52', 'rgba(242, 124, 82, 0.3)']);
    expect(colourLiterals('<a href="#about">x</a> a { box-shadow: 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 0 rgba(0, 0, 0, 0.4); }')).toEqual([]);
  });

  it.each(files)('%s has no hex or tinted colour literal', (file) => {
    expect(colourLiterals(readFileSync(join(dir, file), 'utf8'))).toEqual([]);
  });
});
