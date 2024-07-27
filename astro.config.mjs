import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), icon()],
  vite: {
    ssr: {
      external: ["axios"],
    },
    envPrefix: 'ITAD_',
  },
  // Enable TypeScript
  typescript: {
    strict: true,
  },
});