import type { Lang } from '../i18n';

type Rows = (number | string)[][];

export const MERCHANT_EN: Record<string, string> = {
  南门小厨: 'South Gate Kitchen', 二食堂面馆: 'Canteen Two Noodles', 麻辣香锅: 'Mala Stir-pot', 黄焖鸡米饭: 'Braised Chicken Rice',
  川味小馆: 'Sichuan Corner', 粤式烧腊: 'Cantonese Roast', 韩式拌饭: 'Bibimbap Bar', 轻食窗口: 'Light Bites',
  西北面食: 'Northwest Noodles', 煎饼果子: 'Jianbing Stall', 校园茶点: 'Campus Tea', 夜宵烧烤: 'Late-night BBQ',
};
export const AREA_EN: Record<string, string> = { 东区: 'East dorms', 西区: 'West dorms', 南区: 'South dorms', 北区: 'North dorms' };
export const AREA_LABEL_EN: Record<string, string> = { 东区: 'East', 西区: 'West', 南区: 'South', 北区: 'North' };
export const REASON_EN: Record<string, string> = { 等待太久: 'Waited too long', 点错了: 'Ordered by mistake', 商家缺货: 'Out of stock', 临时有事: 'Something came up' };

export const merchantName = (zh: string, lang: Lang) => (lang === 'zh' ? zh : MERCHANT_EN[zh] ?? zh);
export const areaName = (zh: string, lang: Lang, short = false) => (lang === 'zh' ? zh : (short ? AREA_LABEL_EN : AREA_EN)[zh] ?? zh);
export const reasonName = (zh: string, lang: Lang) => (lang === 'zh' ? zh : REASON_EN[zh] ?? zh);

const yuan = (cents: number) => `¥${Math.round(cents / 100).toLocaleString('en-US')}`;

/** The three merchants with the most net revenue (rows already sorted), for the chart legend. */
export function merchantLegend(values: Rows, lang: Lang): string[] {
  return values.slice(0, 3).map(r => `${merchantName(String(r[1]), lang)} ${yuan(Number(r[3]))}`);
}

/** One legend line per refund reason; the square is coloured by the chart. */
export function reasonLegend(values: Rows, lang: Lang): string[] {
  return values.map(r => `■ ${reasonName(String(r[0]), lang)} ${r[1]}`);
}
