import { describe, it, expect } from 'vitest';
import { frameCap } from '../../src/scripts/frame-cap';

/** Frames drawn per second when the display calls back at `hz` for two seconds. */
function drawn(hz: number): number {
  const cap = frameCap(), step = 1000 / hz;
  let n = 0;
  for (let t = 1000; t < 3000; t += step) if (cap(t)) n++;
  return n / 2;
}

describe('the 60 fps cap', () => {
  it('keeps about 60 frames a second on every common display, never below 50', () => {
    for (const hz of [75, 90, 120, 144, 165]) {
      expect(drawn(hz), `${hz} Hz`).toBeGreaterThanOrEqual(57);
      expect(drawn(hz), `${hz} Hz`).toBeLessThanOrEqual(61);
    }
  });
  it('draws every frame on 60 Hz and slower displays', () => {
    expect(drawn(60)).toBeGreaterThanOrEqual(59);
    expect(drawn(50)).toBeGreaterThanOrEqual(49);
  });
});
