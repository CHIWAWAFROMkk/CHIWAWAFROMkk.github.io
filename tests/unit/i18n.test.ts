import { describe, it, expect } from 'vitest';
import { localizePath, stripLang, langFromPath } from '../../src/i18n';

describe('localizePath', () => {
  it.each([
    ['/', 'en', '/en/'],
    ['/', 'zh', '/'],
    ['/en/', 'zh', '/'],
    ['/en/', 'en', '/en/'],
    ['/brief/', 'en', '/en/brief/'],
    ['/en/brief/', 'zh', '/brief/'],
    ['/en/brief/', 'en', '/en/brief/'],
    ['/projects/hris-workflow/', 'en', '/en/projects/hris-workflow/'],
    ['/enrich/', 'en', '/en/enrich/'],
  ] as const)('%s → %s = %s', (path, lang, want) => {
    expect(localizePath(path, lang)).toBe(want);
  });
});

describe('stripLang / langFromPath', () => {
  it('only treats /en or /en/… as English', () => {
    expect(stripLang('/en')).toBe('/');
    expect(stripLang('/enrich/')).toBe('/enrich/');
    expect(langFromPath('/en/brief/')).toBe('en');
    expect(langFromPath('/en')).toBe('en');
    expect(langFromPath('/enrich/')).toBe('zh');
    expect(langFromPath('/')).toBe('zh');
  });
});
