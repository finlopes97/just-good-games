import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), icon(), react()],
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