export const categories = [
  { name: 'AI & Agents', description: 'Agent、LLM、MCP、Skills、模型與自動化系統。', primary: true },
  { name: 'Frontend', description: 'React、TypeScript、CSS、Canvas、WebGL 與 Browser API。', primary: true },
  { name: 'Full-stack', description: 'Next.js、Node.js、API、Auth 與服務整合。', primary: true },
  { name: 'Data & Visualization', description: 'SQL、DuckDB、資料處理、查詢與圖表。', primary: true },
  { name: 'Dev Tools & Quality', description: 'Git、CI/CD、開發工具、Testing 與品質管理。', primary: true },
  { name: 'System Design', description: '系統架構、併發、擴展性與設計取捨。', primary: true },
  { name: 'Programming & Algorithms', description: 'C#、Java、Python、程式語言基礎與演算法。', primary: false },
  { name: 'Game Development', description: 'Unity、遊戲引擎、遊戲程式與互動製作。', primary: false },
  { name: 'Web Publishing & SEO', description: 'WordPress、Hosting、SEO、AEO 與網站經營。', primary: false },
  { name: 'Career & Life', description: '職涯、學習、簡報與生活觀察。', primary: false },
] as const;

export type CategoryName = (typeof categories)[number]['name'];

export const isCategory = (value: string): value is CategoryName =>
  categories.some((category) => category.name === value);

export const legacyCategories: Record<string, { name: string; destinations: CategoryName[] }> = {
  ai: { name: 'AI', destinations: ['AI & Agents'] },
  engineering: {
    name: 'Engineering',
    destinations: ['Programming & Algorithms', 'Dev Tools & Quality', 'System Design', 'Game Development'],
  },
  'web-development': {
    name: 'Web Development',
    destinations: ['Frontend', 'Full-stack', 'Data & Visualization', 'Web Publishing & SEO'],
  },
  blogging: { name: 'Blogging', destinations: ['Web Publishing & SEO'] },
  life: { name: 'Life', destinations: ['Career & Life'] },
};
