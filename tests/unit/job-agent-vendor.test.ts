import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/py/job-agent/4397ded';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('vendored job agent engine', () => {
  it('is pinned to the public commit', () => {
    expect(manifest().commit).toBe('4397ded9c603e7e26d3dc241eb910ce3ad0a749a');
  });
  it('every file matches its recorded SHA-256', () => {
    for (const f of manifest().files) expect(createHash('sha256').update(readFileSync(`${DIR}/${f.path}`)).digest('hex'), f.path).toBe(f.sha256);
  });
  it('carries the 16 engine modules, the fictional candidate and the licence', () => {
    const paths = manifest().files.map((f: { path: string }) => f.path);
    expect(paths.filter((p: string) => p.startsWith('job_agent/'))).toHaveLength(16);
    expect(paths).toContain('tests/helpers.py');
    expect(paths).toContain('LICENSE');
  });
  it('the cap lines the page quotes are still at 697-702', () => {
    const lines = readFileSync(`${DIR}/job_agent/services/local_matcher.py`, 'utf8').split('\n');
    expect(lines[697]).toContain('_cap_breakdown(breakdown, 59)');
    expect(lines[699]).toContain('_cap_breakdown(breakdown, 84)');
    expect(lines[701]).toContain('score = breakdown.total');
  });
});
