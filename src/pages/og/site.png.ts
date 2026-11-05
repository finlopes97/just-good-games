import type { APIRoute } from "astro";
import { renderOgCard } from "../../utils/og";

/*
  The fallback card, used by every page that isn't a post (home, about, archive, tags).
  Static route, so it takes precedence over [...slug].png.ts and never collides with a
  post slug.
*/
export const GET: APIRoute = async () => {
  const png = await renderOgCard({
    title: "Indie games worth your time",
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
