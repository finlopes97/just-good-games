# MIGRATION.md — Astro 4 → 7

Planning checklist for upgrading Just Good Games from **Astro 4.16.19 → Astro 7.x**.
Drafted 2026-07-25. This is a plan, not a record of work done — check items off as you go.

> **Golden rule for this repo (CLAUDE.md §1): never break a published URL.** Every
> `/posts/<slug>/` and `/tags/<tag>/` that exists today must still resolve after the
> migration (200 or 301). This is the #1 acceptance criterion — see §7.

---

## 1. Why do this

- **Build speed** on a Markdown-heavy site — Astro 7's Rust compiler + the **Sätteri** Rust
  Markdown/MDX processor + Vite 8/Rolldown deliver 15–61% faster builds in Astro's
  benchmarks. This site is nothing but Markdown, so it's near the best case.
- **Background dev server** — improves the agent/AI-assisted workflow.
- **Security** — clears the last 5 vulnerabilities (all Astro-toolchain, gated behind
  `astro@7`; see `ISSUES.md §1`) and lets `@astrojs/sitemap` move off its pin.

## 2. Current state

| | Value |
|---|---|
| Astro | 4.16.19 |
| Node | 24.18.0 (well above any Astro 7 minimum) |
| Content API | **Legacy** collections (`type: 'content'`, `entry.slug`, `entry.render()`) |
| Markdown | unified/remark pipeline + 1 custom plugin (`remark-reading-time.mjs`) |
| Content files | 7 `.md` (renamed from `.mdx` 2026-07-25), **pure CommonMark/GFM** — no MDX requirement |
| Styling | `@astrojs/tailwind` v5 + Tailwind v3 (`tailwind.config.mjs` with `require()`) |

---

## 3. The three majors at a glance

This is a **3-major jump (4→5→6→7)**. The breaking changes that actually touch this repo:

| Version | Breaking change relevant here |
|---|---|
| **5.0** | Content Layer API introduced. `entry.slug` → `entry.id`; `entry.render()` → `render(entry)` imported from `astro:content`; `getEntryBySlug`/`getDataEntryById` → `getEntry`. |
| **6.0** | Legacy collections **removed entirely** (no compat flag). Config must move `src/content/config.ts` → **`src/content.config.ts`** and use a `glob()` loader instead of `type: 'content'`. |
| **6.4** | **Sätteri** (Rust Markdown/MDX) available as opt-in. |
| **7.0** | Sätteri becomes **default**; it does **not** run remark/rehype plugins. `@astrojs/markdown-remark` is no longer bundled — keeping remark plugins is an explicit opt-out. Vite 8 + Rolldown. |

**Recommended approach for a repo this small:** upgrade **one major at a time**
(`4→5`, verify; `5→6`, verify; `6→7`, verify) using each version's official upgrade guide,
rather than jumping straight to 7. Each guide ships codemods and the gates catch regressions
early. `npx @astrojs/upgrade` bumps Astro + official integrations together.

---

## 4. Migration surface in THIS repo (from the audit)

### 4.1 Content collections → Content Layer (the bulk of the work) — ✅ DONE (Phase 1)

- [x] **Move + rewrite config:** `src/content/config.ts` → `src/content.config.ts`.
  Replace `type: 'content'` with a `glob()` loader. The Zod schema (including the tag
  `trim()+toLowerCase()` normalization we just added) carries over unchanged:

  ```ts
  // src/content.config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const posts = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      author: z.string(),
      tags: z.array(z.string().transform((tag) => tag.trim().toLowerCase())),
      featured: z.boolean().default(false),
      gameTitle: z.string().optional(),
      image: z.object({ url: z.string(), alt: z.string() }).optional(),
    }),
  });

  export const collections = { posts };
  ```

- [ ] **`entry.slug` → `entry.id`** — 10 references across 6 files:
  - `src/pages/index.astro` (×2)
  - `src/pages/archive.astro` (×2, incl. a `key={post.slug}`)
  - `src/pages/featured.astro` (×2, incl. a `key={post.slug}`)
  - `src/pages/tags/[tag].astro` (×1)
  - `src/pages/posts/[...slug].astro` (getStaticPaths param)
  - `src/pages/rss.xml.js` (×2 — `link` and `guid`)

- [x] **`entry.render()` → `render(entry)`** in `src/pages/posts/[...slug].astro`:

  ```astro
  ---
  import { getCollection, render } from 'astro:content';
  // ...
  const { entry } = Astro.props;
  const { Content } = await render(entry);   // was: await entry.render()
  ---
  ```

- [x] `getCollection("posts")` stays as-is (still valid). Entries became plain serializable
  objects — fine for our usage.

