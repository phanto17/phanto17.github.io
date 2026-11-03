# phanto17.github.io — portfolio of Tymoteusz Jaskólski

Static portfolio site built with [Astro](https://astro.build), deployed to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
```

- Home (`/`) is the **field map** (`src/components/World.astro`, engine in `src/world/`): an
  explorable 3D world generated from the project list, with the text version at `/overview/`.
  A new project file gets its own place on the map, a panel and a field-log entry by itself;
  `world.kind` / `world.accent` in its frontmatter choose the diorama and colour.
- Projects: one Markdown file per project in `src/content/projects/` → `/projects/<id>/`.
  Schema in `src/content.config.ts`.
- Activities, experience, education: `src/data/activities.ts`. Site-wide links: `src/data/site.ts`.
- Design system: `docs/design-system.md` (tokens in `src/styles/global.css`).
- Working notes and audit: `CLAUDE.md`, `docs/`. Checks before a release: `npm test`,
  `npm run check`, `npm run build`, `node tools/verify-portfolio.mjs dist`,
  `node tools/check-links.mjs --internal-only`, `npm run test:browser` (needs Playwright).
- Media goes in `public/media/<project>/` as WebP/AVIF and MP4/WebM. Unity builds never live here —
  they go to itch.io.
