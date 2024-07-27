import { z, defineCollection } from "astro:content";

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
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