import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { localizePath } from '../i18n';

const ORIGIN = 'https://chiwawafromkk.github.io';

/** Kept at the old site's address; robots.txt already points here. */
export const GET: APIRoute = () => {
  const bare = [...new Set(['/', '/brief/', '/projects/', ...SITE.projects.map(p => p.href), '/projects/stock-data/method/', '/privacy/'])];
  const urls = bare.flatMap(p => [localizePath(p, 'zh'), localizePath(p, 'en')]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    urls.map(u => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
