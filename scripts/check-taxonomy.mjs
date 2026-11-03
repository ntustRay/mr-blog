import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const blogDir = join(root, 'src/content/blog');
const categoriesSource = readFileSync(join(root, 'src/config/taxonomy.ts'), 'utf8');
const seriesSource = readFileSync(join(root, 'src/config/series.ts'), 'utf8');
const allowedCategories = new Set(
  [...categoriesSource.split('export const legacyCategories')[0].matchAll(/name:\s*'([^']+)'/g)].map((match) => match[1]),
);
const seriesEntries = [...seriesSource.matchAll(/id:\s*'([^']+)'[^}]*?\btotal:\s*(\d+)/g)];
const seriesLimits = new Map(seriesEntries.map((match) => [match[1], Number(match[2])]));
const seenSeries = new Map();
const errors = [];
const counts = new Map();

function readField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1].trim().replace(/^(['"])(.*)\1$/, '$2') ?? null;
}

const filenames = readdirSync(blogDir).filter((name) => /\.mdx?$/.test(name));
for (const filename of filenames) {
  const source = readFileSync(join(blogDir, filename), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    errors.push(`${filename}: missing frontmatter`);
    continue;
  }
  const fm = frontmatter[1];
  const category = readField(fm, 'category');
  const title = readField(fm, 'title') ?? '';
  const series = readField(fm, 'series');
  const orderText = readField(fm, 'seriesOrder');

  if (!category || !allowedCategories.has(category)) errors.push(`${filename}: unknown category "${category}"`);
  else counts.set(category, (counts.get(category) ?? 0) + 1);
  if (!/^\[(News|Guide|Insight|Review)\]\s/.test(title)) {
    errors.push(`${filename}: title must start with a valid article type`);
  }
  if (Boolean(series) !== Boolean(orderText)) {
    errors.push(`${filename}: series and seriesOrder must be specified together`);
  }
  if (series) {
    if (!seriesLimits.has(series)) errors.push(`${filename}: unknown series "${series}"`);
    const order = Number(orderText);
    if (!Number.isInteger(order) || order < 1) errors.push(`${filename}: invalid seriesOrder`);
    const group = seenSeries.get(series) ?? new Set();
    if (group.has(order)) errors.push(`${filename}: duplicate seriesOrder ${order} in ${series}`);
    group.add(order);
    seenSeries.set(series, group);
  }
}
for (const [series, expected] of seriesLimits) {
  const orders = seenSeries.get(series) ?? new Set();
  if (orders.size !== expected || Array.from({ length: expected }, (_, i) => i + 1).some((n) => !orders.has(n))) {
    errors.push(`${series}: expected contiguous seriesOrder 1..${expected}; got ${[...orders].sort((a, b) => a - b).join(',')}`);
  }
}
if (filenames.length < 259) errors.push(`Expected at least 259 posts, found ${filenames.length}`);
console.log(`Taxonomy: ${filenames.length} articles / ${allowedCategories.size} categories / ${seriesLimits.size} series`);
for (const [name, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) console.log(`  ${name}: ${count}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log('Taxonomy validation passed.');
}
