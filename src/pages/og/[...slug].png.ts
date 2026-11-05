import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderOgCard } from "../../utils/og";

/*
  One branded OG card per post, written to /og/<slug>.png at build time. Head.astro points
  og:image and twitter:image here. The slug matches the post's URL slug, so the card for
  /posts/foo/ is always /og/foo.png.
*/
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      // Three tags is what fits on one row at this size before wrapping.
      chips: post.data.tags.slice(0, 3),
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard({
    title: props.title as string,
    chips: props.chips as string[],
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
