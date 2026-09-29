import { describe, it, expect } from 'vitest';
import { scrollProgress } from '../../src/scripts/scroll-progress';

describe('scrollProgress', () => {
  const vh = 1000, h = 400;
  it('is 0 until the top reaches 85% of the viewport', () => {
    expect(scrollProgress(900, h, vh)).toBe(0);
    expect(scrollProgress(850, h, vh)).toBe(0);
  });
  it('is 1 once the bottom has reached the middle of the viewport', () => {
    expect(scrollProgress(100, h, vh)).toBe(1);
    expect(scrollProgress(-500, h, vh)).toBe(1);
  });
  it('rises linearly in between', () => {
    // from: top 850 → 0; to: top 100 → 1
    expect(scrollProgress(475, h, vh)).toBeCloseTo(0.5);
  });
});
