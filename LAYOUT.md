# LAYOUT.md — Post structure

How a post is put together, and what the stack does and doesn't do for it. This is the
reference for writing posts and for any future layout work.

**Status (2026-11-13): decided and built — posts are freeform.** The owner chose a freeform
writing environment over structured per-game fields. A post is one markdown body written
top to bottom. The only "structure" is three conventions, all live: store-link chips and
fact cards (§3), and video clips (§5). Nothing on the page renders from frontmatter
`games[]` any more.

---

## 1. The structure (owner's schema, 2026-11-12)

```
[Post title]
[Details: author, date, tags, read time]
[Body: text and images]
{List of items — optional, only for list posts}
  <Item>
    [Item title (e.g. game name)]
    [Rank — optional, for ordered lists]
    [Header image (hero, thumbnail, etc.)]
    [Item details: release date, developer, publisher]
    [Body: short write-up, text and images]
    [Purchase details: stores, price history]
  </Item>
  <Item ...>
[Body: conclusion for a list post, or the rest of a non-list post]
[Recent posts carousel]
```

## 2. How each part is produced

| Part | How | State |
|---|---|---|
| Post title, details, read time | frontmatter + `MarkdownPostLayout.astro` | exists |
| Opening body | markdown | exists |
| Item title | a `##` heading, typed by hand | freeform |
| Rank | typed into the heading (`## 10. Crow Country`) | freeform |
| Header image | an ordinary markdown image under the heading | freeform |
| **Item details** | **a blockquote holding a bullet list, styled as a fact card (§3)** | **built 2026-11-13** |
| Item write-up | markdown | freeform |
| **Purchase details** | **a bullet list of store links, styled as chips (§3)** | **built 2026-11-12** |
| Closing body | markdown | exists |
| Recent posts | new component in `MarkdownPostLayout.astro` | **not built** (§6) |

Ordering (ascending, countdown, unnumbered) is just how the post is written. There is no
`listOrder` field and no per-item schema.

`games[]` frontmatter still exists and is **optional**, but since 2026-11-13 it is metadata
for search engines only: a post with exactly one entry gets `VideoGame` structured data.
Nothing on the page renders from it. The "The gist" panel and "Where to get it" block were
removed; credits and store links are written in the body.

---

## 3. Store-link chips (the one convention)

Write the links as a plain bullet list, wherever they belong in the post:

```markdown
- [Steam](https://store.steampowered.com/app/2366970/Arco/)
- [itch.io](https://example.itch.io/game)
- [Price history](https://isthereanydeal.com/game/arco/info/)
```

That list renders as a row of pressable chips (pink block, black border, hard shadow, store
icon). It is CSS only: the rule lives at the end of
`src/styles/global.css` and is scoped to the `jgg-prose` class on `Prose.astro`.

**A list becomes chips when both are true:**

1. Every bullet is a single link and nothing else.
2. At least one link goes to a known store: Steam, itch.io, GOG, Epic, PlayStation, Xbox,
   Nintendo, or IsThereAnyDeal.

Everything else stays an ordinary bullet list. A store link in the middle of a sentence
stays an ordinary link.

**Writing rules:**

- **The chip shows your link text**, in capitals (Bebas Neue). Keep labels short.
- **Order is yours.** Put the price-history (ITAD) link last by hand.
- **No blank lines between the bullets.** A blank line makes a "loose" list, which wraps
  each link in a paragraph and stops the chips applying.
- **Other links are allowed in the list** (an official site, say) as long as one bullet is
  a known store. They get a generic "opens elsewhere" icon.
- **ITAD URLs are pasted from the real page**, never guessed (`CLAUDE.md` §4).
- To add a store, add its domain in two places in the `global.css` rule: the `:is(...)`
  list, and an icon line if it has one. itch.io and Epic use the generic icon because MDI
  has no icon for them.

**Known limits:**

- CSS can't see plain text. A bullet with text *and* one link still counts as "a single
  link", so `- Buy it on [Steam](…)` in a qualifying list becomes a chip with the text
  beside it. A text-only bullet in the middle of a chip list isn't detected either.
- The rule uses the CSS `:has()` selector. Every current browser supports it; an old one
  shows a plain bullet list of links, which still works.
- `:has()` can't be nested inside `:has()`. The first version of the rule did that and the
  browser silently dropped the whole thing. Keep the conditions chained.
- The RSS feed shows these as a normal list of links. That's fine.
- No structured data comes from body links. Search engines only get game data from
  `games[]`.

### Fact cards (the second convention, built 2026-11-13)

Put a bullet list inside a blockquote:

