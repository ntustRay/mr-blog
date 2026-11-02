export const contentTypes = ['News', 'Guide', 'Insight', 'Review'] as const;
export type ContentType = (typeof contentTypes)[number];

export function getContentType(title: string): ContentType | null {
  const prefix = /^\[(News|Guide|Insight|Review)\]\s/.exec(title);
  return prefix ? (prefix[1] as ContentType) : null;
}

export function getDisplayTitle(title: string): string {
  return title.replace(/^\[(?:News|Guide|Insight|Review)\]\s/, '');
}
