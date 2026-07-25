# ISSUES.md — Codebase Review & Local Run Log

**Reviewed:** 2026-07-25
**Verdict:** ✅ The project still runs. `npm install`, `npm run build`, and `npm run dev`
all succeed on the current dependencies. Nothing below blocks the site from running or
building — but there are real bugs, config quirks, and a large gap between the code and
`CLAUDE.md`'s target state worth tracking.

---

## 0. Environment / how it was run

| Item | Value |
|---|---|
| Node | v24.18.0 |
| npm | 11.16.0 |
| Astro (installed) | 4.10.0 |

**Quirk — Node is not on `PATH`.** `node` / `npm` are not resolvable from PowerShell or
Bash. Node.js 24.18.0 is installed at `C:\Program Files\nodejs\` (confirmed via the
registry uninstall key) but that folder is missing from the user/system `PATH`. Every
command in this review had to be prefixed with:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

Recommend adding `C:\Program Files\nodejs` to `PATH` permanently so `npm run dev` works
from a plain terminal.

### Verified commands (all pass)

```bash
npm install        # exit 0 — 1217 packages
npm run build      # exit 0 — 44 pages built in ~2.2s
npm run dev        # exit 0 — serves http://localhost:4321/ (HTTP 200, homepage renders)
npx astro check    # exit 1 — 54 type errors, 0 warnings (see §4; does NOT block build)
```

---

## 1. Dependencies

### Install is clean but noisy
`npm install` succeeds. It prints deprecation warnings (`trim`, `redux-devtools-extension`,
`@types/axios` — see below) and **`npm audit` reports 55 vulnerabilities
(3 critical, 26 high, 23 moderate, 3 low)**. The bulk of these come from the
`decap-cms-app` dependency tree (the admin CMS) and Astro's older build chain, not from
runtime site code.

> No dependency versions were changed as part of this review. Per `CLAUDE.md §6`, anything
> touching a dependency **major** version needs sign-off first. The safe in-range updates
> and the major upgrades are both listed below as recommendations only.

### Outdated packages (`npm outdated`)

Everything currently pinned with `^` is behind. Notable:

| Package | Current | Wanted (safe, in-range) | Latest (major) |
|---|---|---|---|
| `astro` | 4.10.0 | 4.16.19 | **7.1.3** |
| `@astrojs/mdx` | 3.1.0 | 3.1.9 | 7.0.3 |
| `@astrojs/markdown-remark` | 5.1.0 | 5.3.0 | 7.2.1 |
| `@astrojs/tailwind` | 5.1.0 | 5.1.5 | 6.0.2 |
| `@astrojs/sitemap` | 3.1.6 | 3.7.3 | 3.7.3 |
| `@astrojs/rss` | 4.0.7 | 4.0.19 | 4.0.19 |
| `tailwindcss` | 3.4.4 | 3.4.19 | **4.3.3** |
| `typescript` | 5.5.4 | 5.9.3 | 7.0.2 |
| `decap-cms-app` | 3.1.11 | 3.15.1 | 3.15.1 |
| `sanitize-html` | 2.13.0 | 2.17.6 | 2.17.6 |
| `@types/node` | 20.14.12 | 20.19.43 | 26.1.1 |
| `@types/react` / `-dom` | 18.3.x | 18.3.x | 19.x |

**Recommendations (not yet applied):**
1. **Low risk, do soon:** bump everything to the *Wanted* column
   (`npm update`) — these stay inside the existing `^` ranges and match `package.json`.
   Re-run `npm run build` after.
2. **Needs sign-off (major):** Astro 4 → 7 and Tailwind 3 → 4 are both multi-major jumps.
   `CLAUDE.md §7` already flags the Tailwind v4 migration (CSS-first `@theme` config,
   `require()` in `tailwind.config.mjs` will break) as a deliberate decision, not a
   drive-by. Astro 4 → 7 similarly needs its own migration pass. Do **not** bundle these.
3. `@astrojs/rss` **is installed and working** (contradicts `CLAUDE.md §5/§7`, which say
   RSS is not installed — the doc is stale here; see §3).

### Deprecated transitive deps
- `@types/axios@0.14.0` — a stub; axios ships its own types. It's a listed `devDependency`
  but **nothing in `src/` imports axios**. Candidate for removal.
- `trim@0.0.1`, `redux-devtools-extension` — pulled in transitively (markdown / decap),
  not directly actionable.

---

## 2. Functional bugs (real, not just type noise)

### 2a. Tag pages render with no `<title>` — SEO bug
`src/pages/tags/[tag].astro:36` passes `<Layout pageTitle={tag}>`, but `Layout.astro:5`
reads `const { title } = Astro.props;`. The prop name doesn't match, so **every
`/tags/<tag>/` page gets an `undefined` title**. All other pages (`index`, `archive`,
`featured`, `about`) correctly pass `title={...}`. Given the project's entire strategy is
search + unique per-page titles (`CLAUDE.md §5`), this is worth fixing.
Fix: rename the prop to `title={tag}`.

### 2b. Typo: `justify-betwen`
`src/layouts/MarkdownPostLayout.astro:21` — `justify-betwen` is not a Tailwind class
(missing a `t`). The intended `justify-between` silently does nothing on article pages.

### 2c. `SearchBar.astro` is broken and unused
`src/components/SearchBar.astro:9` uses `onInput={e => onSearch(e.target.value)}` with an
`onSearch` **function passed as a prop**. Astro renders components to static HTML — you
cannot pass a function into an inline handler this way; it will not wire up. The component
is also **imported nowhere** (grep finds no usage). Dead + non-functional. Either delete
it or reimplement as a client script. `CLAUDE.md §9` lists search-as-a-service as out of
scope, so deletion is the likely call.

### 2d. `src/utils/paginate.js` is unused
`paginate()` is defined but imported nowhere. `archive.astro` and `featured.astro` render
all posts ungrouped-by-page. Dead code (fine for now — the post count is small — but note
it if archive length ever matters).

---

## 3. Deviations from `CLAUDE.md` (code vs. target state)

`CLAUDE.md` explicitly says the doc is the target and the code is expected to be stale;
these are flagged, not "fixed silently."

### 3a. Fonts load from Google's CDN — contradicts §2.3
`src/components/Head.astro:56-58` includes `<link rel="preconnect">` to
`fonts.googleapis.com` / `fonts.gstatic.com` and a render-blocking Google Fonts
stylesheet. `CLAUDE.md §2.3` is explicit: *"Self-host the fonts… Do not load them from
Google's CDN."* This is a third-party, render-blocking request on a site whose whole pitch
is instant loads. The stylesheet also requests **Lexend Mega** and **Montserrat**, which
aren't in the `tailwind.config.mjs` font stack — extra unused font payload.

### 3b. Netlify Identity widget loads on *every* page — contradicts §3
`src/layouts/Layout.astro:10-34` injects
`https://identity.netlify.com/v1/netlify-identity-widget.js` into every page that uses
`Layout` (home, archive, featured, about, tags), not just the admin route. `CLAUDE.md §3`
targets *"zero third-party requests."* The identity widget only belongs on the CMS login
flow (`admin.astro` already has its own copy). Recommend removing it from `Layout.astro`.

