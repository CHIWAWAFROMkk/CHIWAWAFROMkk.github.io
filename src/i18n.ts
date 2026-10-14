export const LANGS = ['zh', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Bi = { zh: string; en: string };

/** '/en/brief/' → '/brief/'; paths that merely start with "en" are left alone. */
export function stripLang(path: string): string {
  if (path === '/en' || path === '/en/') return '/';
  return path.startsWith('/en/') ? path.slice(3) : path;
}

export function langFromPath(path: string): Lang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh';
}

/** Site-absolute page path in the given language. Chinese is unprefixed. */
export function localizePath(path: string, lang: Lang): string {
  const bare = stripLang(path);
  if (lang === 'zh') return bare;
  return bare === '/' ? '/en/' : `/en${bare}`;
}

export type TrackId = 'ai' | 'hris';

/** Site-absolute page path in a track and a language. The HRIS track lives under /hris/, after the language prefix:
 *  /hris/brief/ and /en/hris/brief/. Use it for pages only, never for /downloads/, /assets/ or /media/. */
export function trackPath(track: TrackId, path: string, lang: Lang): string {
  const bare = stripLang(path);
  return localizePath(track === 'hris' ? (bare === '/' ? '/hris/' : `/hris${bare}`) : bare, lang);
}
