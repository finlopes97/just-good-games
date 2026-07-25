import { z, defineCollection } from "astro:content";

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    // Normalise each tag to a canonical form (trim + lowercase) so casing
    // differences from the CMS can't spawn duplicate tag pages, e.g. RPG vs rpg.
    tags: z.array(z.string().transform((tag) => tag.trim().toLowerCase())),
    featured: z.boolean().default(false),
    gameTitle: z.string().optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional()
  })
});

export const collections = {
  posts: postsCollection,
};