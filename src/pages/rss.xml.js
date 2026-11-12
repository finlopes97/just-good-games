import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const SITE = 'https://justgood.games';

// `html: true` lets raw HTML written into a post body through to the feed (sanitize-html
// still strips anything unsafe). Without it markdown-it escapes the tags into visible text.
const parser = new MarkdownIt({ html: true });

/*
  Post images live in src/assets/posts/ and are referenced from the markdown by relative
  path (../../assets/posts/...). The page build optimises those, but the feed is rendered
  from the raw body, where a relative path means nothing to a feed reader. So every such
  path is swapped for the absolute URL of an optimised copy before rendering.
*/
const assets = import.meta.glob('/src/assets/posts/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});
const ASSET_PATH = /\.\.\/\.\.\/assets\/posts\/[^\s)"'>]+/g;
// Images still served from public/ (the legacy GIFs, anything referenced from raw HTML).
const PUBLIC_PATH = /(?<=\]\(|src=["'])\/images\/[^\s)"'>]+/g;

async function absoluteImages(body, postId) {
  const urls = new Map();
  for (const path of new Set(body.match(ASSET_PATH) ?? [])) {
    const asset = assets[path.replace('../../assets/posts/', '/src/assets/posts/')];
    if (!asset) throw new Error(`rss: ${postId} references a missing image: ${path}`);
    const image = await getImage({ src: asset, width: 1200 });
    urls.set(path, new URL(image.src, SITE).href);
  }
  return body
    .replace(ASSET_PATH, (path) => urls.get(path))
    .replace(PUBLIC_PATH, (path) => new URL(path, SITE).href);
}

export async function GET() {
  const allPosts = await getCollection("posts");
  return rss({
    stylesheet: '/rss/styles.xsl',
    title: 'Just Good Games',
    description: 'Find reviews and articles about new release games',
    site: `${SITE}/`,
    items: await Promise.all(allPosts.map(async (post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `${SITE}/posts/${post.id}`,
      guid: `${SITE}/posts/${post.id}`,
      content: sanitizeHtml(parser.render(await absoluteImages(post.body ?? '', post.id)), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
      }),
      custom_elements: [
        { 'content:encoded': '' },
        { 'language': 'en-us' },
        { 'author': post.data.author },
      ],
    }))),
  });
}
