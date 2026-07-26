import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
  // Content Layer API (Astro 5+). Replaces the legacy `type: 'content'` collection.
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    // Normalise each tag (trim + lowercase) so casing can't spawn duplicate tag pages.
    tags: z.array(z.string().transform((tag) => tag.trim().toLowerCase())),
    gameTitle: z.string().optional(),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};
