import { describe, it, expect } from 'vitest';
import { kpiText } from '../../src/scripts/cockpit-text';

describe('kpiText', () => {
  it('formats each indicator', () => {
    expect(kpiText('orders', 5142, 'zh')).toBe('5,142');
    expect(kpiText('net', 13989600, 'zh')).toBe('¥139,896');
    expect(kpiText('aov', 2851, 'en')).toBe('¥28.5');
    expect(kpiText('refund', 4.6, 'zh')).toBe('4.6%');
    expect(kpiText('minutes', 26.2, 'zh')).toBe('26.2 分钟');
    expect(kpiText('minutes', 26.2, 'en')).toBe('26.2 min');
  });
  it('shows a dash when there is nothing to measure', () => {
    expect(kpiText('aov', null, 'zh')).toBe('—');
    expect(kpiText('minutes', Number.NaN, 'en')).toBe('—');
  });
});
