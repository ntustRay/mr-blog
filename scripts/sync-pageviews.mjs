import { writeFile } from 'node:fs/promises';
import { normalizePagePath, parsePageviewSnapshot, publicSnapshotFile, snapshotFile } from './pageviews.mjs';

const site = new URL(process.argv[2]);
const property = process.env.GA4_PROPERTY_ID;
const token = process.env.GA4_ACCESS_TOKEN;
const through = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })
  .format(new Date(Date.now() - 86_400_000));

async function fetchPageviews() {
  if (!/^\d+$/u.test(property ?? '')) throw new Error('Set GA4_PROPERTY_ID to the numeric GA4 property ID');

  const pages = Object.create(null);
  let total = 0;
  let offset = 0;
  let rowCount = 0;
  do {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        dateRanges: [{ startDate: '2020-01-01', endDate: through }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: site.hostname } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: site.pathname, caseSensitive: true } } },
            ],
          },
        },
        orderBys: [{ dimension: { dimensionName: 'pagePath' } }],
        offset: String(offset),
        limit: '10000',
      }),
    });
    if (!response.ok) throw new Error(`GA4 Data API HTTP ${response.status}`);
    const report = await response.json();
    if (report.metadata?.dataLossFromOtherRow || report.metadata?.subjectToThresholding) {
      throw new Error('GA4 returned an aggregated or thresholded report');
    }
    const rows = report.rows ?? [];
    rowCount = report.rowCount ?? 0;
    if (!Number.isSafeInteger(rowCount) || rowCount < offset + rows.length || (!rows.length && offset < rowCount)) {
      throw new Error('GA4 returned an incomplete pageview report');
    }
    for (const row of rows) {
      const path = row.dimensionValues?.[0]?.value;
      const value = row.metricValues?.[0]?.value;
      if (typeof path !== 'string' || !path.startsWith(site.pathname) || typeof value !== 'string' || !/^\d+$/u.test(value)) {
        throw new Error('GA4 returned an invalid pageview row');
      }
      const pagePath = normalizePagePath(new URL(path, site).pathname);
      const views = Number(value);
      pages[pagePath] = (pages[pagePath] ?? 0) + views;
      total += views;
    }
    offset += rows.length;
  } while (offset < rowCount);

  return parsePageviewSnapshot({ site: site.href, through, total, pages }, site.href);
}

async function restorePageviews() {
  const response = await fetch(new URL(publicSnapshotFile, site), { signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Published pageview snapshot HTTP ${response.status}`);
  return parsePageviewSnapshot(await response.json(), site.href);
}

let snapshot;
if (token && property) {
  try {
    snapshot = await fetchPageviews();
    console.log(`Fetched GA4 pageviews through ${snapshot.through}`);
  } catch (error) {
    console.warn(`::warning::GA4 pageview refresh failed: ${error.message}`);
  }
} else {
  console.warn('::warning::GA4 credentials are unavailable; looking for the last published pageview snapshot');
}

if (!snapshot) {
  snapshot = await restorePageviews();
  console.log(snapshot ? `Using published snapshot through ${snapshot.through}` : 'No pageview snapshot has been published');
}
if (snapshot) await writeFile(snapshotFile, JSON.stringify(snapshot), { mode: 0o600 });
