import { z } from 'zod';

const valuationSchema = z.object({
  per: z.number().finite().nullable(),
});

function parseValue<T>(raw: unknown, schema: z.ZodType<T>): T {
  return schema.parse(raw);
}

const valuation = parseValue({ per: 12 }, valuationSchema);
if (valuation.per !== null) {
  console.log(valuation.per.toFixed(2));
}

try {
  parseValue({ per: '12' }, valuationSchema);
  throw new Error('Expected the runtime schema to reject a string');
} catch (error: unknown) {
  if (!(error instanceof z.ZodError)) throw error;
  console.log('Rejected string input: per must be a finite number or null');
}
