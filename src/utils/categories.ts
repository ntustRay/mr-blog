export function getCategorySlug(category: string): string {
  const slug = category
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length === 0) {
    throw new Error(
      `Category "${category}" cannot be converted to a URL slug.`,
    );
  }

  return slug;
}
