import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod/v4';
import { sourceSchema } from './src/contracts.ts';
import { fetchApprovedJson } from './src/fetch.ts';
import { normalizeQuotes, twseQuotesSchema } from './src/providers/quotes.ts';

const registry = z.object({ sources: z.array(sourceSchema) }).parse(
  parse(readFileSync('config/sources.yml', 'utf8')),
);
const source = registry.sources.find((item) => item.id === 'twse.daily_price');
if (!source || !source.schema_fixture) throw new Error('Missing source or fixture');

const live = process.argv.includes('--live');
const raw = live
  ? await fetchApprovedJson(source, twseQuotesSchema, { retries: 0 })
  : twseQuotesSchema.parse(
      JSON.parse(readFileSync(source.schema_fixture, 'utf8')),
    );
const batch = normalizeQuotes('TWSE', raw);
const quote = batch.quotes.find((item) => item.symbol === '1101');
if (!quote) throw new Error('Missing 1101 quote');

console.log(JSON.stringify({
  mode: live ? 'live' : 'fixture',
  source: source.id,
  sourceUrl: source.url,
  rows: batch.quotes.length,
  asOfDate: batch.asOfDate,
  sample: {
    symbol: quote.symbol,
    date: quote.daily.date,
    close: quote.daily.close,
    volumeShares: quote.daily.volumeShares,
  },
}, null, 2));
