# ISSUES.md — Open items

**Status (2026-08-01):** build green (Astro 7, 39 pages), `npm audit` clean, `npx astro
check` **clean (0 errors, 0 warnings)**, all published URLs preserved. History lives in git;
this file tracks only what's **still open**.

**Page weight is fixed (§1).** Static images go through `astro:assets` (2026-11-12) and the
three animated GIFs are now tap-to-play video clips (2026-11-13).

**Editorial direction (2026-11-06):** the blog is pivoting to **multi-game list posts** as the
main format. This **reverses** the earlier note that the blog was moving to single-game
posts, which some comments still assume (e.g. the `VideoGame` comment in `Head.astro`). Full-length
articles stay supported but are secondary, and may not be about a specific game at all
(e.g. industry observations). See "List posts" below and `LAYOUT.md`.

---

## 1. Page weight

### 1a. Animated GIFs replaced with video clips — done 2026-11-13

The owner decided to keep animated examples, as video. The three GIFs were converted with
`npm run clip` (`scripts/clip.mjs`) and deleted; how clips work is in CLAUDE.md §4, "Clips".

| Clip | GIF | MP4 | Poster | Post |
|---|---|---|---|---|
| `2025_01/BladeChimera_3_ClobberingTime` | 44.5 MB | 0.6 MB | 56 KB | `january-2025-cruel-for-me-mule` |
| `2025_01/CRUEL_7_Window-Shopping` | 15.1 MB | 0.4 MB | 33 KB | `january-2025-cruel-for-me-mule` |
| `2024_12/ACHRA_1_Ogre` | 0.7 MB | 0.3 MB | 36 KB | `the-top-ten-games-of-2024` |

Clips are tap-to-play (`preload="none"`), so a reader downloads only the poster until they
press play. The Cruel post now loads about 0.6 MB of images instead of 62.9 MB.

What was tested (ffmpeg 8.1, the Blade Chimera GIF at 1280px wide): re-optimised GIF
23.2 MB, animated WebP 2.6 MB, animated AVIF 0.4 MB, H.264 0.5 MB, AV1 0.4 MB, VP9 0.5 MB.
H.264 was chosen because every phone hardware-decodes it; AV1 saves too little to justify
a second file, and animated AVIF/WebP decode like a GIF and can't be paused.

Left over:

- **Clips checked.** Checked in headless Edge at about 500px and desktop
  width (poster and controls render). Owner confirmed playback on a phone, 2026-11-13.
- A "PLAY CLIP" chip was baked into the posters at first and removed the same day: it
  looked tappable on a phone but wasn't. The native play button is enough.
- **Adding a clip through `/admin` is unverified.** The line of raw HTML may need the
  editor's markdown mode, and Decap's media library is set up for images. Owner is
  researching.
- **Old GIF URLs are dead**, the same as the old image URLs (§1b).
- The Achra clip came from a 428px-wide GIF and was doubled with nearest-neighbour scaling
  to stay crisp, which is why it is 0.3 MB rather than 0.1 MB.

### 1b. `astro:assets` migration — done 2026-11-12

Every static post image (64 files) moved from `public/images/posts/` to
`src/assets/posts/`, same folder layout. Posts reference them by relative path
(`../../assets/posts/...`), the thumbnail field uses `image()`, and
`image: { layout: 'constrained' }` is set in `astro.config.mjs`. How it works day to day is
in CLAUDE.md §4, "Images".

Image payload per post page, before and after. "After" is what a phone downloads (the
1280px-wide version of each image):

| Post | Before | After |
|---|---|---|
| `january-2025-cruel-for-me-mule` | 65.1 MB | 0.6 MB (after §1a; 62.9 MB while the GIFs remained) |
| `the-top-ten-games-of-2024` | 18.0 MB | 1.1 MB (after §1a) |
| `september-2024-path-of-achra-is-perfect` | 11.5 MB | 0.3 MB |
| `august-2024-clickolding-is-a-fever-dream` | 7.9 MB | 0.5 MB |
| `dungeons-of-hinterberg-review` | 7.3 MB | 0.7 MB |
| `october-2024-you-should-play-arco` | 2.5 MB | 0.5 MB |

Every optimised `<img>` now has `width`/`height` (no layout shift), lazy loading and a
`srcset`. A cold build takes about 10 seconds locally (was about 2) and writes roughly 500
WebP files; warm builds reuse the cache.

Left over from this work:

- **`/admin` uploads verified 2026-11-13** with the owner's test post: the image landed in
  `src/assets/posts/`, both the thumbnail and the body got `../../assets/posts/<file>`, and
  the build optimised it. Uploads go to the root of that folder, not a dated subfolder.
- **`test-post-delete-later` is live** (with new `test`, `blog` and `article` tag pages).
  Owner to delete it and `src/assets/posts/4560.jpg`.
