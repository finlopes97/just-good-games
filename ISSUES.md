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

### ✅ RESOLVED: 55 → 0 vulnerabilities

Original state: `npm audit` reported **55 vulnerabilities (3 critical, 26 high, 23 moderate,
3 low)**, the bulk from the `decap-cms-app` tree and the Astro build chain. **Now 0** — the
first pass (below) took it to 5; the Astro 7 migration cleared the rest.

Actions taken (build verified green + dev server HTTP 200 after each):
1. **`npm audit fix`** (no `--force`) — applied all in-range security patches.
2. **Removed `decap-cms-app`** — it was **imported nowhere**; `/admin` loads Decap from the
   unpkg CDN at runtime, so the local package was dead weight. Pruned **515 packages** and
   eliminated the entire React/immutable/uuid vuln cluster (which had *no fix* available).
3. **Removed `@types/axios`** — a types stub for a package nothing imports.
4. **`npm update`** — brought all remaining direct deps to their in-range "Wanted" versions.
5. **Pinned `@astrojs/sitemap` to exact `3.1.6`** — the in-range "Wanted" 3.7.3 **breaks the
   build** under Astro 4.16 (`Cannot read properties of undefined (reading 'reduce')` at
   `@astrojs/sitemap/dist/index.js:85`, in the `astro:build:done` hook). Exact-pinned so the
   broken 3.7.x can't be re-resolved. Revisit when the Astro 7 migration happens.

**✅ The final 5 were cleared by the Astro 4→7 migration (2026-07-26).** They were
`astro`/`@astrojs/mdx`/`esbuild`/`sharp`/`vite`, all gated behind `astro@7`. Astro 7 fixed
astro/esbuild/vite; removing `@astrojs/mdx` (post-`.md` switch) removed that one; a final
in-range `npm audit fix` cleared `sharp`. **`npm audit` now reports 0 vulnerabilities.**
See `MIGRATION.md` for the full upgrade record.

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

*(Table above is the original audit snapshot.)* Status now:
1. **✅ Done — in-range bumps applied** via `npm update` (all direct deps at their "Wanted"
   version), except `@astrojs/sitemap` which is deliberately pinned to `3.1.6` (see above).
2. **Still needs sign-off (major):** Astro 4 → 7 and Tailwind 3 → 4 are multi-major jumps.
   `CLAUDE.md §7` flags the Tailwind v4 migration (CSS-first `@theme` config; `require()` in
   `tailwind.config.mjs` will break) as a deliberate decision. Astro 4 → 7 needs its own
   migration pass (and would clear the last 5 vulns + let `@astrojs/sitemap` move forward).
   Do **not** bundle these. Also still on old majors by choice: `typescript` (5→7),
   `@types/node` (20→26), `@types/react`/`-dom` (18→19), `astro-seo` (0.8→1),
   `@astrojs/markdown-remark` (5→7), `@astrojs/mdx` (3→7), `@astrojs/tailwind` (5→6).
3. `@astrojs/rss` **is installed and working** (contradicts `CLAUDE.md §5/§7`, which say
   RSS is not installed — the doc is stale here; see §3).

### Deprecated transitive deps
- ~~`@types/axios@0.14.0`~~ — **✅ removed** (stub for a package nothing imports).
- `trim@0.0.1`, `redux-devtools-extension` — were pulled in via the `decap-cms-app` tree,
  now **gone** since that package was removed.
- ~~`astro-seo` (in `dependencies`) appears **unused**~~ — **✅ removed** (2026-07-25); the
  site uses a hand-rolled `Head.astro`. Pruned 74 packages.
- ~~`@astrojs/mdx`~~ — **✅ removed** (2026-07-25) after the content files were renamed
  `.mdx` → `.md`; no MDX features are used. Integration dropped from `astro.config.mjs`,
  package removed, lockfile synced (−46 packages). Decap CMS `extension` also switched to
  `md` so CMS-authored posts don't reintroduce `.mdx`.

---

