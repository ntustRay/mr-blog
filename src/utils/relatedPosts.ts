import type { CollectionEntry } from 'astro:content';

export function getRelatedPosts(
  currentPost: CollectionEntry<'blog'>,
  posts: CollectionEntry<'blog'>[],
  limit = 3,
): CollectionEntry<'blog'>[] {
  const currentTags = new Set(
    currentPost.data.tags.map((tag) => tag.toLocaleLowerCase('en-US')),
  );

  return posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      const sharedTags = post.data.tags.reduce(
        (count, tag) =>
          count + (currentTags.has(tag.toLocaleLowerCase('en-US')) ? 1 : 0),
        0,
      );
      const sameCategory = post.data.category === currentPost.data.category;

      return {
        post,
        score: (sameCategory ? 3 : 0) + sharedTags,
      };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf() ||
        a.post.id.localeCompare(b.post.id),
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
