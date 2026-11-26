import { readFileSync } from 'node:fs';

export const viewSnapshotPath = '.cache/ga4-views.json';

/** @param {string} pathname */
export function normalizeViewPath(pathname) {
  const path = new URL(pathname, 'https://example.invalid').pathname;
  return `${path.replace(/(?:\/index\.html|\/+)$/u, '')}/`;
}

/** @typedef {{ sitePath: string, updatedAt: string, totalViews: number, pageViews: Record<string, number> }} ViewSnapshot */

/** @returns {ViewSnapshot | null} */
function readViewSnapshot() {
  try {
    const snapshot = JSON.parse(readFileSync(viewSnapshotPath, 'utf8'));
    if (
      typeof snapshot?.sitePath !== 'string' ||
      !Number.isFinite(Date.parse(snapshot.updatedAt)) ||
      !Number.isSafeInteger(snapshot.totalViews) || snapshot.totalViews < 0 ||
      !snapshot.pageViews || typeof snapshot.pageViews !== 'object' || Array.isArray(snapshot.pageViews)
    ) return null;
    return snapshot;
  } catch {
    return null;
  }
}

const viewSnapshot = readViewSnapshot();

/** @param {string} basePath */
export function getViewSnapshot(basePath) {
  return viewSnapshot?.sitePath === normalizeViewPath(basePath) ? viewSnapshot : null;
}

/**
 * @param {ViewSnapshot | null} snapshot
 * @param {string} pathname
 */
export function getPageViewCount(snapshot, pathname) {
  return snapshot ? snapshot.pageViews[normalizeViewPath(pathname)] ?? 0 : null;
}
