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
| Content files | 7 `.mdx`, **all pure CommonMark/GFM** — zero MDX features (verified) |
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

### 4.1 Content collections → Content Layer (the bulk of the work)

- [ ] **Move + rewrite config:** `src/content/config.ts` → `src/content.config.ts`.
  Replace `type: 'content'` with a `glob()` loader. The Zod schema (including the tag
  `trim()+toLowerCase()` normalization we just added) carries over unchanged:

  ```ts
  // src/content.config.ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const posts = defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
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

- [ ] **`entry.render()` → `render(entry)`** in `src/pages/posts/[...slug].astro`:

  ```astro
  ---
  import { getCollection, render } from 'astro:content';
  // ...
  const { entry } = Astro.props;
  const { Content } = await render(entry);   // was: await entry.render()
  ---
  ```

- [ ] `getCollection("posts")` stays as-is (still valid). Entries become plain serializable
  objects — fine for our usage.

### 4.2 Markdown pipeline → Sätteri + reading-time reimplementation

Sätteri won't run `remark-reading-time.mjs`. Reimplement reading time in the page and delete
the plugin (**recommended — keeps the speed win**). See §6 for the trade-off if you'd rather
keep the unified pipeline.

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

### 4.3 `.mdx` vs `.md` (optional simplification)

Since **no file uses MDX features**, you *can* rename `.mdx` → `.md` and drop the
`@astrojs/mdx` integration entirely.
- [ ] **Decision:** keep `.mdx` (no content churn, but must keep `@astrojs/mdx` on a v7-
  compatible version) **or** rename to `.md` + remove `@astrojs/mdx`. If renaming, update the
  `glob()` pattern and the Decap CMS `extension`/`format` in `public/admin/config.yml`.
  ⚠️ Renaming a file changes its `id` → its URL. If you rename, add redirects (§7).

### 4.4 Integration compatibility (verify each against Astro 7)

- [ ] **`@astrojs/tailwind` (v5) — biggest decision.** The Tailwind integration is
  deprecated in favour of `@tailwindcss/vite` + **Tailwind v4** (CSS-first `@theme` config).
  Under Astro 7 you will likely have to migrate Tailwind 3 → 4, which means rewriting
  `tailwind.config.mjs` (colour tokens, `font*`, `maxWidth` utilities) as `@theme` CSS and
  removing the `require()` (`ISSUES.md §3g`). **This may be the single largest chunk of the
  whole migration** and is a deliberate design decision (`CLAUDE.md §7`). Treat as its own
  sub-task. Verify whether any `@astrojs/tailwind` v6 path keeps Tailwind 3 working before
  committing to the v4 rewrite.
- [ ] **`@astrojs/mdx`** — bump to the Astro-7-compatible major (v6+), or drop (§4.3).
- [ ] **`astro-icon`** — confirm Astro 7 support; it pulls `@iconify/tools` (source of the
  `tar`/`svgo` advisories cleared earlier — re-check after upgrade).
- [ ] **`astro-navbar`** — confirm Astro 7 support.
- [ ] **`@astrojs/sitemap`** — currently pinned to exact `3.1.6` because 3.7.3 crashes under
  Astro 4.16 (`ISSUES.md §1`). Un-pin and test the latest against Astro 7; the crash may be
  gone. **Re-verify `sitemap-index.xml` builds.**
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

- [ ] **Before upgrading:** capture the current URL list —
  `Get-ChildItem dist -Recurse -Filter index.html` after a clean `npm run build`.
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
- [ ] Branch: `git checkout -b astro-7-migration`.
- [ ] Clean baseline: `npm run build` green; capture the URL list (§7).
- [ ] Add `@astrojs/check` as a devDependency (type-checking was pruned with `astro-seo`).
- [ ] Skim the official upgrade guides: [v5](https://docs.astro.build/en/guides/upgrade-to/v5/),
  [v6](https://docs.astro.build/en/guides/upgrade-to/v6/), v7.

**Phase 1 — Astro 5 (Content Layer)**
- [ ] `npx @astrojs/upgrade` to 5 (or pin `astro@5` + integrations).
- [ ] Move/rewrite config to `src/content.config.ts` with `glob()` (§4.1).
- [ ] `slug` → `id` everywhere; `entry.render()` → `render(entry)` (§4.1).
- [ ] Build + URL diff (§7) + dev smoke test.

**Phase 2 — Astro 6**
- [ ] Upgrade to 6. Confirm no legacy-collection warnings remain.
- [ ] Build + URL diff.

**Phase 3 — Astro 7 + Sätteri**
- [ ] Upgrade to 7. Sätteri becomes default.
- [ ] Reimplement reading time; delete the remark plugin + wiring (§4.2).
- [ ] Verify all 7 posts render correctly (images, links, headings, prose).
- [ ] Build + URL diff.

**Phase 4 — Integrations + Tailwind decision**
- [ ] Resolve every item in §4.4 (Tailwind is the big one).
- [ ] Un-pin `@astrojs/sitemap`; verify sitemap output.
- [ ] `npm audit` → expect the last 5 vulns cleared.

**Phase 5 — Final verification (§9) → merge.**

---

## 9. Acceptance checklist

- [ ] `npm run build` green; page count matches baseline (42) unless intentionally changed.
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
