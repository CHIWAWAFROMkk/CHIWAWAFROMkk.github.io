import { SITE } from './site';
import { fact } from './facts';
import { PROLOGUE_FRAMES } from './jung-prologue';
import type { Lang } from '../i18n';

/** Every film-line project, in site order, with the four stills its strip shows and its status line. */
export function filmEntries(lang: Lang) {
  return SITE.projects.filter(p => p.line === 'film').map(p => {
    if (p.slug === 'mais-je-taime') {
      const stills = SITE.film.clips.filter(c => ['s04', 's06', 's09', 's16'].includes(c.file))
        .map(c => ({ src: `/media/mais-je-taime/video/${c.file}.webp`, alt: `${c.shot} ${c.title[lang]}` }));
      return { project: p, stills, status: fact('F8').text[lang] };
    }
    if (p.slug === 'stark-desk') {
      const names: Record<string, { zh: string; en: string }> = {
        workshop: { zh: '工作室宇宙', en: 'Workshop universe' }, comic1963: { zh: '复古漫画宇宙', en: 'Vintage comic universe' },
        jarvis: { zh: '全息蓝图宇宙', en: 'Holographic blueprint universe' }, inkwash: { zh: '水墨宇宙', en: 'Ink-wash universe' },
      };
      const stills = Object.entries(names).map(([u, alt]) => ({ src: `/media/stark-desk/strip/${u}.webp`, alt: alt[lang] }));
      return { project: p, stills, status: p.status[lang] };
    }
    const stills = [0, 1, 2, 4].map(i => ({ src: `/media/jung-self-map/strip/K${i + 1}.webp`, alt: PROLOGUE_FRAMES[i].alt[lang] }));
    return { project: p, stills, status: p.status[lang] };
  });
}
