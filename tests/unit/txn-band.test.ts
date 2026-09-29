import { describe, it, expect } from 'vitest';
import { failedStep, bandFrames, STEPS, STEP_MS } from '../../src/scripts/txn-band';

describe('failedStep', () => {
  it('maps each trigger or core error to the step that raised it, in either language', () => {
    expect(failedStep('place', '份数须为 1–20 的整数')).toBe(-1);
    expect(failedStep('place', '菜品不存在')).toBe(0);
    expect(failedStep('place', '库存不足')).toBe(1);
    expect(failedStep('place', 'Not enough stock')).toBe(1);
    expect(failedStep('place', '价格快照不一致')).toBe(1);
    expect(failedStep('place', 'The payment does not match the order items')).toBe(2);
    expect(failedStep('refund', '订单不存在')).toBe(0);
    expect(failedStep('refund', 'Only undelivered orders can be cancelled and refunded')).toBe(1);
    expect(failedStep('place', 'something else')).toBeNull();
  });
});

describe('bandFrames', () => {
  const last = <T,>(a: T[]) => a[a.length - 1];

  it('success lights every step in order, then commits', () => {
    const f = bandFrames('place');
    expect(f).toHaveLength(STEPS.place.length + 1);
    expect(f[0].states).toEqual(['on', 'idle', 'idle', 'idle', 'idle']);
    expect(f[2].at).toBe(2 * STEP_MS);
    expect(last(f)).toEqual({ at: 5 * STEP_MS, states: ['on', 'on', 'on', 'on', 'on'], result: 'committed' });
  });

  it('a failure lights up to the failing step, marks it, undoes the rest and rolls back', () => {
    const f = bandFrames('place', 1);
    expect(f.map(x => x.states)).toEqual([
      ['on', 'idle', 'idle', 'idle', 'idle'],
      ['on', 'fail', 'idle', 'idle', 'idle'],
      ['idle', 'fail', 'idle', 'idle', 'idle'],
      ['idle', 'fail', 'idle', 'idle', 'idle'],
    ]);
    expect(last(f).result).toBe('rolled-back');
    expect(f.slice(0, -1).every(x => x.result === '')).toBe(true);
  });

  it('a failure at the first step fails it at once and rolls back', () => {
    expect(bandFrames('refund', 0)).toEqual([
      { at: 0, states: ['fail', 'idle', 'idle'], result: '' },
      { at: STEP_MS, states: ['fail', 'idle', 'idle'], result: 'rolled-back' },
    ]);
  });

  it('input rejected before the transaction lights nothing', () => {
    expect(bandFrames('place', -1)).toEqual([{ at: 0, states: ['idle', 'idle', 'idle', 'idle', 'idle'], result: 'rejected' }]);
  });

  it('an unplaceable error just rolls back', () => {
    expect(bandFrames('place', null)).toEqual([{ at: 0, states: ['idle', 'idle', 'idle', 'idle', 'idle'], result: 'rolled-back' }]);
  });
});
