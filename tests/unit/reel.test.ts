import { describe, it, expect } from 'vitest';
import { edgeSpeed, activeIndex } from '../../src/scripts/reel';

describe('edgeSpeed', () => {
  // Screen spans x = 100…1100; the edge zones are the outer 18% on each side.
  it('is zero across the middle of the screen', () => {
    expect(edgeSpeed(600, 100, 1000)).toBe(0);
    expect(edgeSpeed(300, 100, 1000)).toBe(0);
  });

  it('scrolls right near the right edge and left near the left edge', () => {
    expect(edgeSpeed(1090, 100, 1000)).toBeGreaterThan(0);
    expect(edgeSpeed(110, 100, 1000)).toBeLessThan(0);
  });

  it('gets faster the closer the pointer is to the edge, up to the maximum', () => {
    expect(edgeSpeed(1099, 100, 1000)).toBeGreaterThan(edgeSpeed(1000, 100, 1000));
    expect(edgeSpeed(5000, 100, 1000)).toBe(14);
    expect(edgeSpeed(-5000, 100, 1000)).toBe(-14);
  });
});

describe('activeIndex', () => {
  it('maps progress onto clip indices without running past the last clip', () => {
    expect(activeIndex(0, 12)).toBe(0);
    expect(activeIndex(0.5, 12)).toBe(6);
    expect(activeIndex(1, 12)).toBe(11);
  });
});
