import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { normalizeViewPath, viewSnapshotPath } from '../src/utils/viewCounts.mjs';

const propertyId = process.env.GA4_PROPERTY_ID;
const accessToken = process.env.GA4_ACCESS_TOKEN;
const site = new URL(process.argv[2]);
const sitePath = normalizeViewPath(site.pathname);
const siteRoot = sitePath.slice(0, -1);

if (!propertyId || !/^\d+$/u.test(propertyId) || !accessToken) {
  throw new Error('The GA4 numeric Property ID and a read-only access token are required.');
}

const filter = (fieldName, matchType, value) => ({
  filter: { fieldName, stringFilter: { matchType, value, caseSensitive: true } },
});

const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
    dimensionFilter: { andGroup: { expressions: [
      filter('hostName', 'EXACT', site.hostname),
      { orGroup: { expressions: [
        filter('pagePath', 'EXACT', siteRoot),
        filter('pagePath', 'BEGINS_WITH', sitePath),
      ] } },
    ] } },
    limit: '250000',
  }),
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) throw new Error(`GA4 Data API returned HTTP ${response.status}.`);
const report = await response.json();
const rows = report.rows ?? [];
if (
  report.dimensionHeaders?.[0]?.name !== 'pagePath' ||
  report.metricHeaders?.[0]?.name !== 'screenPageViews' ||
  (report.rowCount ?? 0) !== rows.length ||
  report.metadata?.dataLossFromOtherRow || report.metadata?.subjectToThresholding
) {
  throw new Error('GA4 Data API returned an incomplete page-view report.');
}

const pageViews = new Map();
let totalViews = 0;
for (const row of rows) {
  const path = normalizeViewPath(row.dimensionValues?.[0]?.value);
  const value = row.metricValues?.[0]?.value;
  const views = Number(value);
  if (!path.startsWith(sitePath) || typeof value !== 'string' || !/^\d+$/u.test(value) || !Number.isSafeInteger(views)) {
    throw new Error('GA4 Data API returned an invalid page-view row.');
  }
  pageViews.set(path, (pageViews.get(path) ?? 0) + views);
  totalViews += views;
}

const snapshot = { sitePath, updatedAt: new Date().toISOString(), totalViews, pageViews: Object.fromEntries(pageViews) };
const temporaryPath = `${viewSnapshotPath}.tmp`;
await mkdir(dirname(viewSnapshotPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`);
await rename(temporaryPath, viewSnapshotPath);
console.log(`Synced GA4 views for ${pageViews.size} page paths.`);