### 3c. Placeholder JSON-LD ships on every article — §5
`src/components/Head.astro:33-54` emits `BlogPosting` structured data with
`"name": "Your Blog Name"` and a `"logo"` pointing at `siteUrl + "/logo.jpg"` (a file
that doesn't exist in `public/`), with a literal `// Replace with your logo URL` comment.
Placeholder publisher data is being served as real structured data. `CLAUDE.md §5` wants
proper `Review` / `VideoGame` JSON-LD; at minimum the publisher name/logo need to be real.

### 3d. Open Graph image uses a relative URL — §1/§5
`Head.astro:21` sets `og:image` to `image.url`, which in content frontmatter is a
site-relative path (e.g. `/images/posts/thumbnails/...`). Most scrapers (Discord, Bluesky,
Slack, Facebook) require an **absolute** URL for `og:image` and will drop a relative one —
which directly undermines the "link previews are the second discovery channel" goal in
`CLAUDE.md §1`. Should be `siteUrl + image.url`. Same applies to `twitter:image`.

### 3e. `article:published_time` is a raw Date object
`Head.astro:22` outputs `content={pubDate}` where `pubDate` is a JS `Date`. This renders
as a locale/`toString()` date, not the ISO-8601 that OG expects. Should be
`pubDate.toISOString()`.

### 3f. Invalid `typescript` option in `astro.config.mjs` — confirmed, still present (§7.1)
`astro.config.mjs:12-14` still sets `typescript: { strict: true }`, which is **not a valid
Astro config key** and is silently ignored. TS strictness already lives correctly in
`tsconfig.json` (`"strict": true`). The config block should be deleted (it's a no-op).

### 3g. `require()` in an ESM config file — confirmed (§7.3)
`tailwind.config.mjs:105` uses `require("@tailwindcss/typography")` inside an `.mjs` ESM
file. Works today only because Tailwind's config loader transpiles it; it will break under
a Tailwind v4 migration. Noted, not urgent.

### 3h. Content schema differs from the §4 target
`src/content/config.ts` uses `{ pubDate, author, gameTitle, image:{url,alt} }`. The
`CLAUDE.md §4` target schema is richer (`updatedDate`, `draft`, `heroImage`/`heroAlt`,
`games[]`, `steamAppId`, description length rule). This is an expected gap — flagging so
it's tracked, not so it's rewritten unilaterally.

### 3i. No `netlify.toml`
There is no `netlify.toml` in the repo. `CLAUDE.md §4` relies on it for the URL-redirect
policy ("if a slug must change, add a redirect in `netlify.toml`"). Redirects currently
have nowhere to live. The sitemap *is* configured and reaches `dist/`
(`sitemap-index.xml` built) — that part of §5 checks out.

### 3j. `Subscribe.astro` embeds a Buttondown form — vs §9
`src/components/Subscribe.astro` posts to `buttondown.com` and is rendered on the homepage.
`CLAUDE.md §9` lists "newsletter signup embeds" as out of scope / third-party requests to
avoid. Also, the homepage RSS section (`index.astro:72-81`) hotlinks button images from
`inoreader.com` and `feedly.com` — more third-party requests. Flagging the tension; not
removing without a call from the owner.

---

## 4. Type-check failures (`npx astro check` → 54 errors)

**These do not block `astro build`** (Astro doesn't type-check on build), but the check
command fails. Categories:

- **Implicit `any` (majority)** — untyped params across `BlogPostCard.astro`,
  `BlogPostListing.astro`, `FeaturedBanner.astro`, `archive.astro`, `featured.astro`,
  `tags/[tag].astro` (`truncateText`, `groupPosts`, reduce/sort callbacks, etc.). These are
  strict-mode complaints; the code runs fine. Add param types to clear them.
- **React-isms that no-op in Astro** — `key={...}` props on `<div>` in `archive.astro` and
  `featured.astro` (ts2322: `key` not on `HTMLAttributes`). Harmless but meaningless in
  static Astro output; remove them.
- **`SearchBar.astro`** — `onInput` handler flagged (ts2322/7006); ties to bug §2c.
- **`Layout.astro`** — `window.netlifyIdentity` unknown property (ts2339); ties to §3b.
- **`tags/[tag].astro:5`** — `Import declaration conflicts with local declaration of
  'Tag'` (ts2440). Astro auto-generates a `Tag` symbol; the imported component name
  collides. Rename the import (e.g. `import TagChip from ...`) to clear it. Type-only —
  build still emits the tag pages.
- **1 hint** in `Head.astro:33` — the JSON-LD `<script>` is treated as `is:inline`; add the
  directive explicitly to silence it.

---

## 5. Content quirks

- **Case-duplicated tags create near-duplicate pages.** The build emits both
  `/tags/rpg/` and `/tags/RPG/`, and both `/tags/itch/` and `/tags/itch.io/`. Tag routing
  is case/format-sensitive, so inconsistent frontmatter tags fragment into separate pages —
  bad for the SEO goal and confusing for readers. Recommend normalizing tags (lowercase,
  canonical form) at the schema level or in `getStaticPaths`.
- Frontmatter carries an extra `image.filename` field not in the Zod schema. Zod strips
  unknown keys by default, so it's harmless — but the schema and the Decap CMS config
  (`public/admin/config.yml`) both know about `filename` while `config.ts` does not. Minor
  inconsistency.

---

## 6. Housekeeping / low priority

- `README.md` is still the stock Astro "Minimal Starter Kit" template — never replaced with
  anything project-specific.
- `CLAUDE.md §8` (Commands) and §7 ("To determine" list) are placeholders that this review
  now answers — worth folding the verified commands and findings back into that doc.
- `Head.astro:7` — favicon `<link>` uses `type="png"`; the correct MIME type is
  `image/png`. Cosmetic.
- `caniuse-lite` is outdated (build prints a Browserslist warning). Clear with
  `npx update-browserslist-db@latest`.

---

## 7. TL;DR priority list

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Tag pages have no `<title>` (§2a) | High (SEO) | Trivial |
| 2 | OG image is a relative URL (§3d) | High (sharing) | Trivial |
| 3 | Placeholder JSON-LD publisher/logo shipping live (§3c) | High (SEO) | Small |
| 4 | Google Fonts CDN instead of self-hosted (§3a) | Medium | Medium |
| 5 | Netlify Identity widget on every page (§3b) | Medium (perf/privacy) | Trivial |
| 6 | 55 npm vulnerabilities; deps behind (§1) | Medium | Small (in-range) / Large (majors) |
| 7 | `justify-betwen` typo (§2b) | Low | Trivial |
| 8 | Case-duplicate tag pages (§5) | Low–Med (SEO) | Small |
| 9 | Dead code: `SearchBar`, `paginate` (§2c/§2d) | Low | Trivial |
| 10 | Invalid `typescript` config key (§3f) | Low | Trivial |
