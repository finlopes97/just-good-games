# CLAUDE.md — Just Good Games

Project instructions for Claude Code. Read this before touching anything.

> **Status (2026-07-26):** the codebase is current and healthy — Astro 7, Tailwind 4,
> `npm audit` clean, builds green. The big migration and first-audit cleanup are done; see
> `ISSUES.md` for the short list of *remaining* open items. This document describes the
> **actual current state**, not an aspirational target.

---

## 1. What this is

**Just Good Games** (https://justgood.games) is a one-person blog covering lesser-known
indie games — the kind with forty Steam reviews and one great idea.

It is a hobby project. There is no monetisation, no ad tech, no analytics vendor, no
paywall, and no CMS subscription. It must stay free to run.

### Who it's for

Someone who followed a link from a Reddit thread, a Bluesky post, or a Google search for
a game nobody else has written about. They arrive cold, on mobile, with no loyalty. The
site has one job: make them finish the article and remember the name.

### What that means technically

Two goals drive almost every decision below:

1. **Search is the primary discovery channel.** Nobody is competing for these queries.
   Clean semantic HTML, fast static pages, structured data, and stable URLs are the
   whole strategy. **Never break a published URL** — add a redirect in `netlify.toml`.
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

Defined in **`src/styles/global.css`** as a Tailwind v4 `@theme` block (`--color-<name>-<shade>`).
Values:

| Token | Role | Key values |
|---|---|---|
| `body` | Page canvas (**yellow**) | `500 #ffff00`, `300 #ffff66`, `200 #ffff99` |
| `accent` | Cards, nav chips (**pink/magenta**) | `300 #ff98f3`, `500 #ff27d7`, `600 #ff00bb` |
| `primary` | Display headings (**red**) | `600 #ff0000`, `500 #ff2323` |
| `secondary` | Tertiary highlights (**purple**) | `500 #af47ff`, `600 #9e2af3` |
| `foreground` | Text and borders | `500–900 #000000`, `100 #cccccc` |
| `background` | Surfaces | `100–500 #ffffff` |

**Naming footgun:** `body` is both a *colour scale* (yellow) and a *font family*. Live with
it or rename deliberately — a rename touches every template, so needs sign-off.

**Usage rules:**

- Yellow is the canvas. Pink is the content surface. Red is for display type only.
- **Black is the workhorse for all reading text.** Saturated colour on saturated colour
  is reserved for large display type where the contrast maths still holds.
- Purple (`secondary`) is underused. It's the natural choice for tags, meta, or a second
  card variant — but pick one job and keep it there.
- The `background` scale being white at `100–500` is not a bug, it's a flat ramp.

### 2.3 Typography

Three faces, three jobs — all **self-hosted via `@fontsource`** (imported in
`src/components/Head.astro`), no Google CDN:

- **Bebas Neue** (`font-heading`) — display and UI. All caps. Site title, article
  titles, nav, buttons. Tight tracking. This face carries the whole personality.
- **Piazzolla** (`font-subheading`) — serif, for section headers and pull quotes. The
  deliberate note of contrast against Bebas's bluntness. (Variable font — registers as
  the family name **`Piazzolla Variable`**.)
- **Ysabeau** (`font-body`) — body copy. Sentence case, always. (Variable font —
  **`Ysabeau Variable`**.)

Type scale is a 1.333 (perfect fourth) modular scale, `sm` through `5xl`. Stick to it;
don't introduce arbitrary sizes.

**Measure:** article body uses the `max-w-post-*` utilities (`65ch`–`100ch`, mapped via
the `--container-post-*` theme namespace). Default to `post-70`. Wider than `post-80` is
unreadable regardless of layout room.

### 2.4 Signature elements

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
- **Visible keyboard focus.** Use a thick black or purple outline with an offset — never
  `outline: none`.
- **`prefers-reduced-motion`** disables the press transform.
- **Contrast:** black on yellow and black on pink both pass comfortably. Red `#ff0000`
  on yellow `#ffff00` is roughly 3.7:1 — passes AA for *large text only*. Never use a
  saturated colour on a saturated colour below `text-3xl`.
- Semantic HTML: real `<article>`, `<nav>`, `<time>`, one `<h1>` per page, heading levels
  in order.

---

## 3. Stack

