import { describe, it, expect } from 'vitest';
import { sampleTargets, makeDots, dotAt, FALL, DURATION } from '../../src/scripts/rain';

describe('rain', () => {
  it('samples only opaque pixels', () => {
    const w = 8, h = 8, alpha = new Uint8ClampedArray(w * h * 4);
    alpha[(4 * w + 4) * 4 + 3] = 255; // one opaque pixel at (4, 4)
    const pts = sampleTargets(alpha, w, h, 5);
    expect(pts).toHaveLength(5);
    expect(pts.every(([x, y]) => x === 4 && y === 4)).toBe(true);
    expect(sampleTargets(new Uint8ClampedArray(w * h * 4), w, h, 5)).toEqual([]);
  });

  it('dots start above, fall, then land exactly on their targets', () => {
    const [d] = makeDots([[100, 50]], 400, 300);
    expect(dotAt(d, 0)).toEqual([d.sx, d.sy]);
    expect(d.sy).toBeLessThanOrEqual(0);
    expect(dotAt(d, FALL / 2)[1]).toBeGreaterThan(d.sy);
    expect(dotAt(d, DURATION)).toEqual([100, 50]);
    expect(dotAt(d, DURATION + 500)).toEqual([100, 50]);
  });

  it('is deterministic', () => {
    expect(makeDots([[1, 2], [3, 4]], 400, 300)).toEqual(makeDots([[1, 2], [3, 4]], 400, 300));
  });
});