## 2. Functional bugs (real, not just type noise)

### 2a. Tag pages render with no `<title>` — ✅ FIXED (2026-07-25)
`src/pages/tags/[tag].astro` passed `<Layout pageTitle={tag}>`, but `Layout.astro` reads
`const { title } = Astro.props;` — so **every `/tags/<tag>/` page got an `undefined`
title**, undermining the search-driven strategy (`CLAUDE.md §5`). **Fix:** renamed the prop
to `title={tag}`. All pages now pass `title`.

### 2b. Typo: `justify-betwen` — ✅ FIXED (2026-07-25)
`src/layouts/MarkdownPostLayout.astro` had `justify-betwen` (missing a `t`), which is not a
Tailwind class and silently did nothing on article pages. **Fix:** corrected to
`justify-between`.

### 2c. `SearchBar.astro` broken and unused — ✅ FIXED (2026-07-25)
`SearchBar.astro` passed an `onSearch` **function as a prop** into an inline `onInput`
handler — which can't work in Astro's static output — and was **imported nowhere**. Dead +
non-functional (`CLAUDE.md §9` lists search as out of scope). **Fix:** deleted the file.

### 2d. `src/utils/paginate.js` unused — ✅ FIXED (2026-07-25)
`paginate()` was defined but imported nowhere. **Fix:** deleted the file. (If archive length
ever matters, reintroduce pagination deliberately.)

---

## 3. Deviations from `CLAUDE.md` (code vs. target state)

`CLAUDE.md` explicitly says the doc is the target and the code is expected to be stale;
these are flagged, not "fixed silently."

### 3a. Fonts loaded from Google's CDN — ✅ FIXED (2026-07-25)
`src/components/Head.astro` used to `<link>` a render-blocking Google Fonts stylesheet
(plus `preconnect` to `fonts.googleapis.com` / `fonts.gstatic.com`) — a third-party,
render-blocking request on a site whose whole pitch is instant loads, contradicting
`CLAUDE.md §2.3`. The stylesheet also pulled **Lexend Mega** and **Montserrat**, which
aren't in the Tailwind font stack at all.

**Fix:** self-hosted via `@fontsource`, the CDN `<link>` block deleted entirely.
- `@fontsource/bebas-neue/latin-400.css` (display, single weight)
- `@fontsource-variable/piazzolla/wght.css` + `wght-italic.css` (serif subheadings)
- `@fontsource-variable/ysabeau/wght.css` + `wght-italic.css` (body)

`tailwind.config.mjs` `fontFamily` was updated to the variable family names
(`Piazzolla Variable`, `Ysabeau Variable`) with generic fallbacks, since `@fontsource`
registers variable faces under a `"… Variable"` name. Verified in the build: 31 self-hosted
`woff2` files emitted to `dist/_astro/` (unicode-range split, so English readers fetch only
the Latin subset), zero `googleapis`/`gstatic`/`Lexend`/`Montserrat` references, and the
`.font-*` utilities match the bundled `@font-face` families. Unused fonts removed as part
of the swap.

### 3b. Netlify Identity widget loaded on *every* page — ✅ FIXED (2026-07-25)
`src/layouts/Layout.astro` used to inject
`https://identity.netlify.com/v1/netlify-identity-widget.js` into every page that uses
`Layout` (home, archive, featured, about, tags), not just the admin route — contradicting
`CLAUDE.md §3`'s *"zero third-party requests"* target.

**Fix:** the widget's only unique job in `Layout` was accepting a CMS invite link
(`/#invite_token=...`); normal admin login is already handled by `admin.astro`'s own copy.
The script now bails out early unless `invite_token` is present in the URL hash, so the
third-party widget is fetched **only** during the invite flow. Verified in the build: the
guard (`…includes("invite_token"))return`) is present on every `Layout` page, and post
pages (a different layout) never included it. Normal visitors now make zero requests to
`identity.netlify.com`.

