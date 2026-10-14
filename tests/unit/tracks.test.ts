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

import { trackPath } from '../../src/i18n';

describe('HRIS track', () => {
  it('lists the HRIS order with the job engine renamed', () => {
    const list = trackProjects('hris');
    expect(list.map(p => p.slug)).toEqual(['hris-workflow', 'ai-career', 'campus-delivery', 'ai-campus', 'quota-deck']);
    expect(list.find(p => p.slug === 'ai-career')!.title.zh).toBe('人岗匹配评估引擎');
  });
  it('rewrites only the card copy, never the links', () => {
    for (const p of trackProjects('hris')) expect(p.href).toBe(`/projects/${p.slug}/`);
  });
});

describe('trackPath', () => {
  it('keeps the AI track as it is', () => {
    expect(trackPath('ai', '/projects/ai-career/', 'zh')).toBe('/projects/ai-career/');
    expect(trackPath('ai', '/', 'en')).toBe('/en/');
  });
  it('puts the HRIS track under /hris/, before the language prefix', () => {
    expect(trackPath('hris', '/', 'zh')).toBe('/hris/');
    expect(trackPath('hris', '/projects/ai-career/live/', 'zh')).toBe('/hris/projects/ai-career/live/');
    expect(trackPath('hris', '/brief/', 'en')).toBe('/en/hris/brief/');
    expect(trackPath('hris', '/en/projects/', 'en')).toBe('/en/hris/projects/');
  });
});
