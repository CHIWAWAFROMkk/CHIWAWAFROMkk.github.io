import { describe, it, expect } from 'vitest';
import { localizeError, CSV_ERRORS, DELIVERY_ERRORS } from '../../src/scripts/tool-i18n';

describe('localizeError', () => {
  it('leaves Chinese untouched', () => {
    expect(localizeError('只有表头，没有数据行。', 'zh', CSV_ERRORS)).toBe('只有表头，没有数据行。');
  });
  it('translates fixed CSV messages', () => {
    expect(localizeError('只有表头，没有数据行。', 'en', CSV_ERRORS)).toBe('Only a header row — no data rows.');
  });
  it('translates templated messages and keeps the number', () => {
    expect(localizeError('第 7 条数据记录的列数与表头不一致，请检查分隔符或缺失的逗号。', 'en', CSV_ERRORS))
      .toBe('Record 7 has a different number of columns from the header — check the delimiter or a missing comma.');
  });
  it('translates delivery core errors', () => {
    expect(localizeError('份数须为 1–20 的整数', 'en', DELIVERY_ERRORS)).toBe('Quantity must be a whole number from 1 to 20');
  });
  it('passes through messages it does not know (e.g. SQLite errors)', () => {
    expect(localizeError('no such table: foo', 'en', DELIVERY_ERRORS)).toBe('no such table: foo');
  });
});