### 3c. JSON-LD was inert (not just placeholder) — ✅ FIXED (2026-07-25)
Worse than first thought. The structured-data block used `<script type="application/ld+json">`
with an inline `{{ ... }}` expression — but **Astro does not evaluate `{}` expressions inside
`<script>`/`<style>` raw-text elements**, so the block shipped as *literal source text* on
every page: doubled `{{ }}` braces, bare identifiers (`title`, `author`, `pubDate`), a JS
`// comment` inside the "JSON", and the placeholders `"Your Blog Name"` / `/logo.jpg` (a
non-existent file). Any parser hits a syntax error and discards it — the structured data
**never functioned**.

**Fix:** the object is now built in the component frontmatter (where expressions actually
evaluate) and injected with `set:html={JSON.stringify(structuredData)}` — the canonical
Astro JSON-LD pattern. Result, verified by parsing the built output:
- Real values; **absolute** image URL; `datePublished` as ISO-8601.
- Publisher `"Just Good Games"` with a real, absolute logo (`/images/favicon.png`).
- `undefined` fields dropped, so non-article pages (title only) still emit valid JSON.
- Both an article page and the homepage now `ConvertFrom-Json` cleanly.

*Remaining (not in this change):* the homepage still emits `@type: BlogPosting` with only a
headline — semantically it should be `WebSite`/`WebPage`, and article pages would ideally use
`Review`/`VideoGame` per `CLAUDE.md §5`. Tracked, not yet done.

### 3d. Open Graph image used a relative URL — ✅ FIXED (2026-07-25)
`Head.astro` set `og:image`/`twitter:image` to the site-relative `image.url` (e.g.
`/images/posts/...`). Most scrapers (Discord, Bluesky, Slack, Facebook) require an
**absolute** URL and drop a relative one — undermining the link-preview channel
(`CLAUDE.md §1`). **Fix:** both now emit `siteUrl + image.url`. (The JSON-LD `image` is also
absolute now — see §3c.)

### 3e. `article:published_time` was a raw Date object — ✅ FIXED (2026-07-25)
`Head.astro` output `content={pubDate}` where `pubDate` is a JS `Date`, rendering as a
`toString()` value rather than the ISO-8601 OG expects — and it fired even on non-article
pages (empty `pubDate`). **Fix:** the tag now renders only when a date exists and emits
`pubDate.toISOString()`. Verified: article pages show `content="2024-11-07T08:13:00.000Z"`;
the homepage omits the tag.

### 3f. Invalid `typescript` option in `astro.config.mjs` — ✅ FIXED (2026-07-25)
`astro.config.mjs` set `typescript: { strict: true }`, which is **not a valid Astro config
key** and was silently ignored (TS strictness already lives correctly in `tsconfig.json`).
**Fix:** deleted the no-op block. Build unaffected.

### 3g. `require()` in an ESM config file — ✅ RESOLVED (2026-07-25)
`tailwind.config.mjs` used `require("@tailwindcss/typography")` in an ESM file. **Resolved
by the Tailwind 4 migration:** `tailwind.config.mjs` is deleted entirely — config is now
CSS-first in `src/styles/global.css` (`@theme` + `@plugin "@tailwindcss/typography"`), so
there is no `require()` left. See MIGRATION.md (Tailwind 4 step).

### 3h. Content schema differs from the §4 target
`src/content/config.ts` uses `{ pubDate, author, gameTitle, image:{url,alt} }`. The
`CLAUDE.md §4` target schema is richer (`updatedDate`, `draft`, `heroImage`/`heroAlt`,
`games[]`, `steamAppId`, description length rule). This is an expected gap — flagging so
it's tracked, not so it's rewritten unilaterally.

### 3i. No `netlify.toml` — ✅ CREATED (2026-07-25)
There was no `netlify.toml`, so the `CLAUDE.md §4` URL-redirect policy had nowhere to live.
**Fix:** created a minimal `netlify.toml` with the first two 301 redirects (the consolidated
tag pages — see §5). Future slug/redirect needs now have a home. *Post-deploy check:* verify
Netlify honours the two tag redirects (path matching is case-sensitive, so `/tags/RPG` won't
collide with `/tags/rpg`). The sitemap *is* configured and reaches `dist/`.

