import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postsCollection = defineCollection({
  // Content Layer API (Astro 5+). Replaces the legacy `type: 'content'` collection.
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  // A function, not a plain object, so the schema can use the `image()` helper: it resolves
  // a relative path in frontmatter to an imported asset that astro:assets can optimise.
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    // Normalise each tag (trim + lowercase) so casing can't spawn duplicate tag pages.
    tags: z.array(z.string().transform((tag) => tag.trim().toLowerCase())),
    gameTitle: z.string().optional(),
    // Facts about the game a post covers, for search engines only. Nothing on the page
    // renders from this: a post with exactly one entry gets a VideoGame node in its JSON-LD
    // (Head.astro). Anything the reader should see is written in the post body.
    games: z
      .array(
        z.object({
          name: z.string(),
          // One or two sentences; becomes the VideoGame description.
          pitch: z.string().max(300).optional(),
          developers: z.array(z.string()).optional(),
          publishers: z.array(z.string()).optional(),
          // Free text, not a date: has to hold "TBA", "2024", or "Early Access since May 2023".
          releaseDate: z.string().optional(),
          links: z
            .array(
              z.object({
                store: z.enum([
                  "steam",
                  "itch",
                  "gog",
                  "epic",
                  "playstation",
                  "xbox",
                  "nintendo",
                  // Not a storefront — a price tracker. Left out of the VideoGame node.
                  "itad",
                  "other",
                ]),
                // z.url(), not z.string().url() — the chained form is deprecated in Zod 4,
                // which is what Astro 7's `astro:content` re-exports.
                url: z.url(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
    // The post thumbnail. `url` is a path relative to the post file, pointing into
    // src/assets/posts/ (e.g. ../../assets/posts/thumbnails/2024_12/top_ten.jpg). The key
    // keeps its old name so existing posts and the CMS config didn't need renaming, but
    // the value is now image metadata, not a string. A path that doesn't exist fails the build.
    image: z
      .object({
        url: image(),
        alt: z.string(),
      })
      .optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};
