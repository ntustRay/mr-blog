export const seriesDefinitions = [
  { id: 'engineer-stock', title: '工程師選股網', description: '從公開資料來源、Next.js、Supabase 到部署與整體系統設計。', total: 10 },
  { id: 'visual-regression', title: 'Visual Regression Engine', description: '圖片比對系統的全端開發、部署、測試與存取控制。', total: 6 },
  { id: 'shade-lab', title: 'Shade Lab', description: '從相機、MediaPipe、Web Worker、WebGL 到 AR 妝容的實作。', total: 6 },
] as const;

export type SeriesId = (typeof seriesDefinitions)[number]['id'];

export const getSeriesDefinition = (id: string) =>
  seriesDefinitions.find((series) => series.id === id);