### 3k. Netlify build failed on Node 18 (local passed) — ✅ FIXED (2026-07-25)
Netlify builds failed (`npm run build` exit 1) while local builds were green. Root cause:
Netlify defaulted to **Node.js v18.20.8** (EOL Apr 2025); local runs Node 24. This session's
dependency refresh pulled in build tooling that needs Node 20+, so it built locally and died
on Netlify — the classic local-passes/CI-fails split. **Fix:** pinned `NODE_VERSION = "22"`
in `netlify.toml` `[build.environment]` (current LTS; also satisfies the coming Astro 7 /
Vite 8 requirement). A second latent failure was caught at the same time: `@astrojs/mdx` was
removed from `package.json` (post-`.md` switch) but `astro.config.mjs` still imported and
called `mdx()` — fine locally (stale `node_modules`) but a fresh Netlify install would fail
with "Cannot find package @astrojs/mdx". **Fix:** removed the `mdx()` integration + import
and re-synced the lockfile.

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

- **Case-duplicated tags created near-duplicate pages — ✅ FIXED (2026-07-25).** The build
  used to emit both `/tags/rpg/` + `/tags/RPG/` and `/tags/itch/` + `/tags/itch.io/`,
  fragmenting the tag archives (bad for SEO). **Fix, three parts:** (1) schema-level
  normalization in `config.ts` — each tag is `trim()` + `toLowerCase()`, so casing can't
  spawn duplicates via the CMS; (2) content cleaned in roundup-3 (`RPG`→`rpg`,
  `itch.io`→`itch`, canonicalising the synonym to match the short `steam`-style tag); (3)
  `netlify.toml` 301s for the two removed routes (§3i). Verified: build 44→42 pages, only
  lowercase `rpg`/`itch` routes generate, and `/tags/rpg/` now includes roundup-3.
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
| ~~1~~ | ~~Tag pages have no `<title>` (§2a)~~ ✅ Fixed | High (SEO) | Trivial |
| ~~2~~ | ~~OG image is a relative URL (§3d)~~ ✅ Fixed | High (sharing) | Trivial |
| ~~3~~ | ~~JSON-LD inert / placeholder publisher (§3c)~~ ✅ Fixed | High (SEO) | Small |
| ~~4~~ | ~~Google Fonts CDN instead of self-hosted (§3a)~~ ✅ Fixed | Medium | Medium |
| ~~5~~ | ~~Netlify Identity widget on every page (§3b)~~ ✅ Fixed | Medium (perf/privacy) | Trivial |
| ~~6~~ | ~~npm vulnerabilities / stale deps (§1)~~ ✅ **55→0** (Astro 7 cleared the rest) | Medium | Done |
| ~~7~~ | ~~`justify-betwen` typo (§2b)~~ ✅ Fixed | Low | Trivial |
| ~~8~~ | ~~Case-duplicate tag pages (§5)~~ ✅ Fixed | Low–Med (SEO) | Small |
| ~~9~~ | ~~Dead code: `SearchBar`, `paginate` (§2c/§2d)~~ ✅ Fixed | Low | Trivial |
| ~~10~~ | ~~Invalid `typescript` config key (§3f)~~ ✅ Fixed | Low | Trivial |

All numbered TL;DR items are now resolved except the 5 Astro-major-gated vulnerabilities in
#6 (deferred to the Astro 7 migration). Remaining smaller/known items: §3g (Tailwind v4
`require()`), §3h (schema vs §4 target), §3j (Buttondown/Feedly third-party embeds), §4
type-check errors, §3c JSON-LD page-type refinement, and §6 housekeeping (stock README,
favicon MIME type, caniuse-lite). `astro check` now needs `@astrojs/check` installed on
first run (its transitive copy was pruned with `astro-seo`).
