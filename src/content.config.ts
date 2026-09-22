import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().trim().min(1),
    coverImage: z
      .string()
      .regex(/\.webp(?:[?#].*)?$/iu, 'coverImage must use WebP')
      .optional(),
    references: z
      .array(
        z.object({
          title: z.string().trim().min(1),
          url: z.string().url(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
