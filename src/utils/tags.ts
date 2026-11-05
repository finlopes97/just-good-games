import type { CollectionEntry } from "astro:content";

export type TagCount = { tag: string; count: number };

/*
  Count how many posts carry each tag. Tags are already trimmed and lowercased by the
  content schema, so no normalisation is needed here — this only counts.

  Shared by /tags (the index) and /tags/[tag] (the "Popular tags" rail) so both order tags
  identically: most-used first, then alphabetically, which keeps the ordering stable when
  several tags are tied rather than letting insertion order decide.
*/
export function countTags(posts: CollectionEntry<"posts">[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
