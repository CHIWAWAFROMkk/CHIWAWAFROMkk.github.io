import { describe, it, expect } from 'vitest';
import { matrixPitch } from '../../src/scripts/campus-pipeline';

describe('the included matrix', () => {
  it('fits every cell inside the area, at most 24 px apart', () => {
    for (const [aw, ah, n] of [[420, 310, 24], [420, 310, 1720], [110, 200, 1720], [300, 180, 2036], [60, 40, 5]]) {
      const { pitch, cols } = matrixPitch(aw, ah, n);
      expect(pitch).toBeLessThanOrEqual(24);
      expect(cols * pitch).toBeLessThanOrEqual(aw + 1e-6);
      expect(Math.ceil(n / cols) * pitch).toBeLessThanOrEqual(ah + 1e-6);
    }
  });
  it('uses the full pitch when there are few cells', () => {
    expect(matrixPitch(420, 310, 24)).toEqual({ pitch: 24, cols: 17 });
  });
});
