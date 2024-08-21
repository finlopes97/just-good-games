import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://justgood.games',
  integrations: [tailwind(), mdx(), icon(), sitemap()],
  // Enable TypeScript
  typescript: {
    strict: true
  }
});