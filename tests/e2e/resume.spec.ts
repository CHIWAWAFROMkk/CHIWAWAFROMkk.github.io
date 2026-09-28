import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

test('both résumés download as PDF', async ({ request }) => {
  for (const url of [SITE.resume.zh, SITE.resume.en]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
    expect(res.headers()['content-type'], url).toContain('application/pdf');
  }
});
