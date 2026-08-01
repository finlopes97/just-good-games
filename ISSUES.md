# ISSUES.md — Open items

**Status (2026-08-01):** build green (Astro 7, 39 pages), `npm audit` clean, `npx astro
check` **clean (0 errors, 0 warnings)**, all published URLs preserved. History lives in git;
this file tracks only what's **still open**. None are urgent.

---

## Content pipeline

1. **Images use raw `<img src={image.url}>`, not `astro:assets`.** Frontmatter `image` is
   `{ url, alt }` strings, so there's no build-time optimisation or responsive sizing.
   Migrating touches the content schema and every image reference (posts, cards, hero,
   JSON-LD), which makes it the single largest remaining job — worth its own session rather
   than being bundled into a cleanup pass.

2. **Content schema is lighter than SEO-ideal** — no `updatedDate`, `draft` or `steamAppId`
   in `src/content.config.ts`. `updatedDate` is the most valuable of the three: it would
   feed `dateModified` in the JSON-LD, which is a real freshness signal. Add deliberately.

   **Backfill outstanding:** only `dungeons-of-hinterberg-review.md` carries `games` so far,
   and only with facts verifiable from the repo (developer Microbird Games, publisher Curve
   Games, its Steam URL, full release). Publishers and release dates for every other post
   are a data-entry pass via `/admin` — don't guess them. Same rule for `pitch` (owner-written
   copy, capped at 300 chars so an over-long one fails the build) and `itad` URLs, which must
   be pasted from the real ITAD page — the slug isn't derivable from a title, and a guess
   produces a confident 404 in the "Where to get it" block.

   Note that `games[]` now feeds `VideoGame` structured data as well as the two panels, so
   backfilling it has more leverage than it did.

## SEO

3. **No `Review` structured data, deliberately.** Post pages emit `BlogPosting` + a
   `VideoGame` node linked via `about` (see `src/components/Head.astro`). They do **not**
   emit `Review`, because Google requires `reviewRating` on `Review` and this site has no
   rating — the `Score` component was removed in `cbb84c4`. Emitting one without a rating
   earns a "Missing field reviewRating" error in Search Console and produces no rich result.
   If a rating ever returns to the schema, add the `Review` node in `Head.astro`; the
   surrounding graph is already shaped for it.

4. **OG cards are title-only.** `src/utils/og.ts` renders them in Bebas Neue alone, because
   that's the only one of the three faces `@fontsource` ships as `.woff` — Piazzolla and
   Ysabeau are variable fonts published as `.woff2` only, which satori can't read. A body
   line under the title would need a static `.woff` for Ysabeau (or a woff2 decoder).
   Not a problem, just the reason the cards look the way they do.

## Design-system drift

5. **Several components predate the design system and never got updated.** Found during the
   2026-08-01 pass; the worst offenders (random tag colours, `rounded-lg`, hotlinked brand
   buttons) are fixed, but these remain:
   - `BlogPostCard.astro` uses `bg-red-400` — a raw Tailwind colour, not a token.
   - `BlogPostCard.astro`, `BlogPostListing.astro`, `HeroPost.astro` and `Social.astro` use
     smooth `transition … duration-300` hovers instead of the `jgg-press` step model
     (CLAUDE.md §2.4). They also have no `prefers-reduced-motion` guard, which `jgg-press`
     provides for free.
   - `MarkdownPostLayout.astro` uses `bg-secondary-200` for the byline chip, which competes
     with `secondary`'s one assigned job (the GameFacts status chip).

6. **`Prose.astro` never applies the `prose` class.** It sets a long list of `prose-h2:`,
   `prose-p:` etc. modifiers, but without `prose` on the element the typography plugin's
   base styles never land — only the explicit overrides do. Article text currently looks
   fine because those overrides cover the elements posts actually use, so this is latent
   rather than broken: any element not explicitly listed (tables, `code`, nested lists) gets
   no typographic styling at all. Adding `prose` would restyle every article, so it needs a
   visual pass, not a one-line fix.

7. **`Layout.astro` wraps every non-post page in `<article>`**, including the homepage's
   list of post cards and the tag listings. A list of links isn't an article. Should be a
   plain `<div>`; the real `<article>` elements are inside the cards.

## Housekeeping

8. **`body` token naming collision** — `body` is both the yellow colour scale and a font
   family. A rename (e.g. `canvas`) touches every template; needs sign-off.

9. **Zod 4 deprecation hints.** `npx astro check` reports 27 hints, all `'z' is deprecated`,
   because Astro 7's `astro:content` re-exports the classic `z` namespace from Zod 4. They
   are hints, not errors, and clearing them means importing `zod` directly — which makes
   this repo own a zod version that Astro currently owns. Not worth it yet.

---

*Resolved and in git history: tag dedup, self-hosted fonts, Netlify Identity guard,
dependency cleanup, the full Astro 4→7 + Tailwind 4 migration, Buttondown removal, post
slug renames, the "dunegons" typo, the retired `featured` feature, and the `Score`
component.*

*Resolved 2026-08-01: branded build-time OG cards; JSON-LD page types (`WebSite` /
`CollectionPage` / `WebPage` / `BlogPosting` + `VideoGame`); RSS `<link rel="alternate">`;
missing meta descriptions and `og:type=article` on non-post pages; site-name title suffixes;
all 34 `astro check` errors; the `/tags` 404 (a tags index now exists); the last three
third-party image hotlinks (Inoreader, Feedly and — found in this pass, on every page —
Ko-fi); favicon MIME type; `README.md`; `caniuse-lite`.*
