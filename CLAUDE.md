# CLAUDE.md — Just Good Games

Project instructions for Claude Code. Read this before touching anything.

---

## 1. What this is

**Just Good Games** (https://justgood.games) is a one-person blog covering lesser-known
indie games — the kind with forty Steam reviews and one great idea. Titles like
*Mayor May Knott*, *Automaton Heart*, *Abyss Veil*.

It is a hobby project. There is no monetisation, no ad tech, no analytics vendor, no
paywall, and no CMS subscription. It must stay free to run.

The site was originally hand-coded in Astro, abandoned in favour of Ghost, and is now
being revived. Expect the codebase to be stale, partially finished, and inconsistent
with this document. **Where the code and this document disagree, this document is the
target state** — but flag the gap rather than silently rewriting large surfaces.

### Who it's for

Someone who followed a link from a Reddit thread, a Bluesky post, or a Google search for
a game nobody else has written about. They arrive cold, on mobile, with no loyalty. The
site has one job: make them finish the article and remember the name.

### What that means technically

Two goals drive almost every decision below:

1. **Search is the primary discovery channel.** Nobody is competing for these queries.
   Clean semantic HTML, fast static pages, structured data, and stable URLs are the
   whole strategy. Never break a published URL.
2. **Link previews are the second channel.** Posts get shared as embeds in Discord,
   Bluesky, Reddit and Slack. The Open Graph card is often the *only* thing most people
   ever see of this site. It deserves as much care as the page itself.

---

## 2. Design direction — read this section twice

The site is **neo-brutalist**: high contrast, hard angles, graphic bluntness. This is a
deliberate, non-negotiable identity choice. The point is to be memorable at a glance in a
sea of dark-mode minimalist blogs.

**Do not soften it.** The single most likely failure mode is drifting toward tasteful
defaults — rounding a corner "just slightly", adding a subtle gradient, blurring a
shadow, muting a colour, adding a dark mode. If a change would make the site look more
like every other blog, it is wrong, even if it looks "cleaner" in isolation.

### 2.1 Core grammar

| Property | Rule |
|---|---|
| Border radius | `0`. Everywhere. No exceptions. |
| Borders | Solid `#000000`, `3px` default, `5px` for major containers |
| Shadows | Hard offset only: `4px 4px 0 #000` (small), `8px 8px 0 #000` (large) |
| Blur | Never. No `blur`, no `spread`, no soft shadows |
| Gradients | Never. Flat fills only |
| Transparency | Avoid. No glassmorphism, no overlays under 100% opacity |
| Dark mode | Not supported. Do not add it |
| Colour fields | Large, flat, confidently blocked |

### 2.2 Colour tokens

Defined in `tailwind.config.mjs`. Values as they currently stand:

| Token | Role | Key values |
|---|---|---|
| `body` | Page canvas (**yellow**) | `500 #ffff00`, `300 #ffff66`, `200 #ffff99` |
| `accent` | Cards, nav chips (**pink/magenta**) | `300 #ff98f3`, `500 #ff27d7`, `600 #ff00bb` |
| `primary` | Display headings (**red**) | `600 #ff0000`, `500 #ff2323` |
| `secondary` | Tertiary highlights (**purple**) | `500 #af47ff`, `600 #9e2af3` |
| `foreground` | Text and borders | `500–900 #000000`, `100 #cccccc` |
| `background` | Surfaces | `100–500 #ffffff` |

**Naming footgun:** `body` is a *colour scale* (yellow) and also a *font family*. This
has almost certainly caused confusion already. See §7 for the proposed rename — do not
rename unilaterally.

**Usage rules:**

- Yellow is the canvas. Pink is the content surface. Red is for display type only.
- **Black is the workhorse for all reading text.** Saturated colour on saturated colour
  is reserved for large display type where the contrast maths still holds.
- Purple (`secondary`) is currently underused. It's the natural choice for tags, meta,
  or a second card variant — but pick one job and keep it there.
- The `background` scale being white at `100–500` is not a bug, it's a flat ramp. Don't
  "fix" it without checking usage first.

### 2.3 Typography

Three faces, three jobs:

- **Bebas Neue** (`font-heading`) — display and UI. All caps. Site title, article
  titles, nav, buttons. Tight tracking. This face carries the whole personality.
- **Piazzolla** (`font-subheading`) — serif, for section headers and pull quotes. The
  deliberate note of contrast against Bebas's bluntness.
- **Ysabeau** (`font-body`) — body copy. Sentence case, always.

Type scale is a 1.333 (perfect fourth) modular scale, `sm` through `5xl`. Stick to it;
don't introduce arbitrary sizes.

**Measure:** article body uses the `max-w-post-*` utilities (`65ch`–`100ch`). Default to
`post-70` for body copy. Wider than `post-80` is unreadable regardless of how much room
the layout has.

Self-host the fonts (`@fontsource/*` or local `woff2`) with `font-display: swap`. Do not
load them from Google's CDN — it's a render-blocking third party on a site whose entire
value proposition is loading instantly.

### 2.4 Signature elements

The things that make it *this* site rather than generic brutalism:

- **The wordmark**: red fill with a hard black offset text-shadow. This treatment is the
  logo. Don't apply it to arbitrary headings — its scarcity is what makes it read as a
  mark.
- **The card**: black-bordered block with a hard offset shadow, sitting on yellow.
- **The chip**: small pink block with a black border, used for dates, tags, and buttons.

**Interaction model — "press":** on hover/focus, translate an interactive element toward
its shadow and shrink the shadow by the same amount, so it appears to physically depress.
No fades, no colour transitions, no scale transforms.

```css
.jgg-press {
  box-shadow: 4px 4px 0 #000;
  transition: transform 80ms steps(2), box-shadow 80ms steps(2);
}
.jgg-press:hover, .jgg-press:focus-visible {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}
```

Use `steps()` easing rather than smooth curves — the snap is part of the aesthetic.

### 2.5 Quality floor

Brutalism is a visual style, not an excuse. These are non-negotiable:

- **Responsive to 320px.** The 8px shadows and 5px borders need to scale down on mobile
  or they eat the viewport.
- **Visible keyboard focus.** Given the aesthetic, use a thick black or purple outline
  with an offset — never `outline: none`.
- **`prefers-reduced-motion`** disables the press transform.
- **Contrast:** black on yellow and black on pink both pass comfortably. Red `#ff0000`
  on yellow `#ffff00` is roughly 3.7:1 — that passes AA for *large text only*. Never use
  a saturated colour on a saturated colour below `text-3xl`.
- Semantic HTML: real `<article>`, `<nav>`, `<time>`, one `<h1>` per page, heading levels
  in order.

---

## 3. Stack

**Confirmed from `astro.config.mjs`:**

- Astro, static output, `site: 'https://justgood.games'`
- `@astrojs/tailwind`, `@astrojs/mdx`, `astro-icon`, `@astrojs/sitemap`
- Custom remark plugin: `./remark-reading-time.mjs`
- `@tailwindcss/typography` plugin
- Hosted free on **Netlify**

**Ship no client-side JavaScript by default.** Astro islands only where genuinely
required (there is currently no such requirement). No React, no Svelte, no Vue — the
Tailwind `content` glob lists them but nothing should actually need them.

### Constraints

- Must remain free to host. No paid services, no serverless functions requiring a plan.
- No third-party analytics, no tracking scripts, no external font CDN, no comment
  embeds. Zero third-party requests is the target.
- Build must stay fast enough to deploy on Netlify's free tier without thought.

---

## 4. Content model

Articles are MDX. Use **Astro Content Collections** with a Zod schema — if the project
predates collections and uses a glob, migrating is a worthwhile early task.

Target frontmatter schema:

```ts
{
  title: string,
  description: string,        // also the OG + meta description; 140–160 chars
  pubDate: date,
  updatedDate: date | undefined,
  featured: boolean,          // drives the homepage hero slot
  draft: boolean,
  heroImage: image | undefined,
  heroAlt: string | undefined,
  games: string[],            // canonical game titles covered
  tags: string[],
  steamAppId: number | undefined,  // enables store links + structured data
}
```

**URL policy:** `/articles/[slug]/` — flat, lowercase, hyphenated, no dates in the path.
URLs are permanent. If a slug must change, add a redirect in `netlify.toml`; never leave
a 404.

Reading time comes from the existing remark plugin and should surface in a chip on the
article header.

---

## 5. SEO and sharing requirements

These are load-bearing for the project's actual goal. Treat them as features, not polish.

- **Per-page meta**: unique `<title>` and description on every route. Titles should read
  as the query someone actually types — "Is *Automaton Heart* worth playing?" beats
  "Automaton Heart: A Review".
- **JSON-LD**: `Review` and `VideoGame` structured data on article pages where a specific
  game is the subject. This is how obscure-title queries get won.
- **Open Graph images**: generate them at build time in the site's own visual language —
  yellow field, black border, Bebas Neue title, hard shadow. A shared link should be
  instantly recognisable as Just Good Games. This is one of the highest-leverage things
  in the whole repo.
- **RSS**: `@astrojs/rss` **is installed and working** — `src/pages/rss.xml.js` builds a
  full-content feed at `/rss.xml` (sanitised HTML via `sanitize-html` + `markdown-it`),
  with an XSL stylesheet at `public/rss/styles.xsl`. **Remaining gap:** the feed is not yet
  linked from `<head>` with `<link rel="alternate" type="application/rss+xml">` — add that
  in `src/components/Head.astro`. This audience still uses readers.
- Sitemap is already configured — verify it's actually reaching Netlify's output.
- Canonical URLs on every page.

---

## 6. Working agreements

- **Audit before building.** This is a revived codebase. Read what's there and report
  before proposing changes.
- **Ask before restructuring.** Small fixes and single-component work: go ahead. Anything
  touching routing, the content schema, the build pipeline, or a dependency major
  version: propose first, with the trade-off stated plainly.
- **One concern per change.** Don't bundle a Tailwind v4 migration into a card
  restyle.
- **Never invent games, developers, review scores, release dates, or Steam App IDs.**
  Placeholder content must be obviously fake (`LOREM GAME TITLE`) so it can't ship by
  accident.
- **Say when something is uncertain** rather than filling the gap with a confident guess.
- Prefer deleting dead code from the Ghost era over leaving it commented out.
- Match the existing code style. If there isn't one, establish it and note it here.

---

## 7. Known issues and first-session audit

Work through this before any feature work. Report findings; don't fix silently.

**Confirmed issues:**

1. `astro.config.mjs` sets `typescript: { strict: true }` — **this is not a valid Astro
   config option** and is being ignored. TS strictness belongs in `tsconfig.json` via
   `"extends": "astro/tsconfigs/strict"`. Fix in the right place.
2. `@astrojs/tailwind` is the **Tailwind v3** integration. Tailwind v4 uses
   `@tailwindcss/vite` and a CSS-first config. Decide deliberately: staying on v3 is a
   legitimate choice for a stable hobby site; migrating means rewriting
   `tailwind.config.mjs` as `@theme` CSS. Do not start this without agreement.
3. `tailwind.config.mjs` uses `require()` inside an ESM file. It works today because
   Tailwind's config loader transpiles it — but it will break under a v4 migration.
4. ~~No RSS feed.~~ **Resolved** — RSS is installed and the feed builds; only the `<head>`
   `<link>` is still missing (see §5).
5. Token naming collision: `body` is both a colour scale and a font family.
   **Proposal** (needs sign-off): rename the yellow scale to `canvas`, and consider
   `paper` for the pink surface scale. Purely mechanical, but touches every template.

**Determined (first-session audit, 2026-07-25):**

- **Versions:** Node 24.18.0, npm 11.16.0, Astro **4.10.0** (3 majors behind 7.x).
  Dependencies **install cleanly** (`npm install`, exit 0), but `npm audit` reports 55
  vulnerabilities — mostly from the `decap-cms-app` tree. See `ISSUES.md §1` for the full
  outdated table and upgrade recommendations (do the in-range bumps freely; Astro 4→7 and
  Tailwind 3→4 need their own sign-off).
- **Scripts:** `dev` / `start` (`astro dev`), `build` (`astro build`), `preview`
  (`astro preview`), `astro`. There is **no** dedicated `check`/lint script — run
  `npx astro check` directly (currently 54 strict-mode type errors; they do **not** block
  the build). Real commands recorded in §8.
- **Content collections are in use** — `src/content/config.ts` defines a Zod-typed `posts`
  collection; all pages read via `getCollection("posts")`. Note the *actual* schema differs
  from the target in §4 (see §4 and `ISSUES.md §3h`).
- **`netlify.toml` does not exist.** The URL-redirect policy in §4 has nowhere to live yet;
  add one when the first redirect is needed. Sitemap output *does* reach `dist/`.
- **Images use raw `<img src={image.url}>` tags**, not `astro:assets`. The frontmatter
  `image` is `{ url, alt }` strings, so there's no build-time optimisation/responsive
  sizing. Migrating to `astro:assets` is a worthwhile (non-trivial) task.
- **`remark-reading-time.mjs`** sets `frontmatter.minutesRead` to a friendly string like
  `"3 min read"` (via the `reading-time` package). Surfaced on the article header in
  `src/pages/posts/[...slug].astro`.
- **Pages vs nav:** nav links Home / Featured / Archive / About — **all four exist**
  (`index`, `featured`, `archive`, `about`), plus `posts/[...slug]`, `tags/[tag]`, `admin`,
  and `rss.xml.js`.
- **Ghost artefacts:** none obvious. `README.md` is still the stock Astro "Minimal Starter"
  template. Dead/broken code worth deleting: `src/components/SearchBar.astro` (non-functional
  + unused) and `src/utils/paginate.js` (unused) — see `ISSUES.md §2c/§2d`.

**Full findings live in `ISSUES.md` at the repo root.**

---

## 8. Commands

All verified working on 2026-07-25 (Node 24.18.0). Note: Node was **not on `PATH`** during
the audit — it lives at `C:\Program Files\nodejs`. If `npm` isn't found, add that folder to
`PATH` (or prefix the session: `$env:Path = "C:\Program Files\nodejs;$env:Path"`).

```bash
npm install       # exit 0 — 1217 packages (55 audit vulns, mostly from the CMS tree)
npm run dev       # ✓ serves http://localhost:4321/ (HTTP 200)
npm run build     # ✓ 44 pages built to ./dist/ in ~2s
npm run preview   # preview the built ./dist/ locally
npx astro check   # ✗ exits 1 — 54 strict type errors; does NOT block build (see ISSUES.md §4)
```

---

## 9. Out of scope

Don't build these unless explicitly asked: comments, user accounts, search-as-a-service,
a CMS or admin UI, newsletter signup embeds, analytics, ads, dark mode, or any feature
that introduces a recurring cost or a third-party request.
