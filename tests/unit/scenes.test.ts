import { describe, it, expect } from 'vitest';
import { pickScene } from '../../src/scripts/scenes';

describe('pickScene', () => {
  // Section headings at these viewport-relative tops; the reading line sits at 300 px.
  it('shows the scene of the last heading that has passed the reading line', () => {
    expect(pickScene([500, 1200, 2000], 300, 5)).toBe(1);
    expect(pickScene([200, 1200, 2000], 300, 5)).toBe(1);
    expect(pickScene([-900, 250, 2000], 300, 5)).toBe(2);
    expect(pickScene([-3000, -2000, -100], 300, 5)).toBe(3);
  });

  it('holds the last scene for any extra sections', () => {
    expect(pickScene([-6, -5, -4, -3, -2, -1], 300, 5)).toBe(5);
  });
});
