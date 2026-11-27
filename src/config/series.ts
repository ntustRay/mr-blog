export const seriesDefinitions = [
  { id: 'parking', title: '慢慢停', description: '用同一個車輛模型算出 D、R 檔的蠕行軌跡，畫出車身和停車格，測試入格判定並部署到 GitHub Pages。', total: 4 },
  { id: 'engineer-stock', title: '工程師選股網', description: '把公開行情整理成每日快照，接進 Next.js 查詢頁，再用 Supabase 管理會員自選股並部署到 Vercel。', total: 13 },
  {
    id: 'visual-regression',
    title: 'Framecheck（Visual Regression Hub）',
    description: '從本機做出第一張像素差異圖，把圖檔接到 Supabase、將 Next.js 部署到 Vercel，再用 Worker 處理比對。',
    total: 8,
    intro: '從本機圖片比對開始，依序完成部署、GitHub 登入、私人圖片儲存、自動化檢查、Worker 隔離與權限驗收。每篇都有可操作的步驟。',
    notice: '這是獨立的 image-review 教學系列，不是私人 Framecheck（Visual Regression Hub）正式產品的原始碼。正式產品包含額外的 Server 驗證、審核、分享及清理機制；教學未實作的部分會明確標示。',
    chapters: ['專案介紹', '本機原型', '首次部署', '登入與儲存', '品質與發布', '效能與互動', '正確性與權限', '總結與取捨'],
    previewImage: {
      src: 'downloads/visual-regression-series/images/local/03-comparison-result.webp',
      width: 1280,
      height: 1113,
      alt: '圖片比對教學的 Before、After 及差異結果畫面',
      caption: '獨立教學範例的實際比對畫面',
    },
    resources: [
      { label: '公開 Demo', href: 'https://visual-regression-hub.vercel.app/demo' },
      { label: '正式產品架構', href: 'https://visual-regression-hub.vercel.app/source' },
      { label: '下載教學程式（ZIP）', href: 'downloads/visual-regression-series.zip' },
      { label: '程式與驗證範圍', href: 'downloads/visual-regression-series/README.md' },
    ],
  },
  { id: 'shade-lab', title: 'Shade Lab', description: '把照片或相機影格送進 MediaPipe，在 Worker 取出臉部座標，再用 WebGL 疊上妝效、比對與匯出。', total: 7 },
  { id: 'pixel', title: 'Pixel Workbench', description: '用 Canvas 沿著透明貼紙畫白邊，把多張圖編成 WebP、打包 ZIP，再將工具部署到 Vercel。', total: 4 },
  { id: 'youbike', title: '台北 YouBike', description: '讀取臺北 YouBike 開放資料，把可借車輛和可還空位放到地圖上，處理更新失敗時要顯示的資料。', total: 4 },
  { id: 'kanban', title: 'GitHub Kanban', description: '實作 repository 卡片的拖曳排序，用 GitHub 登入、將狀態寫入 Neon Postgres，再部署到 Vercel。', total: 4 },
  { id: 'datetime', title: 'React DateTime Range Picker', description: '把日期範圍元件接進 React，分開草稿與送出的值，再用半開區間查詢指定時區的資料。', total: 4 },
  { id: 'dev-map', title: 'Dev Map Lab', description: '為 TypeScript 課程新增一道有測資的程式題，把教材部署到 Vercel，再用 Neon 接上會員與筆記備份。', total: 4 },
  { id: 'toolbox', title: 'MR 工具百科', description: '在瀏覽器實作 CSV 與 JSON 轉換、逐行文字比對、Canvas 圖片轉檔，逐一驗證輸出。', total: 5 },
  { id: 'mr-coding', title: 'MR Coding', description: '用 Astro 把 Markdown 文章建成靜態頁面，將文章串成系列，再透過 GitHub Actions 發布到 Pages。', total: 3 },
  { id: 'mr-financial', title: 'MR Financial', description: '把同一天的兩份財經日報併成一列，用測試處理缺版，再將 Astro 索引頁部署到 GitHub Pages。', total: 3 },
  { id: 'pap-qc', title: 'PAP 品管工作台', description: '以虛構資料練習匯入、查看規則結果和匯出，理解版本與人工覆核如何保留。', total: 3 },
  { id: 'auto-shutdown', title: 'R Auto Shutdown', description: '在 Rust 模擬模式實作提醒倒數，分開 egui 畫面和排程狀態，測試延後與取消。', total: 3 },
  { id: 'web-auth', title: 'Web Authentication Component', description: '把 React 登入元件接到 Supabase Auth，設定 GitHub OAuth 回呼與 Vercel 網域，驗證重新整理後仍能讀取 session。', total: 3 },
  { id: 'pair-practice', title: 'Pair Practice', description: '用 Bun 和 WebSocket 從零做雙人房間，驗證晚加入、房間廣播及測資隔離。', total: 3 },
  { id: 'markdown-reader', title: 'Ray Markdown Reader', description: '串起 Markdown 的選檔、編輯、預覽與存檔，處理切換檔案和寫入失敗時的未儲存內容。', total: 3 },
  { id: 'tech-stack-comparisons', title: 'Tech Stack & Tool Comparisons', description: '34 篇工具選型：Framework、Frontend、Data、Quality、Deployment 與 AI Agents。', total: 34, intro: '從實際工程問題出發，比較選擇、GitHub Stars、Pros、Cons、Trade-offs 與驗收。Stars 僅為查詢日期的公開 Repository 快照，不代表效能或成熟度；不公開私人專案內容。' },
] as const;

export type SeriesId = (typeof seriesDefinitions)[number]['id'];

export const getSeriesDefinition = (id: string) =>
  seriesDefinitions.find((series) => series.id === id);
