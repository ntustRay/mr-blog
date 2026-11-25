import { getCollection } from 'astro:content';
import { getContentType, getDisplayTitle } from './contentType';

export async function getHomeFeed() {
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
      summary: data.description.split(/(?<=[。！？])/u, 1)[0],
    }));
}

export type HomePost = Awaited<ReturnType<typeof getHomeFeed>>[number];
