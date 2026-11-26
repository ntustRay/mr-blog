import { getCollection } from 'astro:content';
import { getContentType, getDisplayTitle } from './contentType';
import { getPageViewCount, getViewSnapshot } from './viewCounts.mjs';

export async function getHomeFeed() {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const snapshot = getViewSnapshot(base);
  const posts = await getCollection('blog', ({ id, data }) =>
    !data.draft && id !== 'agent-native-shared-actions-ui-state',
  );

  return posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id))
    .map(({ id, data }) => ({
      id,
      type: getContentType(data.title),
      title: getDisplayTitle(data.title),
      category: data.category,
      date: data.pubDate.toISOString().slice(0, 10),
      summary: data.description,
      viewCount: getPageViewCount(snapshot, `${base}posts/${id}/`),
    }));
}

export type HomePost = Awaited<ReturnType<typeof getHomeFeed>>[number];
