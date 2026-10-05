import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('shipped runtime files', () => {
  it('the CSV module on the site is byte-identical to the one in the download package', () => {
    expect(readFileSync('src/scripts/analysis-core.mjs')).toEqual(readFileSync('public/downloads/source/analysis-core.mjs'));
  });

  it('diagrams use only the site palette', () => {
    const allowed = new Set(['#0f0f0f', '#6b6a64', '#a39c8f', '#d9d7cf', '#e6e5de', '#f2f1ec', '#f6d5ca', '#e8380d', '#ffffff', '#fff']);
    for (const f of ['delivery-relations', 'csv-process', 'hris-flow', 'career-evidence', 'quota-pools', 'campus-method', 'jung-map']) {
      const svg = readFileSync(`public/assets/editorial/${f}.svg`, 'utf8');
      for (const c of svg.match(/#[0-9a-f]{3,6}\b/gi) ?? []) expect(allowed, `${f}: ${c}`).toContain(c.toLowerCase());
    }
  });

  it('the job agent replay ships its six engine scenarios', () => {
    const demo = JSON.parse(readFileSync('public/assets/job-agent-demo.json', 'utf8'));
    expect(demo.scenarios.map((s: { id: string }) => s.id)).toEqual(['4-0', '4-1', '3-0', '3-1', 'unknown-0', 'unknown-1']);
    expect(demo.sourceCommit).toBe('4397ded9c603e7e26d3dc241eb910ce3ad0a749a');
    expect(demo.scenarios.map((s: { match: { overall_score: number } }) => s.match.overall_score)).toEqual([84, 84, 59, 59, 83, 84]);
  });
});
