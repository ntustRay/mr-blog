import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import sharp from 'sharp';
import { createOgSvg } from '../../utils/og';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.map((post) => ({
    params: { id: post.id },
  }));
}

export const GET = (async ({ params }) => {
  const id = params.id;

  if (!id) {
    return new Response('Missing post id.', { status: 400 });
  }

  const post = await getEntry('blog', id);

  if (!post || post.data.draft) {
    return new Response('Post not found.', { status: 404 });
  }

  const svg = createOgSvg({
    title: post.data.title,
    tags: post.data.tags,
  });

  const webp = await sharp(Buffer.from(svg))
    .webp({ quality: 90 })
    .toBuffer();

  return new Response(new Uint8Array(webp), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}) satisfies APIRoute;
