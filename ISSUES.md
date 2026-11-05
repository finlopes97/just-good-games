# ISSUES.md — Open items

**Status (2026-11-06):** build green (Astro 7, 38 pages), all published URLs preserved. The
original audit and the Astro 4→7 migration are done; that history is in git. This file
tracks only what's **still open**.

**Editorial direction (2026-11-06):** the blog is pivoting to **multi-game list posts** as the
main format. This replaces the July note about moving to single-game posts. Full-length
articles stay supported but are secondary, and may not be about a specific game at all
(e.g. industry observations). Post type comes from the data: no `games[]` = article,
one game = single-game layout, two or more = list layout.

---

## Content structure (next up)

1. **List-post layout.** Today a roundup's facts render as one summary block *below* the
   article, and each game's writing lives in the markdown body. Sätteri can't put components
   inside markdown, so the facts and store links can't sit next to each game's writing.
   **Proposed (needs sign-off, it's a schema change):** add a `games[].writeup` markdown
   field so each game renders as its own block (anchored heading, image, compact facts,
   writeup, store links), with the markdown body as intro and outro. Decap handles this well
   (a list widget with a markdown editor per item). The RSS feed must render the entries
   too, since it currently renders only `post.body`.
   **Must support three orderings**, set per post: **ascending** (1 → 10), **descending**
   (a 10 → 1 countdown, e.g. top tens) and **unnumbered** (roundups). The order in
   frontmatter is reading order; the setting only controls the numbers shown.
   Pilot on `the-top-ten-games-of-2024.md`.
2. **Images use raw `<img src={image.url}>`, not `astro:assets`.** No build-time optimisation
   or responsive sizing. List posts mean several images per post, so this now matters more.
   **Decide on this before adding `games[].image`**, otherwise every image entry gets
   rewritten twice.

## SEO / sharing

3. **JSON-LD for games.** Non-post pages now emit `WebSite` (home) / `WebPage` (others), and
   posts emit `BlogPosting`. What's left: list posts should add an `ItemList` of `VideoGame`s
   (each linking to its block on the page), single-game posts `about: VideoGame`, and articles
   stay plain `BlogPosting`. The source is `games[]`: `pitch` → `description`, developers →
   `author`, publishers → `publisher`, store URLs → `sameAs`, and `releaseDate` →
   `datePublished` only when it parses as a full date (enter dates as `19 July 2024`).
   As far as I know, Google doesn't show carousel or review results for video-game lists
   without scores. The value is telling search engines which games a page covers. Check
   with the Rich Results Test. `Review` is off the table unless scores come back.
4. **Branded OG images.** `og:image` reuses each post's thumbnail, and non-post pages have
   **no** OG image at all (they fall back to the compact `summary` Twitter card). The plan is
   build-time cards in the site's style via `satori` + `@resvg/resvg-js` (2 new deps,
   needs sign-off); satori can't read woff2, so use Fontsource's woff files. For list posts,
   show the game names as chips. Add `og:image:width`/`height`/`alt`.

## Third-party requests (target is zero)

5. **Ko-fi button image** (`src/components/Kofi.astro`, in the footer, so on **every page**)
   loads from `storage.ko-fi.com`.
6. **Homepage RSS block** hotlinks button images from `inoreader.com` and `feedly.com`
   (`src/pages/index.astro` via `RSSReaderLink`).
   For both: replace with on-brand text chips using `jgg-press`. The current buttons also
   break the interaction model (smooth 300ms `hover:-translate-y-1` lift instead of a
   stepped press).

## Code quality

7. **~47 `npx astro check` type errors** (non-blocking). Mostly implicit-`any` params,
   meaningless React-style `key={}` props in `.astro` files, and a `Tag` import-name
   collision in `src/pages/tags/[tag].astro`.
8. **Content schema is lighter than ideal for SEO**: no `updatedDate`, `draft` or
   `steamAppId`. Add deliberately if needed.
   **Backfill:** only `dungeons-of-hinterberg-review.md` has `games` so far. Data entry is
   the owner's job; don't guess publishers, dates, pitches or ITAD URLs.
9. **Tag pages** (`src/pages/tags/[tag].astro`) still use off-system styling
   (`bg-gray-100`, `font-bold`, `border-4`, rotations) rather than the design tokens.

## Housekeeping (cosmetic)

10. **`README.md`** is a two-line stub. Expand it with project-specific content.
11. **`body` token naming collision**: `body` is both the yellow colour scale and a font
    family. Renaming it (e.g. `canvas`) touches every template, so it needs sign-off.
12. `caniuse-lite` sometimes prints a Browserslist "outdated" warning at build. Clear it
    with `npx update-browserslist-db@latest`.

---

*Resolved items are in the git history. Most recent (2026-11-06): RSS `<link rel="alternate">`
in `<head>`; favicon MIME type; metadata for non-post pages (descriptions, `og:type`,
`<title>` with the site name, `og:site_name`, JSON-LD type); Decap config brought up to
date with `pitch` and `itad`; the stale `Score.astro` note removed.*
