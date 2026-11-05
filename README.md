# Just Good Games

[justgood.games](https://justgood.games) — a one-person blog about lesser-known indie
games. The kind with forty Steam reviews and one great idea.

Static site, no monetisation, no ad tech, no analytics, no CMS subscription. It is free to
run and intended to stay that way.

## Stack

| | |
|---|---|
| Framework | [Astro 7](https://astro.build), static output |
| Markdown | Sätteri (Astro 7's default Rust processor) — CommonMark + GFM, **no remark/rehype plugins** |
| Styling | Tailwind v4, CSS-first — theme lives in `src/styles/global.css`, there is no `tailwind.config.mjs` |
| Content | Astro Content Collections (Content Layer API), `.md` files, Zod schema in `src/content.config.ts` |
| Fonts | Self-hosted via `@fontsource` — Bebas Neue, Piazzolla, Ysabeau |
| Authoring | Decap CMS at `/admin`, git-gateway backend |
| Hosting | Netlify free tier; redirects and the Node pin live in `netlify.toml` |

No client-side JavaScript ships by default, and there are no React/Svelte/Vue islands.

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321/
npm run build     # static build -> ./dist/
npm run preview   # serve the built ./dist/ locally
npx astro check   # type check — currently clean
```

Astro 7 can also run the dev server as a managed background process, which is what an AI
agent working in this repo should use:

```bash
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

**On Windows:** Node is installed at `C:\Program Files\nodejs` but is not on PATH inside
some tool shells. Prefix with
`$env:Path = "C:\Program Files\nodejs;$env:Path"` if `npm` isn't found.

## Layout

```
src/
  components/     Head, cards, GameFacts, StoreLinks, chips
  content/posts/  the articles — the filename IS the URL slug
  layouts/        Layout (pages) and MarkdownPostLayout (posts)
  pages/          index, about, archive, posts/[...slug], tags/, tags/[tag], og/, rss.xml
  styles/         global.css — the entire Tailwind theme
  utils/          date formatting, excerpts, tag counts, OG card rendering
public/           images, favicon, /admin config, RSS stylesheet
```

## Writing a post

Drop a `.md` file into `src/content/posts/`. The filename becomes the URL, so it is
permanent — see below. Frontmatter is validated by `src/content.config.ts`; the build fails
on anything that doesn't match.

The optional `games[]` array drives three things automatically: the "The gist" facts panel
above the article, the "Where to get it" store links below it, and the `VideoGame`
structured data in `<head>`. Never guess a developer, publisher, release date or store URL
to populate it — leave the field out instead.

## Two hard rules

1. **Never break a published URL.** The filename is the slug. If a post is renamed, add a
   301 to `netlify.toml` in the same commit. There must never be a 404.
2. **Don't soften the design.** The site is deliberately neo-brutalist: zero border radius,
   solid black borders, hard offset shadows, no gradients, no blur, no dark mode. Changes
   that make it look more like every other blog are wrong even when they look cleaner in
   isolation.

Both are explained at length, with the colour tokens and type scale, in
[`CLAUDE.md`](./CLAUDE.md). Open items are tracked in [`ISSUES.md`](./ISSUES.md).
