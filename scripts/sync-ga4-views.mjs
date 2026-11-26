import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { normalizeViewPath, viewSnapshotPath } from '../src/utils/viewCounts.mjs';

const propertyId = process.env.GA4_PROPERTY_ID;
const accessToken = process.env.GA4_ACCESS_TOKEN;
const site = new URL(process.argv[2]);
const sitePath = normalizeViewPath(site.pathname);
const siteRoot = sitePath.slice(0, -1);

if (!/^\d+$/u.test(propertyId ?? '')) {
  throw new Error('The numeric GA4 Property ID is required.');
}

const scriptUrl = process.env.GA4_APPS_SCRIPT_URL;
const report = scriptUrl ? await fetchScriptReport(scriptUrl) : await fetchDataApiReport();

async function fetchScriptReport(scriptUrl) {
  const endpoint = new URL(scriptUrl);
  const secret = process.env.GA4_APPS_SCRIPT_TOKEN;
  if (
    endpoint.origin !== 'https://script.google.com' ||
    !/^\/macros\/s\/[\w-]+\/exec$/u.test(endpoint.pathname) ||
    endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
    !/^[0-9a-f]{64}$/u.test(secret ?? '')
  ) {
    throw new Error('A deployed Apps Script URL and snapshot token are required.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sitePath, token: secret }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Apps Script returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (payload?.sitePath !== sitePath || payload?.propertyId !== propertyId || !payload?.report) {
    throw new Error('Apps Script did not return a GA4 report for this site.');
  }
  return payload.report;
}

async function fetchDataApiReport() {
  if (!accessToken) throw new Error('A read-only GA4 access token is required.');
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
  return response.json();
}

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
