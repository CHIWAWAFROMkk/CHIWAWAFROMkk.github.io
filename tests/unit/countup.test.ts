import { describe, it, expect } from 'vitest';
import { countText } from '../../src/scripts/countup';

describe('countText', () => {
  it('scales the number and keeps its format', () => {
    expect(countText('5,142', 0.5)).toBe('2,571');
    expect(countText('36.8 分钟', 0.5)).toBe('18.4 分钟');
    expect(countText('4.6%', 0)).toBe('0.0%');
    expect(countText('¥1,234', 0.5)).toBe('¥617');
  });
  it('ends exactly on the final text', () => {
    for (const s of ['5,142', '36.8 分钟', '46%', '北区']) expect(countText(s, 1)).toBe(s);
  });
  it('leaves clock times and words alone', () => {
    expect(countText('20:00', 0.3)).toBe('20:00');
    expect(countText('North dorms', 0.3)).toBe('North dorms');
  });
});
