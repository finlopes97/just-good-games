import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://justgood.games',
  integrations: [icon(), sitemap()],
  // Gives every optimised image, including ones in markdown post bodies, a srcset from
  // 640w up to its own width. Without this Astro emits `srcset=""` and phones download
  // the full-size file.
  image: { layout: 'constrained' },
  vite: {
    plugins: [tailwindcss()],
  },
});