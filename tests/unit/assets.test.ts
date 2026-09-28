import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('shipped runtime files', () => {
  it('the CSV module on the site is byte-identical to the one in the download package', () => {
    expect(readFileSync('src/scripts/analysis-core.mjs')).toEqual(readFileSync('public/downloads/source/analysis-core.mjs'));
  });

  it('diagrams use only the site palette', () => {
    const allowed = new Set(['#0f0f0f', '#6b6a64', '#a39c8f', '#d9d7cf', '#e6e5de', '#f2f1ec', '#f6d5ca', '#e8380d', '#ffffff', '#fff']);
    for (const f of ['delivery-relations', 'csv-process']) {
      const svg = readFileSync(`public/assets/editorial/${f}.svg`, 'utf8');
      for (const c of svg.match(/#[0-9a-f]{3,6}\b/gi) ?? []) expect(allowed, `${f}: ${c}`).toContain(c.toLowerCase());
    }
  });
});
