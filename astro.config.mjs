// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages user site: https://phanto17.github.io (no base path).
export default defineConfig({
  site: 'https://phanto17.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
