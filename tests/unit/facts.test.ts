import { describe, it, expect } from 'vitest';
import { FACTS, fact, factCorpus } from '../../src/data/facts';

describe('fact ledger', () => {
  const all = Object.values(FACTS);

  it('has F1–F12 with matching ids', () => {
    expect(all.map(f => f.id)).toEqual(['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']);
    for (const [k, f] of Object.entries(FACTS)) expect(f.id).toBe(k);
  });

  it('every fact is bilingual, sourced and dated', () => {
    for (const f of all) {
      expect(f.text.zh.trim(), f.id).not.toBe('');
      expect(f.text.en.trim(), f.id).not.toBe('');
      expect(f.source.trim(), f.id).not.toBe('');
      expect(f.confirmed, f.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps scale numbers paired with their meaning', () => {
    expect(fact('F6').text.zh).toContain('2000');
    expect(fact('F6').text.zh).toContain('6,000+');
    expect(fact('F8').text.zh).toMatch(/23.*22/);
    expect(fact('F8').text.en).toMatch(/23.*22/);
  });

  it('uses the confirmed availability', () => {
    expect(fact('F3').text.zh).toContain('每周 5 天');
    expect(fact('F3').text.en).toContain('5 days a week');
    expect(fact('F3').text.zh).not.toContain('4–5');
  });

  it('keeps the ranking out of public copy', () => {
    expect(fact('F4').public).toBe(false);
    expect(factCorpus()).not.toContain('5%');
  });

  it('corpus contains every figure', () => {
    for (const f of all) if (f.figure && f.public) expect(factCorpus()).toContain(f.figure);
  });
});
