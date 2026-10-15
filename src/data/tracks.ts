import { SITE, type ProjectEntry } from './site';
import { HRIS } from './hris';
import type { Bi, TrackId } from '../i18n';

/** The main site (ai) and the HRIS fallback (hris, under /hris/). */
export type Track = TrackId;

/** Project order per track (spec §2 and §4.3). */
export const TRACK_ORDER: Record<Track, readonly string[]> = {
  ai: ['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus'],
  hris: ['hris-workflow', 'ai-career', 'campus-delivery', 'ai-campus', 'quota-deck'],
};

/** Projects of a track in its order. The HRIS track rewrites each card's title and line; links stay /projects/<slug>/
 *  and are placed under /hris/ by trackPath when rendered. */
export function trackProjects(track: Track): ProjectEntry[] {
  return TRACK_ORDER[track].map(slug => {
    const p = SITE.projects.find(x => x.slug === slug);
    if (!p) throw new Error(`Unknown project in ${track} track: ${slug}`);
    const card = track === 'hris' ? HRIS.cards[slug as keyof typeof HRIS.cards] : undefined;
    return card ? { ...p, title: card.title, did: card.did } : p;
  });
}

/** The title a detail page shows in a track: on the HRIS track, the card's title (so the card, the pager and the page
 *  agree), with "(live edition)" on a live page; undefined keeps the page's own title. */
export function trackTitle(track: Track, slug: string): Bi | undefined {
  if (track !== 'hris') return undefined;
  const live = slug.endsWith('/live');
  const card = HRIS.cards[slug.replace(/\/live$/, '') as keyof typeof HRIS.cards];
  if (!card) return undefined;
  return live ? { zh: `${card.title.zh}（完整版）`, en: `${card.title.en} (live edition)` } : card.title;
}
