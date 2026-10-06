import { describe, it, expect } from 'vitest';
import { countableSegments } from '../../src/scripts/motion/countable';

const counted = (t: string) => countableSegments(t).filter(s => s.count).map(s => s.text);

describe('which numbers count up', () => {
  it('counts quantities with a unit', () => {
    expect(counted('核查约 2000 名员工的档案主数据')).toEqual(['2000']);
    expect(counted('60 秒成片完成：出片 23 段，成片用 22 段')).toEqual(['23', '22']);
    expect(counted('Reviewed master records for about 2000 employees')).toEqual(['2000']);
    expect(counted('about 2,000 employees')).toEqual(['2,000']);
    expect(counted('60-second film finished: 23 clips generated, 22 in the cut')).toEqual(['23', '22']);
  });
  it('leaves dates, years, ranges, decimals, percentages, times and small numbers alone', () => {
    for (const t of ['2027 届', '2026.08 至今', '2024.03—2024.07', '退款率 12.5%', '60 秒', '8 张业务表', 'in 2024 the team', '12:00', '3 to 5 days', 'v1.12'])
      expect(counted(t), t).toEqual([]);
  });
  it('keeps the whole text in order', () => {
    const t = '出片 23 段，成片用 22 段';
    expect(countableSegments(t).map(s => s.text).join('')).toBe(t);
  });
});
