import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://justgood.games',
  integrations: [tailwind(), mdx(), icon(), react(), sitemap()],
  vite: {
    ssr: {
      external: ["axios"]
    },
    envPrefix: 'PUBLIC_'
  },
  // Enable TypeScript
  typescript: {
    strict: true
  }
});