- **Old image URLs are dead by design.** `/images/posts/...` addresses now 404. Owner accepted this on 2026-11-12. It affects posts already fetched
  by feed readers and image-search results, not post pages.
- **Four images come out slightly larger as WebP** than their source at full size, because
  the sources were already tiny: `POA_1_Leeches.png` (98 → 160 KB), `POA_2_God-of-Blood.png`
  (104 → 142 KB), `ARCO_1_Jungle-Ruins.png` (30 → 158 KB), `DREAD_1_Hunch.jpg` (120 → 137 KB).
  Phones get smaller variants, so the real cost is nil. Not worth special-casing.
- **Markdown images get `sizes="100vw"`** below their own width, so a desktop browser picks
  a version wider than the roughly 900px article column needs. Cheap at WebP sizes. Fixing
  it means capping source widths at 1920px (30 sources are wider), which rewrites the
  originals; left alone.
- **Nine source images are unused by any post** (two Arco, four CRUEL and two FNV
  screenshots, and `MORROWIND_1_Avatar.jpg`). They cost nothing in `src/` because unused
  assets aren't published. Delete or keep at the owner's discretion.
- `the-top-ten-games-of-2024.md` frontmatter carries an unused `image.filename` key, and
  the Decap config still has the matching "Filename" field. Harmless; the schema ignores it.

---

## List posts: freeform, with store-link chips (decided 2026-11-12)

**`LAYOUT.md` is the reference.** Summary:

The owner supplied the target post structure on 2026-11-12 and then chose a **freeform
writing environment** over structured per-game fields. A list post is one markdown body:
item headings, ranks, header images and details are typed by hand, in whatever order the
post wants (ascending, countdown or unnumbered). There is no `listOrder` field, no
`games[].writeup` and no item components. Both structured designs considered are recorded
in `LAYOUT.md` §4 with the reasons they were dropped.

**Built 2026-11-12: store-link chips in post bodies.** A bullet list where every bullet is
a single link, and at least one goes to a known store or IsThereAnyDeal, renders as a row
of pressable chips. CSS only (end of `src/styles/global.css`,
scoped to `jgg-prose` on `Prose.astro`). Piloted on `october-2024-you-should-play-arco`.

Still open:

- **Owner to check the Arco post on a phone.** The chips were checked locally at about
  500px and desktop width, not at a true phone width.
- **Convert store links in the other posts to bullet lists** (about 11 lines across the
  Clickolding, Cruel and Achra posts). It drops the "or"/"and" between links, so it needs
  the owner's sign-off on wording.
- **Recent posts strip** at the foot of every post. Not built. No client-side JavaScript,
  so it's a CSS scroll-snap row or a grid of three; owner to choose.
- **`ItemList` structured data** for list posts is now optional. It would need `games[]`
  filled in, and `games[]` is no longer required for anything on a list post.
- **OG cards** could show game names as chips, but only from `games[]`.

**Built 2026-11-13: fact cards.** A blockquote holding only a bullet list renders as a small
card with no bullet points (`LAYOUT.md` §3). It replaces the "The gist" panel.

**`games[]` is metadata only since 2026-11-13.** It stays in the schema, optional, and feeds
`VideoGame` structured data on single-game posts. `GameFacts.astro` and `StoreLinks.astro`
were deleted, with the `status` and link `label` fields. The Hinterberg post was the only
one using them: it lost its "The gist" panel and "Where to get it" block, and its body was
left as written. Owner to add a fact card and chip list there if wanted.

---

## Content pipeline

2. **Content schema is lighter than SEO-ideal** — no `updatedDate`, `draft` or `steamAppId`
   in `src/content.config.ts`. `updatedDate` is the most valuable of the three: it would
   feed `dateModified` in the JSON-LD, which is a real freshness signal. Add deliberately.

   **Backfill outstanding:** only `dungeons-of-hinterberg-review.md` carries `games` so far,
   and only with facts verifiable from the repo (developer Microbird Games, publisher Curve
   Games, its Steam URL). Publishers and release dates for every other post
   are a data-entry pass via `/admin` — don't guess them. Same rule for `pitch` (owner-written
   copy, capped at 300 chars so an over-long one fails the build) and `itad` URLs, which must
   be pasted from the real ITAD page — the slug isn't derivable from a title.

   `games[]` now feeds only `VideoGame` structured data (nothing visual), so the backfill
   is purely a search-engine benefit, and only for posts about a single game.

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
   - `MarkdownPostLayout.astro` uses `bg-secondary-200` for the byline chip. `secondary`
     has no assigned job now that the GameFacts status chip is gone; pick one deliberately.

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

*Resolved 2026-11-06: Decap config brought up to date with the schema (`games[].pitch` and the
`itad` store id were missing, so neither could be entered via `/admin`); owner-written meta
descriptions for Home, About and Archive; About page rewrite.*
