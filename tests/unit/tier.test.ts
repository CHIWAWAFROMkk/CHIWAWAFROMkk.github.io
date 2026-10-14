import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickTier, averageFps, watchFps } from '../../src/scripts/motion/tier';

const env = { choice: null, reduced: false, saveData: false, deviceMemory: 8 };

describe('pickTier', () => {
  it('defaults to full', () => expect(pickTier(env)).toBe('full'));
  it('system reduced motion gives gentle, not off', () => expect(pickTier({ ...env, reduced: true })).toBe('gentle'));
  it('save-data or a small device gives lite', () => {
    expect(pickTier({ ...env, saveData: true })).toBe('lite');
    expect(pickTier({ ...env, deviceMemory: 4 })).toBe('lite');
    expect(pickTier({ ...env, deviceMemory: undefined })).toBe('full');
  });
  it("the visitor's choice wins over everything", () => {
    expect(pickTier({ ...env, reduced: true, choice: 'full' })).toBe('full');
    expect(pickTier({ ...env, choice: 'off' })).toBe('off');
    expect(pickTier({ ...env, saveData: true, choice: 'gentle' })).toBe('gentle');
  });
  it('ignores a stored value it does not know', () => expect(pickTier({ ...env, choice: 'turbo' })).toBe('full'));
});

describe('averageFps', () => {
  it('measures frames per second over the run', () => expect(averageFps([0, 50, 100, 150, 200])).toBe(20));
  it('a single stamp is not a measurement', () => expect(averageFps([16])).toBe(Infinity));
});

describe('watchFps', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('does nothing while the page is hidden', () => {
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('localStorage', { getItem: () => null });
    const doc = { visibilityState: 'hidden', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc);
    expect(raf).not.toHaveBeenCalled();
  });
  it('drops a slow full page to lite after the sample', () => {
    let t = 0;
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queue.push(cb); return queue.length; });
    vi.stubGlobal('localStorage', { getItem: () => null });
    const doc = { visibilityState: 'visible', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc, 10);
    while (queue.length) { t += 50; queue.shift()!(t); }          // 20 fps
    expect(doc.documentElement.dataset.motion).toBe('lite');
  });
  it("never overrides the visitor's choice", () => {
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('localStorage', { getItem: () => 'full' });
    const doc = { visibilityState: 'visible', documentElement: { dataset: { motion: 'full' } } } as unknown as Document;
    watchFps(doc);
    expect(raf).not.toHaveBeenCalled();
  });
});
