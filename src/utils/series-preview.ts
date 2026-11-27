import type projects from '../data/projects.json';
import type { seriesDefinitions } from '../config/series';
import kanban from '../assets/project-series/kanban/02-after.webp';
import devMap from '../assets/project-series/dev-map/clamp-verified.webp';
import youbike from '../assets/project-series/youbike/nearby.webp';
import socketRoom from '../assets/project-series/pair-practice/socket-passing.webp';
import papDemo from '../assets/project-series/pap-qc/02-demo-result.webp';
import bundlerTable from '../assets/project-series/tech-stack/bundler-table.webp';

interface Preview {
  src: string;
  alt: string;
  width: number;
  height: number;
}

type Series = (typeof seriesDefinitions)[number];
type Project = (typeof projects)[number];

const lessonScreens: Partial<Record<Series['id'], Preview>> = {
  kanban: { ...kanban, alt: '看板中的 my-project 卡片已移到 Verify 欄。' },
  'dev-map': { ...devMap, alt: '程式練習的三筆測資通過，展開的案例列出預期值和實際輸出。' },
  youbike: { ...youbike, alt: '地圖與站點清單顯示臺北市政府站的可借車輛、空位和資料時間。' },
  'pair-practice': { ...socketRoom, alt: 'WebSocket 教學的 alpha 房間收到三個單字，測試結果與預期值相同。' },
  'pap-qc': { ...papDemo, alt: '工作台用內建虛構資料完成比對，列出規則版本、摘要和逐筆結果。' },
  'tech-stack-comparisons': { ...bundlerTable, alt: 'Bundler 選型文章列出 Vite、Webpack、Rspack 和 Turbopack 的優缺點與適用情境。' },
};

export function getSeriesPreview(series: Series, base: string, project?: Project): Preview {
  if ('previewImage' in series) {
    return { ...series.previewImage, src: base + series.previewImage.src };
  }
  const lesson = lessonScreens[series.id];
  if (lesson) return lesson;
  if (!project) throw new Error(`Missing preview for series ${series.id}`);
  return {
    src: base + project.image,
    alt: project.alt,
    width: project.width,
    height: project.height,
  };
}
