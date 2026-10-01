import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'public/assets/quotadeck/e9557c6';
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));

describe('vendored QuotaDeck', () => {
  it('is pinned to the public commit and version', () => {
    expect(manifest()).toMatchObject({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: 'e9557c62f00a085299e5d3d06e9259ed19688ef8', version: '0.5.0-rc.5' });
  });
  it('carries the tray interface, the quota logic and the licence — nothing else', () => {
    expect(manifest().files.map((f: { path: string }) => f.path)).toEqual(['src/renderer/compact.html', 'src/renderer/compact.css', 'src/renderer/compact.js',
      'src/main/snapshot.cjs', 'src/main/quota-history.cjs', 'src/main/model-guidance.cjs', 'LICENSE']);
  });
  it('every file matches its recorded SHA-256 and size', () => {
    for (const f of manifest().files) {
      const bytes = readFileSync(`${DIR}/${f.path}`);
      expect(createHash('sha256').update(bytes).digest('hex'), f.path).toBe(f.sha256);
      expect(bytes.length, f.path).toBe(f.bytes);
    }
  });
  it('the lines the page quotes (quota-history.cjs 50–61) are still the burn-rate estimate', () => {
    const lines = readFileSync(`${DIR}/src/main/quota-history.cjs`, 'utf8').split('\n');
    expect(lines[49]).toContain('let series = rows.filter(r => r.key === key && r.at >= now - 3600000);');
    expect(lines[56]).toContain('bucket.burnPerHour = (first.value - value) * 100');
    expect(lines[59]).toContain('if (hours !== null && hours < untilReset) bucket.estimatedHoursLeft = hours;');
  });
  it('QuotaDeck still refreshes every minute and samples only Antigravity', () => {
    expect(readFileSync(`${DIR}/src/main/snapshot.cjs`, 'utf8')).toContain("if (history && result.id === 'antigravity') {");
  });
});
