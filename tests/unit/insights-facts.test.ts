import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';
import { INSIGHTS_COPY } from '../../src/data/insights-copy';
import { merchantLegend, reasonLegend, areaName } from '../../src/scripts/insights-names';

// A tiny hand-checkable result set.
const FIXTURE: Results = {
  kpi: { columns: [], values: [[200, 500000, 2600, 5, 25.3]] },
  heatmap: { columns: [], values: [[0, 11, 40], [0, 12, 20], [5, 12, 50], [2, 17, 30], [3, 20, 60]] },
  merchants: { columns: [], values: [[1, '南门小厨', 80, 300000], [2, '二食堂面馆', 60, 100000], [3, '麻辣香锅', 40, 60000], [4, '黄焖鸡米饭', 20, 40000]] },
  retention: { columns: [], values: [[1, 0, 10, 10], [1, 4, 10, 6], [2, 4, 10, 4], [3, 0, 5, 5], [3, 4, 5, 1], [5, 4, 5, 2]] },
  delivery: { columns: [], values: [] },
  slow: { columns: [], values: [['东区', 100, 2, 20], ['西区', 50, 1, 24.5], ['北区', 50, 10, 35.5]] },
  reasons: { columns: [], values: [['等待太久', 6], ['点错了', 3], ['临时有事', 1]] },
  cancelByHour: { columns: [], values: [[11, 50, 4], [12, 50, 4], [17, 20, 2], [19, 80, 2]] },
};

describe('deriveFacts + formatFact', () => {
  const f = deriveFacts(FIXTURE);
  const zh = (k: string) => formatFact(f[k], 'zh');
  const en = (k: string) => formatFact(f[k], 'en');

  it('counts and shares', () => {
    expect([zh('orders'), zh('students'), zh('merchants'), zh('weeks')]).toEqual(['200', '30', '4', '9']);
    expect([zh('lunchShare'), zh('dinnerShare'), zh('peakShare')]).toEqual(['55%', '15%', '70%']);
    expect([zh('lunchStart'), zh('lunchEnd'), zh('dinnerStart'), zh('dinnerEnd')]).toEqual(['11:00', '13:00', '17:00', '19:00']);
    expect([zh('busiestDow'), en('busiestDow'), zh('busiestHour'), zh('busiestCount')]).toEqual(['周四', 'Thursday', '20:00', '60']);
    expect([zh('top3Share'), zh('merchantsFor80'), zh('paretoLine')]).toEqual(['92%', '2', '80%']);
  });

  it('retention compares the first two weeks with later cohorts', () => {
    expect([zh('freshRetention'), zh('laterRetention'), zh('retentionGap')]).toEqual(['50%', '30%', '20']);
  });

  it('delivery speed by dorm area', () => {
    expect([zh('farArea'), en('farArea'), zh('nearArea')]).toEqual(['北区', 'North dorms', '东区']);
    expect([zh('farMinutes'), en('farMinutes'), zh('nearMinutes'), zh('gapMinutes'), zh('slowLine')]).toEqual(['35.5 分钟', '35.5 min', '20 分钟', '15.5 分钟', '45 分钟']);
    expect([zh('farOver45'), zh('restOver45')]).toEqual(['20%', '2.0%']);
  });

  it('refunds and cancellations', () => {
    expect([zh('refundPct'), zh('topReason'), en('topReason'), zh('topReasonShare')]).toEqual(['5.0%', '等待太久', 'Waited too long', '60%']);
    expect([zh('peakCancel'), zh('calmCancel'), zh('cancelRatio')]).toEqual(['8.3%', '2.5%', '3.3']);
  });

  it('legends', () => {
    expect(merchantLegend(FIXTURE.merchants.values, 'zh')).toEqual(['南门小厨 ¥3,000', '二食堂面馆 ¥1,000', '麻辣香锅 ¥600']);
    expect(merchantLegend(FIXTURE.merchants.values, 'en')[0]).toBe('South Gate Kitchen ¥3,000');
    expect(reasonLegend(FIXTURE.reasons.values, 'en')).toEqual(['■ Waited too long 6', '■ Ordered by mistake 3', '■ Something came up 1']);
    expect(areaName('北区', 'en', true)).toBe('North');
  });
});

describe('insights copy', () => {
  const real = deriveFacts(JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results);
  const templates: { zh: string; en: string }[] = [
    INSIGHTS_COPY.hero.big, INSIGHTS_COPY.hero.sub,
    ...INSIGHTS_COPY.chapters.flatMap(c => [c.q, c.a, ...(c.note ? [c.note] : []), ...(c.recs ?? [])]),
  ];
  const keys = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]))].sort();

  it('has six chapters, the last with three suggestions', () => {
    expect(INSIGHTS_COPY.chapters).toHaveLength(6);
    expect(INSIGHTS_COPY.chapters[5].recs).toHaveLength(3);
  });

  it('never hand-types a number: every digit comes from a placeholder', () => {
    for (const t of templates) for (const s of [t.zh, t.en]) expect(s.replace(/\{\w+\}/g, ''), s).not.toMatch(/\d/);
  });

  it('every placeholder is a derived fact, and both languages use the same ones', () => {
    for (const t of templates) {
      for (const k of keys(t.zh)) expect(real, k).toHaveProperty(k);
      expect(keys(t.en), t.zh).toEqual(keys(t.zh));
    }
  });

  it('derived numbers agree with the parts printed next to them', () => {
    const n = (k: string) => parseFloat(formatFact(real[k], 'zh'));
    expect(formatFact(real.cancelRatio, 'zh')).toBe((n('peakCancel') / n('calmCancel')).toFixed(1));
    expect(n('retentionGap')).toBe(n('freshRetention') - n('laterRetention'));
    expect(n('peakShare')).toBe(n('lunchShare') + n('dinnerShare'));
  });

  it('the real data tells the story the copy claims', () => {
    const v = (k: string) => Number(real[k].value);
    expect(v('peakCancel')).toBeGreaterThan(v('calmCancel'));
    expect(v('freshRetention')).toBeGreaterThan(v('laterRetention'));
    expect(v('farMinutes')).toBeGreaterThan(v('nearMinutes'));
    expect(v('top3Share')).toBeGreaterThan(50);
    expect(real.topReason.value).toBe('等待太久'); // chapter 6 suggestion 2 relies on it
  });
});
