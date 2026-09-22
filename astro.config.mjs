import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ntustray.github.io',
  base: process.env.SITE_BASE ?? '/mr-blog',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
