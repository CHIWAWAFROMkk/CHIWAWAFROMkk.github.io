import type { Lang } from '../i18n';
import { areaName, reasonName } from './insights-names';

export type Rows = (number | string)[][];
export interface QueryResult { columns: string[]; values: Rows }
export type QueryId = 'kpi' | 'heatmap' | 'merchants' | 'retention' | 'delivery' | 'slow' | 'reasons' | 'cancelByHour';
export type Results = Record<QueryId, QueryResult>;
export type Kind = 'int' | 'pct' | 'pp' | 'min' | 'hour' | 'dow' | 'times' | 'area' | 'reason';
export interface Fact { value: number | string; kind: Kind }

/** Definitions behind the story's sentences; the copy names them in words ("the first two weeks", "four weeks later"). */
export const DEF = { lunch: [11, 12], dinner: [17, 18], freshWeeks: 2, retainAfter: 4, lastCohort: 12, slowLine: 45, paretoLine: 80 } as const;

const num = (v: unknown) => Number(v);
const sum = (rows: Rows, col: number) => rows.reduce((s, r) => s + num(r[col]), 0);
const share = (a: number, b: number) => (b ? (a / b) * 100 : 0);

/** Every number the story prints, derived from the committed query results. */
export function deriveFacts(r: Results): Record<string, Fact> {
  const f = (value: number | string, kind: Kind): Fact => ({ value, kind });
  const [orders, , , refundPct] = r.kpi.values[0].map(num);
  const inHours = (hs: readonly number[]) => r.heatmap.values.filter(x => hs.includes(num(x[1]))).reduce((s, x) => s + num(x[2]), 0);
  const busiest = r.heatmap.values.reduce((a, b) => (num(b[2]) > num(a[2]) ? b : a), r.heatmap.values[0] ?? [0, 0, 0]);

  const m = r.merchants.values;
  const net = sum(m, 3);
  let acc = 0, for80 = 0;
  for (const x of m) { acc += num(x[3]); for80++; if (share(acc, net) >= DEF.paretoLine) break; }

  const sizes = new Map<number, number>();
  r.retention.values.forEach(x => sizes.set(num(x[0]), num(x[2])));
  const retained = (lo: number, hi: number) => {
    const cohorts = [...sizes.keys()].filter(c => c >= lo && c <= hi);
    const kept = r.retention.values.filter(x => num(x[1]) === DEF.retainAfter && cohorts.includes(num(x[0]))).reduce((s, x) => s + num(x[3]), 0);
    return share(kept, cohorts.reduce((s, c) => s + (sizes.get(c) ?? 0), 0));
  };
  const fresh = retained(1, DEF.freshWeeks);
  const later = retained(DEF.freshWeeks + 1, DEF.lastCohort);

  const slow = [...r.slow.values].sort((a, b) => num(a[3]) - num(b[3]));
  const near = slow[0] ?? ['', 0, 0, 0];
  const far = slow[slow.length - 1] ?? ['', 0, 0, 0];
  const rest = slow.slice(0, -1);

  const peakHours: number[] = [...DEF.lunch, ...DEF.dinner];
  const cb = r.cancelByHour.values;
  const pk = cb.filter(x => peakHours.includes(num(x[0])));
  const peakCancel = share(sum(pk, 2), sum(pk, 1));
  const calmCancel = share(sum(cb, 2) - sum(pk, 2), sum(cb, 1) - sum(pk, 1));

  const reasons = r.reasons.values;
  const lunchShare = share(inHours(DEF.lunch), orders);
  const dinnerShare = share(inHours(DEF.dinner), orders);

  return {
    orders: f(orders, 'int'),
    students: f([...sizes.values()].reduce((a, b) => a + b, 0), 'int'),
    merchants: f(m.length, 'int'),
    weeks: f(Math.max(0, ...r.retention.values.map(x => num(x[0]) + num(x[1]))), 'int'),
    lunchStart: f(DEF.lunch[0], 'hour'),
    lunchEnd: f(DEF.lunch[DEF.lunch.length - 1] + 1, 'hour'),
    dinnerStart: f(DEF.dinner[0], 'hour'),
    dinnerEnd: f(DEF.dinner[DEF.dinner.length - 1] + 1, 'hour'),
    lunchShare: f(lunchShare, 'pct'),
    dinnerShare: f(dinnerShare, 'pct'),
    peakShare: f(lunchShare + dinnerShare, 'pct'),
    busiestDow: f(num(busiest[0]), 'dow'),
    busiestHour: f(num(busiest[1]), 'hour'),
    busiestCount: f(num(busiest[2]), 'int'),
    top3Share: f(share(m.slice(0, 3).reduce((s, x) => s + num(x[3]), 0), net), 'pct'),
    merchantsFor80: f(for80, 'int'),
    paretoLine: f(DEF.paretoLine, 'pct'),
    freshRetention: f(fresh, 'pct'),
    laterRetention: f(later, 'pct'),
    retentionGap: f(fresh - later, 'pp'),
    farArea: f(String(far[0]), 'area'),
    nearArea: f(String(near[0]), 'area'),
    farMinutes: f(num(far[3]), 'min'),
    nearMinutes: f(num(near[3]), 'min'),
    gapMinutes: f(Math.round((num(far[3]) - num(near[3])) * 10) / 10, 'min'),
    slowLine: f(DEF.slowLine, 'min'),
    farOver45: f(share(num(far[2]), num(far[1])), 'pct'),
    restOver45: f(share(sum(rest, 2), sum(rest, 1)), 'pct'),
    refundPct: f(refundPct, 'pct'),
    topReason: f(String(reasons[0]?.[0] ?? ''), 'reason'),
    topReasonShare: f(share(num(reasons[0]?.[1] ?? 0), sum(reasons, 1)), 'pct'),
    peakCancel: f(peakCancel, 'pct'),
    calmCancel: f(calmCancel, 'pct'),
    cancelRatio: f(calmCancel ? peakCancel / calmCancel : 0, 'times'),
  };
}

const DOW = {
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export function formatFact(f: Fact, lang: Lang): string {
  const n = Number(f.value);
  switch (f.kind) {
    case 'int': return Math.round(n).toLocaleString('en-US');
    case 'pct': return `${n >= 10 ? Math.round(n) : n.toFixed(1)}%`;
    case 'pp': return String(Math.round(n));
    case 'min': { const s = Number.isInteger(n) ? String(n) : n.toFixed(1); return lang === 'zh' ? `${s} 分钟` : `${s} min`; }
    case 'hour': return `${String(n).padStart(2, '0')}:00`;
    case 'dow': return DOW[lang][n];
    case 'times': return n.toFixed(1);
    case 'area': return areaName(String(f.value), lang);
    case 'reason': return reasonName(String(f.value), lang);
  }
}
