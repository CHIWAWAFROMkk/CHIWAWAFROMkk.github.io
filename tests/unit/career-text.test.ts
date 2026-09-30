import { describe, it, expect } from 'vitest';
import { CAREER_TEXT, scenarioId, observation } from '../../src/scripts/career-text';

describe('career text', () => {
  it('builds scenario ids like the engine export', () => {
    expect(scenarioId('4', '0')).toBe('4-0');
    expect(scenarioId('unknown', '1')).toBe('unknown-1');
  });
  it('explains the hard gate, the unknown and the confirmation in both languages', () => {
    expect(observation('zh', 3, false)).toContain('59');
    expect(observation('zh', null, false)).toContain('人工确认');
    expect(observation('zh', 4, true)).toContain('Tableau');
    expect(observation('en', 3, false)).toContain('59');
    expect(observation('en', null, true)).toMatch(/confirm/i);
  });
  it('has English for every label the engine emits', () => {
    for (const k of Object.keys(CAREER_TEXT.zh.labels)) expect(CAREER_TEXT.en.labels[k], k).toBeTruthy();
    expect(Object.keys(CAREER_TEXT.en.names)).toEqual(Object.keys(CAREER_TEXT.zh.names));
  });
});
