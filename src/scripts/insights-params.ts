import type { Lang } from '../i18n';
import { merchantName, areaName, reasonName } from './insights-names';

type Pair = [string, number];
/** The shape of PARAMS in tools/insights-gen.mjs. */
export interface GenParams {
  seed: number; termStart: string; weeks: number; students: number;
  areas: [string, number, number][]; freshmanShare: number;
  retention: { fresh: number[]; later: number[] };
  appetite: [number, number][]; dayWeights: number[]; hourWeights: Record<string, number>;
  lateBoost: number; peakHours: number[]; peakExtraMinutes: number; spreadMinutes: number;
  cancel: { base: number; peak: number; far: number };
  reasons: { peak: Pair[]; calm: Pair[] };
  merchants: [string, number, number[]][]; nightMerchant: number; nightBoost: number;
}
export interface ParamRow { keys: string[]; label: string; value: string }

const DAYS = { zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

/** Every generator parameter as a readable row; `keys` names the PARAMS fields a row shows, so tests can prove none is missing. */
export function paramRows(P: GenParams, lang: Lang): ParamRow[] {
  const zh = lang === 'zh';
  const list = (items: string[]) => items.join(zh ? '；' : '; ');
  const row = (keys: string[], label: [string, string], value: string): ParamRow => ({ keys, label: zh ? label[0] : label[1], value });
  const night = merchantName(P.merchants[P.nightMerchant][0], lang);
  return [
    row(['termStart', 'weeks'], ['学期', 'Term'], zh ? `${P.termStart} 起，${P.weeks} 周` : `${P.weeks} weeks from ${P.termStart}`),
    row(['students'], ['学生', 'Students'], String(P.students)),
    row(['areas'], ['宿舍区（基础送达分钟 · 学生占比）', 'Dorm areas (base minutes · share of students)'], list(P.areas.map(([a, m, s]) => `${areaName(a, lang, true)} ${m} · ${pct(s)}`))),
    row(['spreadMinutes'], ['送达时间的随机波动（标准差，分钟）', 'Random spread of delivery time (standard deviation, min)'], String(P.spreadMinutes)),
    row(['freshmanShare'], ['开学头两周加入的学生占比', 'Share joining in the first two weeks'], pct(P.freshmanShare)),
    row(['retention'], ['加入后下单兴趣的衰减（下限 + 幅度 × e^(−周数 / 时间常数)）', 'Interest after joining (floor + span × e^(−weeks / time constant))'],
      list([`${zh ? '头两周加入' : 'first two weeks'} ${P.retention.fresh.join(' / ')}`, `${zh ? '之后加入' : 'later'} ${P.retention.later.join(' / ')}`])),
    row(['appetite'], ['每周下单强度（次数 · 学生占比）', 'Weekly ordering (orders · share)'], list(P.appetite.map(([n, s]) => `${n} · ${pct(s)}`))),
    row(['dayWeights'], ['星期权重', 'Weekday weights'], P.dayWeights.map((w, i) => `${DAYS[lang][i]} ${w}`).join(' · ')),
    row(['hourWeights'], ['各小时权重', 'Hour weights'], Object.entries(P.hourWeights).map(([h, w]) => `${h}:00 ${w}`).join(' · ')),
    row(['lateBoost'], ['周五、周六夜宵时段（21:00 起）加成', 'Friday/Saturday late-night boost (from 21:00)'], `× ${P.lateBoost}`),
    row(['peakHours', 'peakExtraMinutes'], ['高峰时段与额外送达分钟', 'Peak hours and extra minutes'], list([P.peakHours.map(h => `${h}:00`).join(' · '), `+${P.peakExtraMinutes}`])),
    row(['cancel'], ['取消概率（基础 · 高峰加 · 北区加）', 'Cancellation (base · peak extra · North extra)'], `${pct(P.cancel.base)} · ${pct(P.cancel.peak)} · ${pct(P.cancel.far)}`),
    row(['reasons'], ['退款原因（高峰 / 平时）', 'Refund reasons (peak / off-peak)'],
      `${list(P.reasons.peak.map(([r, s]) => `${reasonName(r, lang)} ${pct(s)}`))} / ${list(P.reasons.calm.map(([r, s]) => `${reasonName(r, lang)} ${pct(s)}`))}`),
    row(['merchants'], ['商家热度权重', 'Merchant popularity weights'], P.merchants.map(([m, w]) => `${merchantName(m, lang)} ${w}`).join(' · ')),
    row(['nightMerchant', 'nightBoost'], ['夜宵商家（21:00 起热度加成）', 'Late-night merchant (popularity boost from 21:00)'], `${night} × ${P.nightBoost}`),
    row(['seed'], ['随机种子', 'Random seed'], String(P.seed)),
  ];
}
