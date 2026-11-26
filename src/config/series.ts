export const seriesDefinitions = [
  { id: 'parking', title: '慢慢停', description: '從駕駛座和後視鏡開始，練一輪路邊停車，再用原始碼拆解低速操控。', total: 4 },
  { id: 'engineer-stock', title: '工程師選股網', description: '從市場資料日期和個股比較，走到公開資料管線、Next.js、Supabase 與部署。', total: 13 },
  {
    id: 'visual-regression',
    title: 'Framecheck（Visual Regression Hub）',
    description: '從公開 Demo 認識圖片差異，再用 Next.js、Supabase、GitHub Actions 與 Web Worker 做一套獨立比對工具。',
    total: 8,
    intro: '從本機圖片比對開始，依序完成部署、GitHub 登入、私人圖片儲存、自動化檢查、Worker 隔離與權限驗收。每篇都有可操作的步驟。',
    notice: '這是獨立的 image-review 教學系列，不是私人 Framecheck（Visual Regression Hub）正式產品的原始碼。正式產品包含額外的 Server 驗證、審核、分享及清理機制；教學未實作的部分會明確標示。',
    chapters: ['專案介紹', '本機原型', '首次部署', '登入與儲存', '品質與發布', '效能與互動', '正確性與權限', '總結與取捨'],
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
  { id: 'shade-lab', title: 'Shade Lab', description: '用照片與相機試妝，逐步拆開 MediaPipe、Web Worker 和 WebGL 的分工。', total: 7 },
  { id: 'pixel', title: 'Pixel Workbench', description: '做一張透明貼紙，批次匯出圖片，再回頭檢查瀏覽器裡的影像處理流程。', total: 4 },
  { id: 'youbike', title: '台北 YouBike', description: '用地圖上的借還數決定去哪站，並檢查 JSON、更新時間和連線失敗時的畫面。', total: 4 },
  { id: 'kanban', title: 'GitHub Kanban', description: '在免登入 Demo 整理 repository 卡片，理解看板狀態、備註和 GitHub 權限。', total: 4 },
  { id: 'datetime', title: 'React DateTime Range Picker', description: '用 Playground 核對時區、Apply 行為與時間戳，再把半開區間接到查詢。', total: 4 },
  { id: 'dev-map', title: 'Dev Map Lab', description: '在本機跑一道測資、匯出筆記，接著把一個新題目放進學習路線。', total: 4 },
  { id: 'toolbox', title: 'MR 工具百科', description: '用 CSV、文字比對和圖片轉檔練習驗收輸出，整理新增工具時要保住的行為。', total: 5 },
  { id: 'mr-coding', title: 'MR Coding', description: '從 Topics、Series 和 Projects 找到能跟做的工程文章，再驗證靜態網站的入口。', total: 3 },
  { id: 'mr-financial', title: 'MR Financial', description: '從一篇日報追到日期與原始來源，再看獨立歸檔與雙站切換。', total: 3 },
  { id: 'pap-qc', title: 'PAP 品管工作台', description: '以虛構資料練習匯入、查看規則結果和匯出，理解版本與人工覆核如何保留。', total: 3 },
  { id: 'auto-shutdown', title: 'R Auto Shutdown', description: '用模擬倒數驗證延後與取消，再拆開桌面介面和系統排程各管的事。', total: 3 },
  { id: 'web-auth', title: 'Web Authentication Component', description: '在本機接上 React 登入元件，驗證回呼、載入及錯誤狀態，再看認證服務的分工。', total: 3 },
  { id: 'pair-practice', title: 'Pair Practice', description: '用獨立的雙分頁範例驗證共編和測資，再看遠端房間需要多驗哪些行為。', total: 3 },
  { id: 'markdown-reader', title: 'Ray Markdown Reader', description: '從開啟一份 Markdown、預覽和編輯，到驗證變更真的存回同一份檔案。', total: 3 },
  { id: 'tech-stack-comparisons', title: 'Tech Stack & Tool Comparisons', description: '34 篇工具選型：Framework、Frontend、Data、Quality、Deployment 與 AI Agents。', total: 34, intro: '從實際工程問題出發，比較選擇、GitHub Stars、Pros、Cons、Trade-offs 與驗收。Stars 僅為查詢日期的公開 Repository 快照，不代表效能或成熟度；不公開私人專案內容。' },
] as const;

export type SeriesId = (typeof seriesDefinitions)[number]['id'];

export const getSeriesDefinition = (id: string) =>
  seriesDefinitions.find((series) => series.id === id);
