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
    // Structured facts about the game(s) a post covers. Optional and additive: posts
    // without it render exactly as before. Single-game posts get a detail panel above the
    // article; multi-game roundups get a summary block below it (see GameFacts.astro).
    games: z
      .array(
        z.object({
          name: z.string(),
          // Elevator pitch, 1-2 sentences, rendered as the "What is it" row of GameFacts.
          // The cap is a build-time guardrail: it fails the build rather than let the row
          // grow into a paragraph and wreck the panel's proportions.
          pitch: z.string().max(300).optional(),
          developers: z.array(z.string()).optional(),
          publishers: z.array(z.string()).optional(),
          // Free text, not a date: has to hold "TBA", "2024", or "Early Access since May 2023".
          releaseDate: z.string().optional(),
          status: z
            .enum(["full-release", "early-access", "demo", "free", "mod"])
            .optional(),
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
                  // Not a storefront — a price tracker. StoreLinks labels it accordingly
                  // and always renders it after the real buy links.
                  "itad",
                  "other",
                ]),
                // z.url(), not z.string().url() — the chained form is deprecated in Zod 4,
                // which is what Astro 7's `astro:content` re-exports.
                url: z.url(),
                // Overrides the default store name on the button.
                label: z.string().optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
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
