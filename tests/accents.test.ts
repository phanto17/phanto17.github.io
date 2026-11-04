import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';
import { ACCENT_MINIMUM, accentContrast, accentInks, accentTheme, contrast, type AccentTokens } from '../src/lib/accents';
import { UNCHARTED_ACCENT } from '../src/world/gen';

const file = tokens as unknown as AccentTokens;
const themes = file.color.themes.map((t) => t.id);
const colour = (name: string, theme: string) => {
  const t = file.color.tokens.find((x) => x.name === name)!;
  return typeof t.value === 'string' ? t.value : t.value[theme];
};

/** Every accent the map can draw: the landmark tokens, each project's frontmatter, the free slot. */
const projectsDir = join(__dirname, '../src/content/projects');
const projectAccents = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => [f.replace(/\.md$/, ''), readFileSync(join(projectsDir, f), 'utf8').match(/^\s+accent:\s*["']?(#[0-9a-f]{6})/im)?.[1]] as const)
  .filter((p): p is readonly [string, string] => Boolean(p[1]));
const landmarkAccents = file.color.tokens.filter((t) => t.name.startsWith('loc-')).map((t) => [t.name, t.value as string] as const);
const accents = [...landmarkAccents, ...projectAccents, ['uncharted', UNCHARTED_ACCENT] as const];

describe('location accents', () => {
  it('reads four landmark accents and every project accent', () => {
    expect(landmarkAccents.map(([n]) => n)).toEqual(['loc-station', 'loc-lab', 'loc-guild', 'loc-mast']);
    expect(projectAccents.length).toBeGreaterThanOrEqual(3);
  });

  for (const theme of themes) {
    it(`keeps every eyebrow at 4.5:1 and every tag border at 3:1 in ${theme}`, () => {
      const t = accentTheme(file, theme);
      // An element with no accent of its own falls back to the theme's coral.
      for (const [name, accent] of [...accents, ['coral', colour('coral', theme)] as const]) {
        const c = accentContrast(accent, t);
        expect(c.eyebrow, `${name} eyebrow in ${theme}`).toBeGreaterThanOrEqual(ACCENT_MINIMUM.eyebrow);
        expect(c.edge, `${name} border in ${theme}`).toBeGreaterThanOrEqual(ACCENT_MINIMUM.edge);
      }
    });
  }

  it('keeps the accent as it is where the theme does not tone it', () => {
    const prism = accentTheme(file, 'prism');
    expect(prism.tone).toBe(1);
    expect(accentInks('#7fd6ff', prism).toned).toBe('#7fd6ff');
  });

  it('composites a translucent ink over its ground', () => {
    expect(contrast('#ffffff', '#000000')).toBe(21);
    expect(contrast('rgba(255, 255, 255, 0)', '#000000')).toBe(1);
  });
});

describe('the map has no colours of its own', () => {
  for (const path of ['src/components/World.astro', 'src/styles/world.css', 'src/styles/field-kit.css']) {
    it(`${path} takes every colour from the tokens`, () => {
      const src = readFileSync(join(__dirname, '..', path), 'utf8');
      expect(src.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
    });
  }
});