```markdown
> - Developed by LOREM STUDIO
> - Published by LOREM PUBLISHER
> - Released on 01/01/2026
```

It renders as a small card (yellow block, black border, hard shadow) with one row per
bullet and no bullet points. The card is only as wide as its longest row.

- **A blockquote becomes a card when the list is the only thing in it.** A blockquote of
  ordinary text stays a quote. A blockquote with a list *and* a paragraph stays a quote.
- **Rows are free text.** Nothing is specific to games, so use it for any short fact sheet.
- **No heading.** If a card needs a title, put a normal heading or bold line above it.
- **Every line starts with `> - `**, with no blank lines between them.
- **Store links inside a card** (`> - [Steam](…)`) render as chips inside the card.
- Chosen over a nested bullet list (also spiked, also worked) because it is simpler to type
  and can't be triggered by accident.
- Uses `:has()` like the chips: an old browser shows a quote containing a bullet list.
- The RSS feed shows a quoted bullet list.

---

## 4. Why freeform (decision record)

The per-game fields were only ever wanted so each game could have a `StoreLinks`-style
block. Two structured designs were considered and dropped on 2026-11-12:

| Approach | Why it was dropped |
|---|---|
| `games[].writeup` markdown field in frontmatter | Only the markdown *body* goes through Astro's image pipeline, so images inside a write-up would ship unoptimised. RSS, reading time and the homepage excerpt read `entry.body` and would all need reworking. |
| Split the rendered body at `## <game name>` headings and wrap each chunk in an item component | Works (spiked), keeps images optimised, but reserves `##`, couples headings to frontmatter names, and fails the build on a typo. More machinery than the goal needed. |

The CSS convention gets the store chips with no schema change, no components and no
constraints on how a post is written.

**Spike findings worth keeping** (Astro 7.1.3, throwaway files, all deleted):

- Sätteri optimises relative images in a markdown body (WebP, `width`/`height`, lazy).
- A wrapper component can call `await Astro.slots.render("default")` on `<Content />` to get
  the final HTML with images already optimised, and Sätteri emits `<h2 id="slug">`. If a
  structured item layout is ever wanted, this is the way to do it.
- `image()` works inside a nested frontmatter array with the `glob()` loader.
- Sätteri emits a tight markdown list as `<ul><li><a>` with no `<p>`, which is what the
  chip rule matches.

---

## 5. Limits of the stack

1. **No components inside markdown.** Anything component-shaped in a post body has to be a
   CSS convention on plain markdown (like §3) or come from frontmatter.
2. **No client-side JavaScript.** "Carousel" means a horizontal CSS scroll-snap row or a
   plain grid. No arrows, dots or autoplay.
3. **Raw HTML in a post body** passes through Sätteri, but shows as escaped text in the RSS
   feed until `rss.xml.js` sets `html: true` (`ISSUES.md` §1b).
4. **Images** live in `src/assets/posts/` and are referenced by relative path in markdown
   syntax (`CLAUDE.md` §4, "Images"). A raw HTML `<img>` is not optimised and must point at
   a file in `public/images/posts/`.
5. **Animation** is a tap-to-play `<video>` clip written as one line of raw HTML, made with
   `npm run clip` (`CLAUDE.md` §4, "Clips"). No GIFs, no autoplay.

---

## 6. What's left

| # | Work | Notes |
|---|---|---|
| 1 | ~~Owner checks the live site on a phone~~ | Done 2026-11-13: images, chips and clips reported working. |
| 2 | Convert store links in the other posts to bullet lists | About 11 lines across the Clickolding, Cruel and Achra posts. Changes the owner's wording slightly ("or"/"and" between links goes), so do it with sign-off. |
| 3 | ~~`astro:assets` migration~~ | Done 2026-11-12 (`ISSUES.md` §1b). `/admin` uploads verified 2026-11-13. |
| 4 | Recent posts strip | Scroll-snap row or grid of three: owner to choose. Sits outside the `<article>`, excludes the current post. |
| 5 | ~~Replace the three GIFs~~ | Done 2026-11-13: converted to tap-to-play video clips (`ISSUES.md` §1a, `CLAUDE.md` §4 "Clips"). |
| 6 | ~~Fact cards~~ | Done 2026-11-13 (§3). No live post uses one yet. |
| 7 | Hinterberg post | Lost its facts panel and store block when `games[]` went metadata-only. Owner to add a fact card and chip list if wanted. |
| 8 | Owner deletes `test-post-delete-later` | And `src/assets/posts/4560.jpg`. |
| 9 | Optional: `ItemList` structured data | Would need `games[]` filled in on list posts. Only worth it if the facts are being entered anyway. |
