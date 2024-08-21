import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const allPosts = await getCollection("posts");
  return rss({
    stylesheet: '/rss/styles.xsl',
    title: 'Just Good Games',
    description: 'Find reviews and articles about new release games',
    site: 'https://justgood.games/',
    items: allPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `https://justgood.games/posts/${post.slug}`,
      content: sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
      }),
      author: post.data.author,
      guid: `https://justgood.games/posts/${post.slug}`,
      custom_elements: [
        { 'content:encoded': '' },
        { 'language': 'en-us' },
      ],
    })),
  });
}