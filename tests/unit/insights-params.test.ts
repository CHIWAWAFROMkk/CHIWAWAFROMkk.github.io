import { describe, it, expect } from 'vitest';
import { PARAMS } from '../../tools/insights-gen.mjs';
import { paramRows } from '../../src/scripts/insights-params';

describe('generator parameter table', () => {
  for (const lang of ['zh', 'en'] as const) {
    it(`lists every planted parameter (${lang})`, () => {
      const rows = paramRows(PARAMS, lang);
      const covered = new Set(rows.flatMap(r => r.keys));
      expect(Object.keys(PARAMS).filter(k => !covered.has(k))).toEqual([]);
      for (const r of rows) expect(r.value.trim(), r.label).not.toBe('');
    });
  }

  it('shows the weekday weights and the late-night merchant boost', () => {
    const text = paramRows(PARAMS, 'zh').map(r => `${r.label} ${r.value}`).join('\n');
    expect(text).toContain('周六 1.2');
    expect(text).toContain('夜宵烧烤');
    expect(text).toContain(`× ${PARAMS.nightBoost}`);
  });

  it('English rows use English punctuation', () => {
    for (const r of paramRows(PARAMS, 'en')) expect(r.value, r.label).not.toMatch(/[；，]/);
  });
});
