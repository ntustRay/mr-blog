import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

export const snapshotFile = '.ga-pageviews.json';
export const publicSnapshotFile = 'pageviews.json';

/** @typedef {{site: string, through: string, total: number, pages: Record<string, number>}} PageviewSnapshot */

/** @param {string} pathname */
export function normalizePagePath(pathname) {
  return pathname.replace(/\/?$/u, '/');
}

/** @param {unknown} value @param {string} site @returns {PageviewSnapshot} */
export function parsePageviewSnapshot(value, site) {
  if (!value || typeof value !== 'object' || !('site' in value) || value.site !== site ||
      !('through' in value) || typeof value.through !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value.through) ||
      !('total' in value) || typeof value.total !== 'number' || !Number.isSafeInteger(value.total) || value.total < 0 ||
      !('pages' in value) || !value.pages || typeof value.pages !== 'object' || Array.isArray(value.pages)) {
    throw new Error('Invalid GA4 pageview snapshot');
  }

  const base = new URL(site).pathname;
  const pages = Object.create(null);
  for (const [path, count] of Object.entries(value.pages)) {
    if (!path.startsWith(base) || /[?#\\]/u.test(path) || !path.endsWith('/') ||
        !Number.isSafeInteger(count) || count < 0) {
      throw new Error('Invalid path or count in GA4 pageview snapshot');
    }
    pages[path] = count;
  }
  return { site, through: value.through, total: value.total, pages };
}

/** @type {Map<string, PageviewSnapshot | null>} */
const snapshots = new Map();

/** @param {string} site */
export function readPageviewSnapshot(site) {
  if (!snapshots.has(site)) {
    try {
      const value = JSON.parse(readFileSync(snapshotFile, 'utf8'));
      snapshots.set(site, value.site === site ? parsePageviewSnapshot(value, site) : null);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
      snapshots.set(site, null);
    }
  }
  return snapshots.get(site) ?? null;
}

/** @param {string} site @returns {import('astro').AstroIntegration} */
export function publishPageviewSnapshot(site) {
  return {
    name: 'ga4-pageview-snapshot',
    hooks: {
      'astro:build:done': async ({ pages, dir }) => {
        const snapshot = readPageviewSnapshot(site);
        if (!snapshot) return;

        const publicPages = Object.create(null);
        for (const { pathname } of pages) {
          const relativePath = pathname.replace(/^\/+/, '');
          const path = normalizePagePath(new URL(`./${relativePath}`, site).pathname);
          if (Object.hasOwn(snapshot.pages, path)) publicPages[path] = snapshot.pages[path];
        }
        await writeFile(new URL(publicSnapshotFile, dir), JSON.stringify({ ...snapshot, pages: publicPages }));
      },
    },
  };
}
