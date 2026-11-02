const aliases: Record<string, string> = {
  'ai agent': 'AI Agents',
  'ai agents': 'AI Agents',
  'react hook': 'React Hooks',
  'react hooks': 'React Hooks',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
};

export function normalizeTag(tag: string): string {
  const trimmed = tag.normalize('NFKC').trim();
  return aliases[trimmed.toLocaleLowerCase('en-US')] ?? trimmed;
}

export function getTagSlug(tag: string): string {
  const slug = normalizeTag(tag)
    .toLowerCase()
    .replace(/\+\+/g, 'pp')
    .replace(/#/g, 'sharp')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length === 0) {
    throw new Error(`Tag "${tag}" cannot be converted to a URL slug.`);
  }
  return slug;
}

export const historicalTagRedirects: Record<string, string> = {
  'ai-agent': 'ai-agents',
  'react-hook': 'react-hooks',
  js: 'javascript',
  ts: 'typescript',
};
