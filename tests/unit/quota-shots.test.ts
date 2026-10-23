import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';

const IDS = ['strip', 'card', 'reply', 'approval', 'notch'];
const file = (id: string) => `public/media/quota-deck/hud/${id}.png`;
const size = (b: Buffer) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });
const component = readFileSync('src/components/QuotaShots.astro', 'utf8');

describe('QuotaDeck screenshots (0.6.0 HUD, synthetic data)', () => {
  it('lists the five HUD screenshots in order', () => {
    expect([...component.matchAll(/id: '(\w+)', w: \d+, h: \d+/g)].map(m => m[1])).toEqual(IDS);
  });
  for (const id of IDS) {
    it(`${id}.png is a PNG with transparency, at most 250 KB, sized as the page says`, () => {
      const b = readFileSync(file(id));
      expect(b.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(b[25], 'colour type 6 = RGBA').toBe(6);
      expect(statSync(file(id)).size).toBeLessThanOrEqual(250 * 1024);
      const m = new RegExp(`id: '${id}', w: (\\d+), h: (\\d+)`).exec(component)!;
      expect(size(b)).toEqual({ w: Number(m[1]), h: Number(m[2]) });
    });
  }
  it('the tray-window screenshots of the old version are gone', () => {
    for (const old of ['quota', 'models', 'collab']) expect(existsSync(`public/media/quota-deck/${old}.png`), old).toBe(false);
  });
});
