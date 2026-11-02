import type { CollectionEntry } from 'astro:content';
import { getSeriesDefinition } from '../config/series';

export function getSeriesPosts(
  seriesId: string,
  posts: CollectionEntry<'blog'>[],
): CollectionEntry<'blog'>[] {
  return posts
    .filter((post) => post.data.series === seriesId)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

export function getSeriesNavigation(
  post: CollectionEntry<'blog'>,
  posts: CollectionEntry<'blog'>[],
) {
  if (!post.data.series) return null;
  const definition = getSeriesDefinition(post.data.series);
  if (!definition) return null;
  const siblings = getSeriesPosts(post.data.series, posts);
  const index = siblings.findIndex((item) => item.id === post.id);
  if (index < 0) return null;
  return {
    definition,
    index,
    total: siblings.length,
    previous: siblings[index - 1] ?? null,
    next: siblings[index + 1] ?? null,
  };
}
