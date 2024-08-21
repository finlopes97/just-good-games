import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const allPosts = await getCollection("posts");
  return rss({
    stylesheet: '/rss/styles.xsl',
    title: 'Just Good Games',
    description: 'Find reviews and articles about new release games',
    site: context.site,
    items: allPosts.map((post) => ({
      title: post.data.ttitle,
      pubDate: post.data.pubDate,
      description: post.data.description,
      url: `posts/${post.slug}`,
    customData: `<language>en-us</language>`,
    })),
  });
}

// url={`/posts/${post.slug}/`}
// title={post.data.title}
// pubDate={formatDate(post.data.pubDate)}
// description={post.data.description}
// image={post.data.image}
// tags={post.data.tags}