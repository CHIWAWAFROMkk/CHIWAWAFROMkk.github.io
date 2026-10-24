import { describe, it, expect } from 'vitest';
import { fact } from '../../src/data/facts';
import { HRIS } from '../../src/data/hris';

describe('the IntelliPro internship on the HRIS site', () => {
  it('is in the ledger as an ongoing headhunting internship', () => {
    expect(fact('F16').text.zh).toContain('因特利普');
    expect(fact('F16').text.zh).toContain('猎头实习生');
    expect(fact('F16').text.zh).toContain('2026.10 至今');
    expect(fact('F16').text.en).toContain('IntelliPro');
    expect(fact('F16').public).toBe(true);
  });
  it('says it supports the whole recruiting cycle, and names no client or candidate', () => {
    const job = HRIS.brief.jobs.find(j => j.fact === 'F16')!;
    const text = JSON.stringify(job.points);
    expect(text).toContain('招聘全流程');
    expect(text).toContain('约面试');
    expect(text).toMatch(/schedul\w+ interviews/);
    expect(text).toMatch(/full recruiting cycle/i);
    expect(text).not.toMatch(/森松|同飞|阿尔西|华为|Morimatsu|Tongfei|Huawei|猎聘|Liepin/);
  });
});
