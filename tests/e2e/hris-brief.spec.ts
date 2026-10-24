import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { fact } from '../../src/data/facts';
import { trackProjects } from '../../src/data/tracks';
import { motionOff, noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`HRIS brief (${lang}): internship, points, education, skills, availability`, async ({ page }) => {
    await motionOff(page);
    await page.goto(`${prefix}/hris/brief/`);
    // The headhunting internship comes first (the most recent), then Danaher; each with its own points.
    await expect(page.locator('.hb-org')).toHaveText([fact('F16').text[lang], fact('F5').text[lang]]);
    expect(HRIS.brief.jobs.map(j => j.fact)).toEqual(['F16', 'F5']);
    const jobs = page.locator('.hb-job');
    for (const [i, job] of HRIS.brief.jobs.entries()) await expect(jobs.nth(i).locator('.hb-points li')).toHaveText(job.points.map(p => p[lang]));
    await expect(page.locator('.hb-edu')).toContainText(fact('F2').text[lang]);
    await expect(page.locator('.hb-skills dt')).toHaveText(HRIS.skills.map(s => s.group[lang]));
    await expect(page.locator('.hb-avail')).toHaveText(fact('F3').text[lang]);
    await expect(page.locator('a.hb-cta')).toHaveAttribute('href', `${prefix}/hris/workbench/`);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`HRIS projects (${lang}): five cards in the HRIS order`, async ({ page }) => {
    await motionOff(page);
    await page.goto(`${prefix}/hris/projects/`);
    const hrefs = await page.locator('.h-work a.h-work__title').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs).toEqual(trackProjects('hris').map(p => `${prefix}/hris${p.href}`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HRIS.projects.title[lang]);
  });
}
