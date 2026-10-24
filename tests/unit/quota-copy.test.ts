import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE } from '../../src/data/site';
import { QD_HUD_TEXT } from '../../src/scripts/qd-hud-text';

const md = (lang: 'zh' | 'en') => readFileSync(`src/copy/projects/quota-deck.${lang}.md`, 'utf8');
const privacy = (lang: 'zh' | 'en') => readFileSync(`src/copy/privacy.${lang}.md`, 'utf8');
const P = SITE.pages.quota;

describe('QuotaDeck copy follows the released 0.7.0', () => {
  it('names the current release and no older one', () => {
    expect(P.summary.status.zh).toContain('0.7.0');
    expect(P.summary.status.en).toContain('0.7.0');
    const all = JSON.stringify([P, SITE.pages.quotaLive, QD_HUD_TEXT]) + md('zh') + md('en') + readFileSync('src/components/QuotaShots.astro', 'utf8');
    expect(all).not.toMatch(/0\.6\.0|0\.5\.0|974c61d/);
  });
  it('describes game mode as the manual switch it now is, not automatic detection', () => {
    expect(md('zh')).toContain('Ctrl+Alt+H');
    expect(md('en')).toContain('Ctrl+Alt+H');
    expect(md('zh')).not.toMatch(/全屏 3D|自动隐藏/);
    expect(md('en')).not.toMatch(/full-screen 3D|Steam game/i);
  });
});

describe('who did what is stated as the records say', () => {
  it('credits DeepSeek for implementing the approval cards', () => {
    expect(P.summary.tools.zh).toContain('DeepSeek');
    expect(P.summary.tools.en).toContain('DeepSeek');
    expect(md('zh')).toContain('DeepSeek');
    expect(md('en')).toContain('DeepSeek');
  });
  it('does not present the approval acceptance as the author’s own', () => {
    expect(P.summary.mine.zh).not.toContain('批准流程');
    expect(P.summary.mine.en).not.toMatch(/approval flow/i);
  });
  it('the English credit says the interface is copied, as the Chinese 复刻 does', () => {
    expect(QD_HUD_TEXT.zh.credit).toContain('复刻');
    expect(QD_HUD_TEXT.en.credit).not.toMatch(/modelled on/i);
    expect(QD_HUD_TEXT.en.credit).toMatch(/cop(y|ies|ied)/i);
  });
});

describe('no page still describes the old live edition', () => {
  it('the privacy page speaks of the HUD demo, not a parallel hand-off or simulated models and tasks', () => {
    for (const lang of ['zh', 'en'] as const) {
      const lines = privacy(lang).split('\n').filter(l => l.includes('QuotaDeck'));
      expect(lines.length, lang).toBeGreaterThan(0);
      for (const l of lines) expect(l, lang).not.toMatch(/并行|模型和任务|parallel|model and task/i);
    }
  });
  it('Plate 02 no longer cites the simulator of the old live demo as its source', () => {
    expect(readFileSync('src/components/PlateQuota.astro', 'utf8')).not.toMatch(/网页演示所用模拟器|simulator the live demo runs/);
  });
});
