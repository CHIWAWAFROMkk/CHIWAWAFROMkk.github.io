import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const ledger = readFileSync('public/downloads/campus/evidence.md', 'utf8');

describe('campus evidence ledger', () => {
  it('gives every one of its 17 sources a title and an original link, instead of pointing at an unpublished report', () => {
    const refs = ledger.slice(ledger.indexOf('## 参考资料与原始链接'));
    const rows = [...refs.matchAll(/^\| (\d+) \| (.+?) \| <(https:\/\/[^>]+)> \|$/gm)];
    expect(rows.map(r => Number(r[1]))).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(ledger).not.toContain('研究报告_文献增强版');
  });

  it('says it is a 2026 rebuild, not an original from the 2024 project', () => {
    expect(ledger).toContain('2026 年为作品集重建');
  });
});

describe('campus page copy', () => {
  for (const [lang, heading] of [['zh', '哪些是 2024 年的，哪些是 2026 年的'], ['en', 'What dates from 2024, and what from 2026']] as const) {
    it(`separates the 2024 project from the 2026 rebuild (${lang})`, () => {
      const md = readFileSync(`src/copy/projects/ai-campus.${lang}.md`, 'utf8');
      expect(md).toContain(heading);
      expect(md).toContain('2024.03—2024.07');
    });
  }
});
