export function getTagSlug(tag: string): string {
  const slug = tag
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length === 0) {
    throw new Error(`Tag "${tag}" cannot be converted to a URL slug.`);
  }

  return slug;
}
