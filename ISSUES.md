# ISSUES.md — Open items

**Status (2026-07-29):** build green (Astro 7, 38 pages), `npm audit` clean, all published
URLs preserved. The original first-session audit and the Astro 4→7 migration are done — that
history lives in git. This file now tracks only what's **still open**. None are urgent.

---

## SEO / sharing (highest leverage — these are the project's actual goal)

1. **Branded OG images.** `og:image` currently reuses each post's thumbnail. The goal
   (`CLAUDE.md §5`) is build-time OG cards in the site's visual language — yellow field,
   black border, Bebas title, hard shadow. Highest-leverage item in the repo.
2. **JSON-LD page types.** Every page emits `BlogPosting`. The homepage should be
   `WebSite`/`WebPage`; article pages reviewing a specific game should use `Review` /
   `VideoGame` (this is how obscure-title queries get won). Built in `src/components/Head.astro`.
   The `games[]` frontmatter added 2026-07-28 (name, developers, publishers, releaseDate,
   status, store links) is the data source for this — it just isn't read by `Head.astro` yet.
   `games[].pitch` (added 2026-07-29) maps cleanly onto `VideoGame.description`.
   **This is rising above item 1 in priority.** The blog is shifting from roundups to shorter
   single-game posts, which means less body copy per page for search to rank on — so the
   structured data carries proportionally more of the weight, and one post now maps to exactly
   one game, which is precisely the shape `Review`/`VideoGame` wants.
3. **RSS not linked from `<head>`.** The feed works at `/rss.xml`, but add
   `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` in `Head.astro` so
   readers can auto-discover it.

## Third-party requests (target is zero)

4. **Homepage RSS block hotlinks button images** from `inoreader.com` and `feedly.com`
   (`src/pages/index.astro` via `RSSReaderLink`). Self-host the images or drop the buttons.

## Content pipeline / code quality

5. **Images use raw `<img src={image.url}>`, not `astro:assets`.** Frontmatter `image` is
   `{ url, alt }` strings, so there's no build-time optimisation / responsive sizing.
   Migrating is worthwhile but non-trivial (touches the schema and every image reference).
6. **~47 `npx astro check` type errors** (non-blocking; build is fine). Mostly implicit-`any`
   params in components, meaningless React-ism `key={}` props in `.astro` files, and a
   `Tag` import-name collision in `src/pages/tags/[tag].astro`. Clear by typing params and
   renaming the `Tag` import.
7. **Content schema is lighter than SEO-ideal** — no `updatedDate`, `draft` or `steamAppId`
   in `src/content.config.ts`. Add deliberately if/when needed. (`games[]` landed 2026-07-28;
   `games[].pitch` and the `itad` store id followed 2026-07-29.)
   **Backfill outstanding:** only `dungeons-of-hinterberg-review.md` carries `games` so far,
   and only with facts verifiable from the repo (developer Microbird Games, its Steam URL,
   full release). Publishers and release dates for every post are a data-entry pass via
   `/admin` — don't guess them. Same rule for the two new fields: `pitch` is owner-written
   copy (capped at 300 chars, so an over-long one fails the build), and `itad` URLs must be
   pasted from the real ITAD page — the slug isn't derivable from a title, and a guess
   produces a confident 404 in the "Where to get it" block.
8. **`Score.astro` is unused** — a review-score component kept as future scaffolding. If you
   wire it up, its `<style>` uses `@apply`, which needs `@reference "../styles/global.css";`
   at the top of the block under Tailwind 4.

## Housekeeping (cosmetic)

9. **`README.md`** is still the stock Astro "Minimal Starter" template — replace with
   project-specific content.
10. **Favicon `<link>`** in `Head.astro` uses `type="png"`; correct MIME is `image/png`.
11. **`body` token naming collision** — `body` is both the yellow colour scale and a font
    family. A rename (e.g. `canvas`) touches every template; needs sign-off.
12. `caniuse-lite` occasionally prints a Browserslist "outdated" warning at build — clear
    with `npx update-browserslist-db@latest`.

---

*Resolved items (tag dedup, JSON-LD/OG fixes, self-hosted fonts, Netlify Identity guard,
dependency cleanup, the full Astro 4→7 + Tailwind 4 migration, Buttondown removal, post
slug renames, the "dunegons" typo) are in the git history.*
