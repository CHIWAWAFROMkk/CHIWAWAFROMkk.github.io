import { describe, it, expect } from 'vitest';
import { reelProgress, activeIndex } from '../../src/scripts/reel';

describe('reelProgress', () => {
  // Section starts at y=1000, is 2400 px tall, viewport 900 → pinned for 1500 px of scrolling.
  it('is 0 before the reel pins and 1 after it releases', () => {
    expect(reelProgress(0, 1000, 2400, 900)).toBe(0);
    expect(reelProgress(1000, 1000, 2400, 900)).toBe(0);
    expect(reelProgress(2500, 1000, 2400, 900)).toBe(1);
    expect(reelProgress(9999, 1000, 2400, 900)).toBe(1);
  });

  it('moves linearly while pinned', () => {
    expect(reelProgress(1750, 1000, 2400, 900)).toBeCloseTo(0.5);
  });

  it('never divides by zero when the section is not taller than the viewport', () => {
    expect(reelProgress(1200, 1000, 900, 900)).toBe(0);
  });
});

describe('activeIndex', () => {
  it('maps progress onto clip indices without running past the last clip', () => {
    expect(activeIndex(0, 12)).toBe(0);
    expect(activeIndex(0.5, 12)).toBe(6);
    expect(activeIndex(1, 12)).toBe(11);
  });
});
