export const seriesDefinitions = [
  { id: 'engineer-stock', title: '工程師選股網', description: '從公開資料來源、Next.js、Supabase 到部署與整體系統設計。', total: 10 },
  {
    id: 'visual-regression',
    title: 'Visual Regression Hub',
    description: '六篇圖片比對實作：Next.js、Bun、Vercel、Supabase、GitHub Actions、Web Worker 與驗收。',
    total: 6,
    intro: '從本機圖片比對開始，依序完成部署、GitHub 登入、私人圖片儲存、自動化檢查、Worker 隔離與權限驗收。每篇都有可操作的步驟。',
    notice: '這是獨立的 image-review 教學系列，不是私人 Framecheck（Visual Regression Hub）正式產品的原始碼。正式產品包含額外的 Server 驗證、審核、分享及清理機制；教學未實作的部分會明確標示。',
    chapters: ['本機原型', '首次部署', '登入與儲存', '品質與發布', '效能與互動', '正確性與安全'],
    previewImage: {
      src: 'downloads/visual-regression-series/images/local/03-comparison-result.webp',
      alt: '圖片比對教學的 Before、After 及差異結果畫面',
    },
    resources: [
      { label: '公開 Demo', href: 'https://visual-regression-hub.vercel.app/demo' },
      { label: '正式產品架構', href: 'https://visual-regression-hub.vercel.app/source' },
      { label: '下載教學程式（ZIP）', href: 'downloads/visual-regression-series.zip' },
      { label: '程式與驗證範圍', href: 'downloads/visual-regression-series/README.md' },
    ],
  },
  { id: 'shade-lab', title: 'Shade Lab', description: '從相機、MediaPipe、Web Worker、WebGL 到 AR 妝容的實作。', total: 6 },
] as const;

export type SeriesId = (typeof seriesDefinitions)[number]['id'];

export const getSeriesDefinition = (id: string) =>
  seriesDefinitions.find((series) => series.id === id);
