import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const png = (f: string) => readFileSync(`public/media/quota-deck/${f}.png`);
const size = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });

describe('QuotaDeck screenshots', () => {
  for (const view of ['quota', 'models', 'collab']) {
    it(`${view}.png is a portrait PNG of the tray window`, () => {
      const b = png(view);
      expect(b.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      const { w, h } = size(b);
      expect(w).toBeGreaterThanOrEqual(400);
      expect(h).toBeGreaterThan(w);
    });
  }
});