### 4.2 Markdown pipeline → Sätteri + reading-time reimplementation — ✅ DONE (Phase 3)

Sätteri (Astro 7 default) doesn't run `remark-reading-time.mjs`. Reading time was
reimplemented page-side (`getReadingTime(entry.body ?? "")`) and the plugin + wiring deleted,
keeping the Sätteri build-speed win. See §6 for the unified-pipeline trade-off we chose not
to take.

- [ ] Delete `remark-reading-time.mjs` and its `markdown.remarkPlugins` wiring in
  `astro.config.mjs`.
- [ ] Compute reading time from `entry.body` in `src/pages/posts/[...slug].astro`:

  ```astro
  ---
  import { getCollection, render } from 'astro:content';
  import getReadingTime from 'reading-time';
  // ...
  const { entry } = Astro.props;
  const { Content } = await render(entry);
  const minutesRead = getReadingTime(entry.body).text;   // "3 min read"
  ---
  <!-- was: remarkPluginFrontmatter.minutesRead -->
  ```

- [ ] Sätteri covers CommonMark + GFM + YAML frontmatter natively → **no content edits
  needed**. Confirm the 7 posts render identically (they use no remark/rehype-specific
  syntax).

### 4.3 `.md` conversion — ✅ DONE (2026-07-25)

Files were renamed `.mdx` → `.md` (committed/pushed). The extension is **not** part of the
`id`/URL (both legacy slug and the `glob()` loader strip it), so no URLs changed. Follow-ups,
**both now done (2026-07-25):**
- [x] **Removed the `@astrojs/mdx` integration** — dropped `mdx()` + import from
  `astro.config.mjs`, removed `@astrojs/mdx` from `package.json`, re-synced the lockfile
  (−46 packages). (This was also a latent Netlify build failure — the config still called
  `mdx()` after the package was gone; see `ISSUES.md §3k`.)
- [x] **Updated Decap CMS** — `public/admin/config.yml` `extension` switched to `md`, so
  CMS-authored posts no longer reintroduce `.mdx`.

### 4.4 Integration compatibility (verify each against Astro 7)

- [x] **`@astrojs/tailwind` → `@tailwindcss/vite` + Tailwind v4 — ✅ DONE (Phase 2.5).**
  (`@astrojs/tailwind` had no Astro 6+ support at any version.) Migrated to
  `@tailwindcss/vite` + `tailwindcss@4.3.3`; `tailwind.config.mjs` deleted, config ported 1:1
  to `src/styles/global.css` (`@theme` + `@plugin "@tailwindcss/typography@0.5.20"`), imported
  in `Head.astro`. `.npmrc` bridge deleted (clean install no longer ERESOLVEs). Verified: all
  used utilities present with identical values, URL parity, prose intact, fonts intact.
- [x] **`@astrojs/mdx`** — **removed** (no `.mdx` files remain, §4.3). ✅ Done 2026-07-25.
- [ ] **`astro-icon`** — confirm Astro 7 support; it pulls `@iconify/tools` (source of the
  `tar`/`svgo` advisories cleared earlier — re-check after upgrade).
- [ ] **`astro-navbar`** — confirm Astro 7 support.
- [x] **`@astrojs/sitemap`** — ✅ un-pinned to `3.7.3` in Phase 2 (the 3.1.6 pin crashed on
  Astro 6). `sitemap-index.xml` verified building. Re-confirm on Astro 7.
- [ ] **`@astrojs/rss`** — confirm the `rss.xml.js` API (uses `post.body`, `post.slug`→`id`)
  still works; update the `link`/`guid` to `id`.
- [ ] **`@astrojs/markdown-remark`** — only needed if you keep the unified pipeline (§6).

---

## 5. Decision points (need sign-off before starting)

1. **Tailwind 3 → 4?** Forced (or nearly) by dropping `@astrojs/tailwind`. Big, deliberate
   (§4.4). — *Owner decision.*
2. **Reading time:** reimplement (recommended) vs. keep unified pipeline (§6). — *Recommended:
   reimplement.*
3. **`.mdx` → `.md`?** Optional cleanup; adds redirect obligations (§4.3). — *Recommended:
   keep `.mdx` to avoid URL churn, unless dropping `@astrojs/mdx` is worth it.*
4. **Incremental (4→5→6→7) vs. direct jump?** — *Recommended: incremental.*

---

## 6. Trade-off: keep the unified pipeline instead of Sätteri

If reimplementing reading time is undesirable, you can keep remark plugins by opting out of
Sätteri:

```js
// astro.config.mjs
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  markdown: { processor: unified({ remarkPlugins: [remarkReadingTime] }) },
});
```

