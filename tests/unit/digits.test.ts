import { describe, it, expect } from 'vitest';
import { strayTokens } from './digits';
import { factCorpus } from '../../src/data/facts';

describe('strayTokens', () => {
  const corpus = factCorpus();

  it('accepts whole numbers that appear in the ledger', () => {
    expect(strayTokens('约 2000 名员工 · 6,000+ · 每周 5 天 · 12/23', corpus)).toEqual([]);
    expect(strayTokens('专业排名前 5%', corpus)).toEqual(['5%']);
    expect(strayTokens('每周 4–5 天', corpus)).toEqual(['4–5']);
  });

  it('rejects numbers that only appear inside a longer ledger number', () => {
    expect(strayTokens('第 2 页', corpus)).toEqual(['2']);
    expect(strayTokens('提升 20 倍', corpus)).toEqual(['20']);
  });

  it('keeps the percent sign, so 60% is not excused by "60 秒"', () => {
    expect(strayTokens('效率提升 60%', corpus)).toEqual(['60%']);
  });
});
