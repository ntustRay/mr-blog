interface OgImageData {
  title: string;
  tags: string[];
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getCharacterUnits(character: string): number {
  return /^[\u0000-\u00ff]$/.test(character) ? 1 : 1.8;
}

function wrapTitle(title: string, maxUnits: number, maxLines: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let currentUnits = 0;

  for (const character of Array.from(title.trim())) {
    const units = getCharacterUnits(character);

    if (currentLine.length > 0 && currentUnits + units > maxUnits) {
      lines.push(currentLine.trim());
      currentLine = '';
      currentUnits = 0;

      if (lines.length === maxLines) {
        break;
      }
    }

    currentLine += character;
    currentUnits += units;
  }

  if (lines.length < maxLines && currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  const consumed = lines.join('').replaceAll(' ', '').length;
  const original = title.trim().replaceAll(' ', '').length;

  if (consumed < original && lines.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].replace(/[.…]+$/u, '')}…`;
  }

  return lines;
}

export function createOgSvg({ title, tags }: OgImageData): string {
  const titleLines = wrapTitle(title, 28, 3);
  const titleFontSize = title.length > 48 ? 58 : 68;
  const titleLineHeight = titleFontSize + 18;
  const tagText = tags
    .slice(0, 4)
    .map((tag) => `#${tag}`)
    .join('   ');

  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<tspan x="96" y="${250 + index * titleLineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.18" cy="0.1" r="0.9">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1200" height="630" fill="url(#background)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>

    <rect x="96" y="78" width="58" height="58" rx="14" fill="#ffffff"/>
    <text
      x="125"
      y="118"
      text-anchor="middle"
      font-family="Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
      font-size="31"
      font-weight="800"
      fill="#111827"
    >M</text>

    <text
      x="174"
      y="116"
      font-family="Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
      font-size="30"
      font-weight="700"
      fill="#ffffff"
    >MR Blog</text>

    <text
      font-family="Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
      font-size="${titleFontSize}"
      font-weight="800"
      fill="#ffffff"
    >${titleMarkup}</text>

    <text
      x="96"
      y="548"
      font-family="Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
      font-size="24"
      font-weight="500"
      fill="#a5b4fc"
    >${escapeXml(tagText || 'Technical Notes')}</text>

    <text
      x="1104"
      y="548"
      text-anchor="end"
      font-family="Noto Sans CJK TC, Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
      font-size="22"
      fill="#94a3b8"
    >ntustRay</text>
  </svg>`;
}