**But this forfeits the Sätteri build-speed benefit — the main reason for the upgrade on a
Markdown-heavy site. Not recommended.** Reimplementing reading time (§4.2) is ~3 lines.

---

## 7. URL-stability verification (do NOT skip)

With the `glob()` loader, `entry.id` is derived from the filename. It **must** produce the
same URL as today's `entry.slug`, or published `/posts/<slug>/` URLs break.

- [x] **Before upgrading:** captured the current URL list — 43 routes in
  `scratchpad/baseline-urls.txt` (clean `npm run build` on `main`/branch start).
- [ ] **After upgrading:** rebuild and diff the URL list against the baseline. Expect an
  identical set (minus nothing; plus nothing).
- [ ] Current post slugs to preserve exactly:
  `01-25_monthly-update`, `an-update`, `biweekly-bipartisan-bisexual-roundup-1/2/3`,
  `dunegons-of-hinterberg-review`, `the-top-ten-games-of-2024`. Note the **underscore** in
  the first — confirm the loader preserves it.
- [ ] If any `id` differs from the old `slug`, you control the mapping in
  `posts/[...slug].astro` `getStaticPaths` (`params: { slug: <transform>(entry.id) }`) — use
  it to preserve URLs, or add 301s in `netlify.toml` as a last resort.
- [ ] Confirm the tag routes and the two existing redirects (`netlify.toml`) still hold.

---

## 8. Step-by-step plan

**Phase 0 — Prep**
- [x] **Netlify build green + Node pinned to `22`** (`netlify.toml`, 2026-07-25) — CI now runs
  a modern Node that satisfies Astro 7 / Vite 8 (was failing on Node 18; `ISSUES.md §3k`).
- [x] Branch: `astro-7-migration` created off `main` (2026-07-25).
- [x] Clean baseline: `npm run build` green — **40 pages / 43 routes** (6 posts, 29 tags,
  `/`, `/about/`, `/admin/`, `/archive/`, `/featured/`, `/rss.xml`, sitemaps). URL list saved
  to `scratchpad/baseline-urls.txt` (§7).
- [x] `@astrojs/check` added as a devDependency. **Type-check baseline: 47 errors, 2 hints**
  (pre-existing; target after migration = no *new* errors).
