import { describe, it, expect } from 'vitest';
import { scrambleText } from '../../src/scripts/impact';
import { seeded } from '../../src/scripts/cinema/shapes';

describe('scrambleText', () => {
  it('keeps every non-digit and the length', () => {
    const s = scrambleText('¥2,592', 0, seeded(1));
    expect(s).toHaveLength(6);
    expect(s[0]).toBe('¥');
    expect(s[2]).toBe(',');
    expect(s.replace(/\d/g, '0')).toBe('¥0,000');
  });
  it('locks from the left and ends on the original', () => {
    expect(scrambleText('12.5%', 0.6, seeded(2)).slice(0, 3)).toBe('12.');
    expect(scrambleText('¥2,592', 1, seeded(3))).toBe('¥2,592');
  });
});
