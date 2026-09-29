import type { Lang } from '../i18n';

export const KPI_IDS = ['orders', 'net', 'aov', 'refund', 'minutes'] as const;
export type KpiId = (typeof KPI_IDS)[number];

export const COCKPIT_TEXT = {
  zh: {
    title: '驾驶舱：自己筛选验证', kicker: 'Live SQL',
    idle: '显示的是整个学期的结果。滚动到这里时载入 SQLite 与学期数据库（约 2 MB），之后可以筛选。',
    loading: '正在载入 SQLite 与学期数据库…', ready: '已载入 · 改变筛选，所有图表一起更新。', running: '正在执行 SQL…',
    empty: '当前筛选下没有订单。',
    loadFailed: '引擎或数据库未能下载（网络较慢或被拦截）。上面的滚动叙事不受影响；也可以在页尾下载数据库，在本地运行同样的 SQL。',
    runFailed: '查询没有完成，请刷新页面重试。',
    weeks: '周范围', from: '从第', to: '到第', week: '周', merchants: '商家', areas: '宿舍区', reset: '清除筛选',
    kpi: { orders: '订单数', net: '净收款', aov: '客单价', refund: '退款率', minutes: '平均送达' },
    charts: { heatmap: '下单时段（星期 × 小时）', merchants: '商家净收款', delivery: '送达时长（按宿舍区，分钟）', reasons: '退款原因' },
    viewSql: '查看 SQL 与结果', resultLabel: '查询结果，可横向滚动',
    clickHint: '点击商家的柱子或宿舍区的柱子，也能按它筛选；再点一次取消。',
  },
  en: {
    title: 'Dashboard: filter it yourself', kicker: 'Live SQL',
    idle: 'Showing the whole term. SQLite and the term database (about 2 MB) load when you scroll here; then you can filter.',
    loading: 'Loading SQLite and the term database…', ready: 'Loaded · change a filter and every chart updates.', running: 'Running SQL…',
    empty: 'No orders match this filter.',
    loadFailed: 'The engine or database could not be downloaded (slow or blocked network). The story above is unaffected; you can also download the database at the end of the page and run the same SQL locally.',
    runFailed: 'The query did not finish — please refresh the page.',
    weeks: 'Weeks', from: 'From week', to: 'To week', week: '', merchants: 'Merchants', areas: 'Dorm areas', reset: 'Clear filters',
    kpi: { orders: 'Orders', net: 'Net revenue', aov: 'Avg order', refund: 'Refund rate', minutes: 'Avg delivery' },
    charts: { heatmap: 'Order times (day × hour)', merchants: 'Net revenue by merchant', delivery: 'Delivery time by dorm area (min)', reasons: 'Refund reasons' },
    viewSql: 'View SQL and result', resultLabel: 'Query result, scrolls sideways',
    clickHint: 'Click a merchant bar or a dorm-area bar to filter by it; click again to clear.',
  },
} as const;

export function kpiText(id: KpiId, v: number | null, lang: Lang): string {
  if (v === null || !Number.isFinite(v)) return '—';
  switch (id) {
    case 'orders': return Math.round(v).toLocaleString('en-US');
    case 'net': return `¥${Math.round(v / 100).toLocaleString('en-US')}`;
    case 'aov': return `¥${(v / 100).toFixed(1)}`;
    case 'refund': return `${v.toFixed(1)}%`;
    case 'minutes': return lang === 'zh' ? `${v.toFixed(1)} 分钟` : `${v.toFixed(1)} min`;
  }
}
