import { readFileSync } from 'node:fs';
import { normalizeQuotes } from './src/providers/quotes.ts';

const raw: unknown = JSON.parse(
  readFileSync('tests/fixtures/official/twse-quotes.json', 'utf8'),
);
const quote = normalizeQuotes('TWSE', raw).quotes[0];
if (!quote) throw new Error('No quote');
console.log(JSON.stringify({
  symbol: quote.symbol,
  date: quote.daily.date,
  close: quote.daily.close,
  volumeShares: quote.daily.volumeShares,
}, null, 2));
