import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const codeBlockMetaTransformer = {
  name: 'mr-blog-code-block-meta',
  pre(node) {
    const language = this.options.lang;
    if (typeof language === 'string' && language.length > 0) {
      node.properties['data-language'] = language;
    }

    const rawMeta = this.options.meta?.__raw;
    if (typeof rawMeta !== 'string') {
      return;
    }

    const filename = rawMeta
      .match(/(?:title|filename)=["']([^"']+)["']/u)?.[1]
      ?.trim();

    if (filename) {
      node.properties['data-filename'] = filename;
    }
  },
};

export default defineConfig({
  site: 'https://ntustray.github.io',
  base: process.env.SITE_BASE ?? '/mr-blog',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        const excluded = [
          '/search/',
          '/categories/ai/',
          '/categories/engineering/',
          '/categories/web-development/',
          '/categories/blogging/',
          '/categories/life/',
          '/tags/ai-agent/',
          '/tags/react-hook/',
          '/tags/js/',
          '/tags/ts/',
        ];
        return !excluded.some((path) => pathname.endsWith(path));
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      transformers: [codeBlockMetaTransformer],
    },
  },
});