- **Astro 7** (`astro@7.x`), static output, `site: 'https://justgood.games'`.
- **Markdown engine: Sätteri** (Astro 7's default Rust processor). It does **not** run
  remark/rehype plugins — don't add any expecting them to run. CommonMark + GFM + YAML
  frontmatter are native.
- **Tailwind v4, CSS-first.** `@tailwindcss/vite` (registered in `astro.config.mjs`
  under `vite.plugins`), theme in `src/styles/global.css` (`@import "tailwindcss"` +
  `@theme` + `@plugin "@tailwindcss/typography"`). **There is no `tailwind.config.mjs`.**
  If you use `@apply` inside a component `<style>`, add `@reference "../styles/global.css";`
  at the top of that block or the theme utilities won't resolve.
- **Integrations:** `astro-icon`, `@astrojs/sitemap`, `@astrojs/rss`, `astro-navbar`.
  No `@astrojs/mdx` (content is `.md`, no MDX features used).
- **Fonts:** self-hosted `@fontsource` / `@fontsource-variable` (see §2.3).
- **Hosting:** free tier on **Netlify**. `netlify.toml` pins `NODE_VERSION = "22"` and
  holds all URL redirects.
- `npm audit` is **clean (0 vulnerabilities)**. Keep it that way.

**Ship no client-side JavaScript by default.** Astro islands only where genuinely
required (there is currently no such requirement). No React/Svelte/Vue.

### Environment quirk

Node is installed at `C:\Program Files\nodejs` but is **not on PATH in Claude Code's tool
shells** — prefix PowerShell commands with `$env:Path = "C:\Program Files\nodejs;$env:Path"`
(it doesn't persist across calls). The user's own terminal has Node on PATH.

### Constraints

- Must remain free to host. No paid services, no serverless functions requiring a plan.
- No third-party analytics, no tracking scripts, no external font CDN, no comment embeds.
  **Zero third-party requests is the target** (a couple remain — see `ISSUES.md`).
- Build must stay fast enough to deploy on Netlify's free tier without thought.

---

## 4. Content model

Articles are **Markdown (`.md`)** in `src/content/posts/`, read via **Astro Content
Collections (Content Layer API)**. The collection is defined in `src/content.config.ts`
with a `glob()` loader and a Zod schema.

**Actual frontmatter schema** (`src/content.config.ts`):

```ts
{
  title: string,
  pubDate: date,
  description: string,          // also the OG + meta description
  author: string,
  tags: string[],               // normalised to lowercase + trimmed by the schema
  gameTitle?: string,
  games?: Array<{               // see below
    name: string,
    pitch?: string,             // max 300 chars — the "What is it" row of GameFacts
    developers?: string[],
    publishers?: string[],
    releaseDate?: string,       // free text: "18 July 2024" | "2024" | "TBA"
    status?: 'full-release' | 'early-access' | 'demo' | 'free' | 'mod',
    links?: Array<{ store: StoreId, url: string, label?: string }>,
  }>,
  image?: { url: string, alt: string },
}
```

`StoreId` is `steam | itch | gog | epic | playstation | xbox | nintendo | itad | other`.
`itad` is an IsThereAnyDeal price-tracker link, not a storefront: it renders with the label
**"Price history"** and is always sorted after the real buy links. URLs are entered by hand —
ITAD slugs aren't derivable from a title, and guessing one produces a confident 404.

**`games[]` drives two components**, both of which render nothing when the field is absent
(so older posts are unaffected):

- `GameFacts.astro` — a PC Gamer "Need to Know"-style label/value list: pitch, release date,
  developer(s), publisher(s) and status. Posts covering **one** game get `variant="detail"`
  above the article body, headed **"The gist"** (a two-column grid, values aligned to a common
  column); **multi-game roundups** get `variant="summary"` below it headed "The games", as a
  compact wrapped row, because a four-game spec dump ahead of the intro buries the writing.
  Wired up in `src/pages/posts/[...slug].astro`. Rows are built once by `factRows()` so both
  variants stay in the same order. The detail panel **deliberately omits the game's name** —
  the post `<h1>` has just said it. Per-game names only appear when there's more than one game.
  **Labels are Bebas Neue, values are Ysabeau** — the two faces have different ascents, so
  every row needs `items-baseline`. Without it the value sits visibly below its label.
- `StoreLinks.astro` — a "Where to get it" block of pressable store chips at the foot of
  the article. Store links already written inline in post bodies were left in place.

Both are yellow (`body-300`) panels with 3px black borders and hard shadows; the status chip
is purple (`secondary-500`), which is `secondary`'s one job. Since Sätteri can't run
components inside markdown, frontmatter is the only structured route — and it's what a
future `Review`/`VideoGame` JSON-LD upgrade will read from.

*Richer fields that would help SEO but aren't implemented yet* (nice-to-have, not present):
`updatedDate`, `draft`, `steamAppId`. Add deliberately if needed.

**URL policy:** `/posts/[slug]/` — flat, lowercase, hyphenated. **The filename IS the slug**
(the `glob()` loader derives `entry.id` from it), so renaming a file changes its URL. Posts
currently follow a **`Month Year - Title`** naming scheme (dates in the slug are allowed —
a deliberate owner choice). URLs are permanent: if a slug changes, add a 301 in
`netlify.toml`; never leave a 404. Access entries by `entry.id`; render with
`render(entry)` from `astro:content`.

**Reading time** is computed page-side in `src/pages/posts/[...slug].astro`
(`getReadingTime(entry.body ?? "")` via the `reading-time` package — *not* a remark plugin,
since Sätteri won't run one) and shown in a chip on the article header.

**Authoring:** a Decap CMS admin lives at `/admin` (`public/admin/config.yml`, loaded from
the unpkg CDN, git-gateway backend). It writes `.md` — keep `extension: "md"` there.

---

## 5. SEO and sharing requirements

Load-bearing for the project's actual goal. Treat as features, not polish. Current state:

- **Per-page meta** ✅ — unique `<title>` + description on every route (`Head.astro`).
  Titles should read as the query someone types.
- **Canonical URLs** ✅ on every page.
- **Open Graph / Twitter** ✅ — absolute `og:image`/`twitter:image`, ISO `published_time`.
  *Open item:* images currently reuse the post thumbnail; the aspiration is **build-time
  branded OG cards** in the site's visual language (yellow field, black border, Bebas
  title, hard shadow) — high leverage, not yet built.
- **JSON-LD** ✅ valid — but every page currently emits `BlogPosting`. *Open items:* the
  homepage should be `WebSite`/`WebPage`, and article pages that review a specific game
  should use `Review` / `VideoGame` (how obscure-title queries get won). Publisher logo
  points at `/images/favicon.png`.
- **RSS** ✅ installed and working — `src/pages/rss.xml.js` builds a full-content feed at
  `/rss.xml` (sanitised via `sanitize-html` + `markdown-it`), XSL at `public/rss/styles.xsl`.
  *Open item:* still not linked from `<head>` with `<link rel="alternate" type="application/rss+xml">`.
- **Sitemap** ✅ — `@astrojs/sitemap` builds `sitemap-index.xml` into `dist/`.

---

## 6. Working agreements

- **Audit before building.** Read what's there and report before proposing changes.
- **Ask before restructuring.** Small fixes and single-component work: go ahead. Anything
  touching routing, the content schema, the build pipeline, or a dependency major version:
  propose first, with the trade-off stated plainly.
- **One concern per change.** Don't bundle unrelated work into one commit.
- **Verify against the URL baseline.** After any change that could affect routing, diff the
  generated `/posts/` and `/tags/` URLs so nothing silently breaks.
- **Never invent games, developers, review scores, release dates, or Steam App IDs.**
  Placeholder content must be obviously fake (`LOREM GAME TITLE`) so it can't ship by
  accident.
- **Say when something is uncertain** rather than filling the gap with a confident guess.
- Prefer deleting dead code over leaving it commented out.
- Match the existing code style.

---

## 7. Current state & open items

The original first-session audit and the Astro 4→7 migration are **complete**. What's
verified now: Astro 7.1.3, Tailwind 4, Content Layer, Sätteri; `npm run build` green
(38 pages); `npm audit` 0 vulnerabilities; all published URLs preserved via `netlify.toml`
redirects; `npx astro check` reports ~47 pre-existing type errors (implicit-`any`, React-ism
`key` props, a `Tag` import-name collision) that **do not block the build**.

**Remaining open items live in `ISSUES.md`.** The short version: RSS `<head>` link,
JSON-LD page-type refinement, branded OG cards, two third-party image hotlinks on the
homepage RSS block, images not using `astro:assets`, the type-check errors, and minor
housekeeping (stock `README.md`, favicon MIME type). None are urgent.

Pages that exist: `index`, `about`, `archive`, `posts/[...slug]`, `tags/[tag]`,
`admin`, `rss.xml.js`. Nav links Home / Archive / About.

The homepage hero is the **most recent post** (`HeroPost.astro`), showing a body excerpt
(`src/utils/excerpt.js`) rather than the frontmatter description. The old `featured`
feature — its schema field, `/featured` page, nav link, and hero component — was removed
2026-07-26; `/featured` 301-redirects to `/`.

---

## 8. Commands

Prefix with the PATH fix if `npm` isn't found (see §3 environment quirk):
`$env:Path = "C:\Program Files\nodejs;$env:Path"`

```bash
npm install       # deps; audit is clean
npm run dev       # dev server at http://localhost:4321/
npm run build     # static build -> ./dist/ (38 pages, incl. sitemap)
npm run preview   # preview the built ./dist/ locally
npx astro check   # type check — ~47 pre-existing errors, does NOT block the build
```

---

## 9. Out of scope

Don't build these unless explicitly asked: comments, user accounts, search-as-a-service,
newsletter signup embeds, analytics, ads, dark mode, or any feature that introduces a
recurring cost or a third-party request. (A Buttondown newsletter form was removed in
2026-07 — RSS is the subscription path.)
