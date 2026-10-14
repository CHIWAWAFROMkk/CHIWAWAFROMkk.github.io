import { SITE, type ProjectEntry } from './site';

/** The main site's audience. The HRIS track joins in phase two (spec §10). */
export type Track = 'ai';

/** Project order per track (spec §2: 求职 Agent → 丹纳赫工作流 → QuotaDeck → 校园外卖 → AI 校园研究). */
export const TRACK_ORDER: Record<Track, readonly string[]> = {
  ai: ['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus'],
};

export function trackProjects(track: Track): ProjectEntry[] {
  return TRACK_ORDER[track].map(slug => {
    const p = SITE.projects.find(x => x.slug === slug);
    if (!p) throw new Error(`Unknown project in ${track} track: ${slug}`);
    return p;
  });
}
