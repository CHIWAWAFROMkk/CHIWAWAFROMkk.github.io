import { describe, it, expect } from 'vitest';
import { SITE } from '../../src/data/site';

// 求职与经历档案 5.3: the user set the theme and direction, chose the art style and the voice-over and confirmed each item;
// the copy was written by AI, the development done by AI, and the quotations checked against scans by an AI researcher.
describe('Jung × Me credits the work as the records do', () => {
  const mine = SITE.pages.jung.summary.mine;
  it('does not claim the copy, the quotation checks, the map design or the edit code', () => {
    expect(mine.zh).not.toMatch(/写文案|核对引文出处|设计星图|写剪辑/);
    expect(mine.en).not.toMatch(/Wrote the copy|checked each quotation|designed the map|wrote the edit/i);
  });
  it('says what the author did and that AI wrote the copy and the code', () => {
    expect(mine.zh).toContain('主题与表达方向');
    expect(mine.zh).toContain('文案与开发由 AI 完成');
    expect(mine.en).toContain('theme and the direction');
    expect(mine.en).toMatch(/copy and development (were )?done by AI/i);
  });
});
