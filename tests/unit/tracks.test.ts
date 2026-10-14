import { describe, it, expect } from 'vitest';
import { SITE } from '../../src/data/site';
import { trackProjects, TRACK_ORDER } from '../../src/data/tracks';

describe('AI track', () => {
  it('lists the five product projects in the confirmed order', () => {
    expect(trackProjects('ai').map(p => p.slug)).toEqual(['ai-career', 'hris-workflow', 'quota-deck', 'campus-delivery', 'ai-campus']);
  });

  it('every slug in the order is a project, and none is a film', () => {
    for (const slug of TRACK_ORDER.ai) {
      const p = SITE.projects.find(x => x.slug === slug);
      expect(p, slug).toBeDefined();
      expect(p!.line).toBe('data');
    }
  });

  it('live editions hang off their project instead of being projects of their own', () => {
    expect(SITE.projects.some(p => p.slug.includes('/'))).toBe(false);
    const live = Object.fromEntries(SITE.projects.filter(p => p.live).map(p => [p.slug, p.live!.href]));
    expect(live).toEqual({
      'campus-delivery': '/projects/campus-delivery/insights/',
      'ai-career': '/projects/ai-career/live/',
      'quota-deck': '/projects/quota-deck/live/',
      'ai-campus': '/projects/ai-campus/live/',
    });
  });
});
