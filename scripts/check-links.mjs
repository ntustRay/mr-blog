import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist');
const configuredBase = process.env.SITE_BASE ?? '/mr-blog';
const siteBase = `/${configuredBase.replace(/^\/+|\/+$/gu, '')}/`.replace(
  /^\/\/$/u,
  '/',
);
const testOrigin = 'https://link-check.local';
const linkPattern = /\b(?:href|src)=(['"])(.*?)\1/giu;
const ignoredProtocols = /^(?:data|javascript|mailto|tel):/iu;
const failures = [];
let checkedLinks = 0;
const projects = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8'));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function getPagePath(filePath) {
  const relativePath = path.relative(outputDirectory, filePath).replaceAll(path.sep, '/');

  if (relativePath === 'index.html') return siteBase;
  if (relativePath.endsWith('/index.html')) {
    return `${siteBase}${relativePath.slice(0, -'index.html'.length)}`;
  }

  return `${siteBase}${relativePath}`;
}

async function exists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function getOutputPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const baseRelativePath = siteBase === '/'
    ? decodedPath.replace(/^\//u, '')
    : decodedPath.startsWith(siteBase)
      ? decodedPath.slice(siteBase.length)
      : null;

  if (baseRelativePath === null) return null;
  if (baseRelativePath === '' || baseRelativePath.endsWith('/')) {
    return path.join(outputDirectory, baseRelativePath, 'index.html');
  }

  return path.join(outputDirectory, baseRelativePath);
}

function hasFragment(html, fragment) {
  const decodedFragment = decodeURIComponent(fragment);
  const escapedFragment = decodedFragment.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`\\b(?:id|name)=["']${escapedFragment}["']`, 'u').test(html);
}

function previewImages(html) {
  return [...html.matchAll(/<img\b[^>]*>/giu)]
    .map(([tag]) => tag)
    .filter(tag => /\balt="\s*[^"\s][^"]*"/u.test(tag) && /\bwidth="[1-9]\d*"/u.test(tag) && /\bheight="[1-9]\d*"/u.test(tag))
    .map(tag => tag.match(/\bsrc="([^"]+)"/u)?.[1])
    .filter(Boolean);
}

const htmlFiles = (await walk(outputDirectory)).filter((filePath) =>
  filePath.endsWith('.html'),
);

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const pageURL = new URL(getPagePath(htmlFile), testOrigin);
  const route = pageURL.pathname.slice(siteBase.length);
  if (route === 'series/') {
    const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/giu)].map(([link]) => link);
    for (const { seriesId } of projects) {
      const href = `${siteBase}series/${seriesId}/`;
      if (!links.some(link => link.includes(`href="${href}"`) && previewImages(link).length)) {
        failures.push(`${pageURL.pathname}: missing card preview for ${seriesId}`);
      }
    }
  } else if (/^series\/[^/]+\/$/u.test(route)) {
    const shareImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/iu)?.[1];
    const visible = previewImages(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/iu)?.[1] ?? '');
    if (!shareImage || !visible.some(src => new URL(src, shareImage).href === shareImage)) {
      failures.push(`${pageURL.pathname}: expected a visible series preview matching og:image`);
    }
  }

  for (const match of html.matchAll(linkPattern)) {
    const value = match[2].trim();

    if (!value || value.startsWith('#') || ignoredProtocols.test(value)) continue;

    const targetURL = new URL(value, pageURL);

    if (targetURL.origin !== testOrigin) continue;

    const outputPath = getOutputPath(targetURL.pathname);

    if (!outputPath) continue;

    checkedLinks += 1;

    if (!(await exists(outputPath))) {
      failures.push(`${getPagePath(htmlFile)} -> ${value} (missing file)`);
      continue;
    }

    if (targetURL.hash && outputPath.endsWith('.html')) {
      const targetHtml = await readFile(outputPath, 'utf8');

      if (!hasFragment(targetHtml, targetURL.hash.slice(1))) {
        failures.push(`${getPagePath(htmlFile)} -> ${value} (missing anchor)`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Found ${failures.length} broken internal link(s):`);
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${checkedLinks} internal links across ${htmlFiles.length} HTML files.`);
}
