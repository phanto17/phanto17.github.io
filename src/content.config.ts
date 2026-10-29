import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One Markdown file per project in src/content/projects/ → its own subpage at /projects/<id>/.
 * The Markdown body holds the long-form text: what the game is, then the technical breakdown.
 * Schema fields follow CLAUDE.md: title, summary, genre, status, dates, role, myContribution,
 * tools, media, itchUrl, githubUrl (optional), credits.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(220),
    genre: z.string(),
    /** game (needs an itch.io link to count as playable) or tool (released on GitHub) */
    kind: z.enum(['game', 'tool']).default('game'),
    /** playable = itch.io link live · released = tool download live · in-progress · planned */
    status: z.enum(['playable', 'released', 'in-progress', 'planned']),
    dates: z.object({
      start: z.string(), // "2026-03" (YYYY-MM)
      end: z.string().optional(), // omit = ongoing
    }),
    role: z.string(),
    engine: z.string(),
    /** Bullet list of core systems I personally built / architected. Never list third-party work here. */
    myContribution: z.array(z.string()),
    /** Optional chronological iteration / release / playtest log (0.2.0 – 0.5.0) rendered in an expandable drawer. */
    changelog: z.array(z.string()).default([]),
    /** Git-verified engineering telemetry chips (test counts, benchmarks, invariants). */
    metrics: z.array(z.string()).default([]),
    tools: z.array(z.string()),
    media: z
      .array(
        z.object({
          type: z.enum(['image', 'video', 'gif']),
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    /** Required for a playable project; leave out while the build isn't published yet. */
    itchUrl: z.url().optional(),
    /** For tools: the release/download page. */
    downloadUrl: z.url().optional(),
    githubUrl: z.url().optional(),
    /** Upstream project this one is forked from or built on (emitted as schema.org isBasedOn). */
    basedOn: z.url().optional(),
    /** Every third-party asset, pack, font and sound used. */
    credits: z
      .array(
        z.object({
          asset: z.string(),
          author: z.string(),
          url: z.url().optional(),
          license: z.string().optional(),
        }),
      )
      .default([]),
    /** Sort order on the home page (1 = first). */
    order: z.number().default(99),
    /** Short systems list shown on the project card. */
    highlights: z.array(z.string()).default([]),
  }),
});

export const collections = { projects };
