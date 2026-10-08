import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FACTS } from '../../src/data/facts';
import { SITE } from '../../src/data/site';

it('keeps the download aligned with public HRIS dates and version boundaries', () => {
  const download = readFileSync('public/downloads/hris/HRIS方案.md', 'utf8');
  for (const id of ['F5', 'F14'] as const) {
    const date = FACTS[id].text.zh.match(/2026\.\d{2}—(?:2026\.)?\d{2}/)?.[0];
    expect(date, `${id} must expose the confirmed date`).toBeTruthy();
    expect(download).toContain(date);
  }
  const versions = [
    { heading: '第一版（个人实践）', tools: ['OpenClaw', 'DeepSeek', 'ChatGPT'] },
    { heading: '第二版', tools: ['本地 OCR', 'DeepSeek'] },
    { heading: '最终版（企业交付）', tools: ['Copilot', 'Power Automate', 'SharePoint', 'AI Builder'] },
  ];
  const sections = download.split(/^### /m);
  for (const version of versions) {
    const section = sections.find(text => text.startsWith(version.heading));
    expect(section, version.heading).toBeTruthy();
    for (const tool of version.tools) {
      expect(SITE.pages.hris.summary.tools.zh).toContain(tool);
      expect(section).toContain(tool);
    }
    if (version.heading !== '最终版（企业交付）') expect(section).not.toContain('400+');
  }
  expect(sections.find(text => text.startsWith('最终版（企业交付）'))).toContain('400+/日');
  expect(download).toContain('交接给 mentor');
  expect(download).toContain('不逐项代表已部署功能');
});
