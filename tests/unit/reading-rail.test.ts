import { describe, it, expect } from 'vitest';
import { activeIndex } from '../../src/scripts/reading-rail';

describe('activeIndex', () => {
  it('nothing before the first section reaches the reading line', () => expect(activeIndex([100, 600, 1200], 50)).toBe(-1));
  it('the last section whose top has passed the line', () => {
    expect(activeIndex([-50, 300, 900], 360)).toBe(1);
    expect(activeIndex([-900, -300, 200], 360)).toBe(2);
  });
});
