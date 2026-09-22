import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site';

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error('RSS generation requires the Astro site URL.');
  }

  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    customData: `<language>${siteConfig.locale}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${base}posts/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
  });
};
