import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const origin = 'https://ntustray.github.io';
const configuredBase = process.env.SITE_BASE ?? '/mr-blog';
const base = configuredBase === '/' ? '/' : `/${configuredBase.replace(/^\\/+|\\/+$/gu, '')}/`;
const errors = [];
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (full.endsWith('.html')) htmlFiles.push(full);
  }
}

function extractTag(html, tag, attribute, value) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'giu'))]
    .map(([match]) => match)
    .find((match) => new RegExp(`\\b${attribute}="${value}"`, 'iu').test(match));
}

function attribute(tag, name) {
  return tag?.match(new RegExp(`\\b${name}="([^"]*)"`, 'iu'))?.[1];
}

await walk(dist);
const siteMapFiles = (await readdir(dist)).filter((file) => /^sitemap-\\d+\\.xml$/u.test(file));
if (siteMapFiles.length === 0) errors.push('No sitemap-N.xml files generated.');
const sitemapUrls = new Set();
for (const file of siteMapFiles) {
  const xml = await readFile(path.join(dist, file), 'utf8');
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\\/loc>/gu)) {
    sitemapUrls.add(loc.replaceAll('&amp;', '&'));
  }
}

let articles = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const route = relative === 'index.html' ? '' : relative.replace(/index\\.html$/u, '');
  const expectedUrl = new URL(`${base}${route}`, origin).href;
  const canonical = attribute(extractTag(html, 'link', 'rel', 'canonical'), 'href');
  const title = html.match(/<title>([\\s\\S]*?)<\\/title>/iu)?.[1]?.trim();
  const description = attribute(extractTag(html, 'meta', 'name', 'description'), 'content');
  const robots = attribute(extractTag(html, 'meta', 'name', 'robots'), 'content') ?? '';
  const noindex = /\\bnoindex\\b/iu.test(robots);
  if (canonical !== expectedUrl) errors.push(`${relative}: canonical expected ${expectedUrl}, got ${canonical}`);
  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing meta description`);
  if (relative === 'search/index.html' && !noindex) errors.push('Search page must be noindex.');
  if (noindex && sitemapUrls.has(expectedUrl)) errors.push(`${relative}: noindex page in sitemap`);
  if (!route.startsWith('posts/')) continue;

  articles++;
  if (!sitemapUrls.has(expectedUrl)) errors.push(`${relative}: article missing from sitemap`);
  const jsonLd = html.match(/<script\\b[^>]*type="application\\/ld\\+json"[^>]*>([\\s\\S]*?)<\\/script>/iu)?.[1];
  try {
    const parsed = JSON.parse(jsonLd ?? '');
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    const blog = nodes.find((node) => node['@type'] === 'BlogPosting');
    const breadcrumbs = nodes.find((node) => node['@type'] === 'BreadcrumbList');
    if (!blog || blog.url !== expectedUrl) errors.push(`${relative}: missing or mismatched BlogPosting`);
    if (!blog?.datePublished || !blog?.dateModified) errors.push(`${relative}: missing article dates`);
    if (!breadcrumbs || breadcrumbs.itemListElement?.length < 2) errors.push(`${relative}: missing BreadcrumbList`);
  } catch {
    errors.push(`${relative}: invalid JSON-LD`);
  }
}

if (errors.length) {
  console.error(`SEO checks failed (\\${errors.length}):\\n${errors.map((error) => `- ${error}`).join('\\n')}`);
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed for ${htmlFiles.length} HTML pages, ${articles} articles and ${sitemapUrls.size} sitemap URLs.`);
}