- [ ] Skim the official upgrade guides: [v5](https://docs.astro.build/en/guides/upgrade-to/v5/),
  [v6](https://docs.astro.build/en/guides/upgrade-to/v6/), v7.

**Phase 1 — Astro 5 (Content Layer) — ✅ DONE (2026-07-25)**
- [x] Upgraded to `astro@5.18.2` (integrations resolved with no peer conflicts). Removed the
  vestigial `@astrojs/markdown-remark` direct dep.
- [x] Config moved to `src/content.config.ts` with a `glob()` loader; old
  `src/content/config.ts` deleted.
- [x] `slug` → `id` (10 refs across 6 files); `entry.render()` → `render(entry)`.
- [x] Build green (40 pages / 43 routes). **URL diff vs baseline: IDENTICAL** — the loader
  `id` reproduces every slug incl. the underscore in `01-25_monthly-update`.
- [x] Verified: reading-time chip still renders ("min read"), RSS links correct, `astro
  check` unchanged at 47 errors / 2 hints (no new type errors).
- Note: reading time still comes from the remark plugin (fine on Astro 5) — it moves to a
  page-side calc in Phase 3 when Sätteri takes over.

**Phase 2 — Astro 6 — ✅ DONE (2026-07-25)**
- [x] Upgraded to `astro@6.4.8`. No legacy-collection errors (already on Content Layer).
- [x] **`@astrojs/sitemap` un-pinned 3.1.6 → 3.7.3** — the old pin crashed on Astro 6
  (`reduce` of undefined in `astro:build:done`); 3.7.3 is built for current Astro. Sitemap
  builds again.
- [x] **Added `.npmrc` `legacy-peer-deps=true` bridge** — `@astrojs/tailwind` peer-caps at
  `astro ^5`, so its unmet peer made every `npm install`/`ci` (incl. Netlify) ERESOLVE.
  Bridge lets installs proceed; Tailwind CSS still emits correctly. **Temporary — remove
  when Tailwind 4 lands (see §4.4 / decision below).**
- [x] Build green (40 pages). URL diff vs baseline: IDENTICAL. Reading-time intact.
  `astro check`: 47 errors (unchanged), hints 2→15 (non-blocking Astro 6 suggestions).
- ✅ The Tailwind decision it raised was resolved in Phase 2.5 (below); the `.npmrc` bridge
  has since been removed.

**Phase 2.5 — Tailwind 3 → 4 (CSS-first) — ✅ DONE (2026-07-25)**
- [x] `@astrojs/tailwind` → `@tailwindcss/vite` + `tailwindcss@4.3.3`;
  `@tailwindcss/typography@0.5.20` via `@plugin`.
- [x] `tailwind.config.mjs` deleted; theme ported **1:1** to `src/styles/global.css`
  (`@theme`), imported in `Head.astro`. `astro.config.mjs` now uses `vite.plugins`.
- [x] `.npmrc` bridge deleted — clean install no longer ERESOLVEs (peer conflict gone with
  `@astrojs/tailwind`).
- [x] Verified 1:1: every used utility present with identical values (only TW3 false-positives
  `.grid`/`.filter` dropped — they came from alt-text/JS, never real classes), URL parity
  identical, prose + self-hosted fonts intact, `astro check` unchanged (47 / 15).

**Phase 3 — Astro 7 + Sätteri — ✅ DONE (2026-07-26)**
- [x] Upgraded to `astro@7.1.3`; Sätteri is the default markdown engine. Integrations
  resolved with no peer conflicts.
- [x] Reading time reimplemented page-side in `posts/[...slug].astro`
  (`getReadingTime(entry.body ?? "")`); deleted `remark-reading-time.mjs` + the
  `markdown.remarkPlugins` wiring; removed now-unused `mdast-util-to-string` and the npm
  `remark-reading-time` package. (`entry.body` is `string | undefined` in Astro 7 — the
  `?? ""` clears the one type error that introduced.)
- [x] Posts render correctly under Sätteri — images/links/headings/prose intact. **No
  typography regression:** verified against the live (old) site — both use straight
  apostrophes and preserve the source's literal em-dashes identically, so smartypants was
  deliberately NOT enabled (enabling it would *diverge* by curling quotes).
- [x] `@tailwindcss/vite`, sitemap, astro-icon, astro-navbar all build fine under Vite 8.
- [x] Build green (40 pages), URL diff IDENTICAL, reading-time chip renders. Reading time
  18→19 min (raw-body counts image URLs; negligible for an estimate).

**Phase 4 — Remaining integrations + audit — ✅ DONE (2026-07-26)**
- [x] Tailwind resolved (Phase 2.5); `@astrojs/sitemap` un-pinned (Phase 2).
- [x] `astro-icon` / `astro-navbar` confirmed working on Astro 7.
- [x] **`npm audit` → 0 vulnerabilities** (55 at session start → 0). Astro 7 cleared
  astro/esbuild/vite; `@astrojs/mdx` removal cleared that one; `npm audit fix` cleared the
  last in-range `sharp` advisory.

**Phase 5 — Final verification — ✅ PASSED (2026-07-26) → ready to merge.**
- [x] Full §9 acceptance checklist passes (build, URL parity 43, reading-time, JSON-LD
  valid, OG/canonical, RSS, sitemap, self-hosted fonts, Netlify Identity guard, brand CSS,
  `astro check` 47 unchanged, audit 0). Merge `astro-7-migration` → `main` when ready.

---

## 9. Acceptance checklist

- [ ] `npm run build` green; route count matches baseline (**43**) unless intentionally changed.
- [ ] **URL parity** — post + tag URL set identical to pre-migration (§7).
- [ ] Reading-time chip still shows on articles.
- [ ] JSON-LD still valid on an article + homepage (re-run the `ConvertFrom-Json` check).
- [ ] OG/Twitter tags + self-hosted fonts intact (no `googleapis`/`gstatic`).
- [ ] `sitemap-index.xml` present in `dist`.
- [ ] `/rss.xml` builds with correct post links.
- [ ] Netlify Identity still only loads on `#invite_token` (guard intact).
- [ ] Neo-brutalist styling unchanged (esp. if Tailwind v4 migration happened) — visual pass
  at 320px and desktop.
- [ ] `npm audit` — 0 critical/high from Astro toolchain.
- [ ] Deploy preview: the two `netlify.toml` tag redirects resolve.

---

## 10. Rollback

Each phase is its own commit on the `astro-7-migration` branch. If a phase can't be
stabilised, `git reset --hard` to the prior phase's commit. The `main` branch stays on the
working Astro 4 build throughout — do not merge until §9 passes end-to-end.

## 11. Open questions to resolve during the work

- Does `@astrojs/tailwind` v6 support Tailwind 3, or is Tailwind 4 (CSS-first) mandatory
  under Astro 7? (Determines the size of Phase 4.)
- Does the `glob()` loader preserve the underscore in `01-25_monthly-update`?
- Is `astro-navbar` maintained for Astro 7, or does the mobile nav need replacing?
