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

// Wrap Markdown tables at build time so scrolling does not change table layout.
function wrapMarkdownTables() {
  return (tree) => {
    function wrapChildren(node) {
      if (!Array.isArray(node.children)) return;

      const parentClasses = node.properties?.className;
      const alreadyScrollable =
        Array.isArray(parentClasses) &&
        parentClasses.some((name) => name === 'table-scroll' || name === 'table-overflow');

      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'table' && !alreadyScrollable) {
          return {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-overflow'], tabIndex: 0 },
            children: [child],
          };
        }
        wrapChildren(child);
        return child;
      });
    }

    wrapChildren(tree);
  };
}

export default defineConfig({
  site: 'https://ntustray.github.io',
  base: process.env.SITE_BASE ?? '/mr-blog',
  trailingSlash: 'always',
  integrations: [
    sitemap({ filter: (page) => !new URL(page).pathname.endsWith('/search/') }),
  ],
  markdown: {
    rehypePlugins: [wrapMarkdownTables],
    shikiConfig: {
      transformers: [codeBlockMetaTransformer],
    },
  },
});
