import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const lang of ['zh', 'en'] as const) {
  const PATH = `${lang === 'en' ? '/en' : ''}/projects/stark-desk/`;

  test(`Stark desk page (${lang}) is dark, shows the poster and the summary`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await expect(page.locator('body')).toHaveClass(/night/);
    await expect(page.locator('.sd__poster')).toBeVisible();
    await expect(page.locator('.prose h2').first()).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`Stark desk page (${lang}): the desk loads only on click and works inside the frame`, async ({ page, request }) => {
    await skipIntro(page);
    await page.goto(PATH);
    const frame = page.locator('#stark-frame');
    await expect(frame).toBeHidden();
    expect(await frame.getAttribute('src')).toBeNull();          // nothing heavy before the click
    await page.locator('[data-sd-load]').click();
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('src', '/assets/stark-desk/');
    expect((await request.get('/assets/stark-desk/')).status()).toBe(200);
    const inner = page.frameLocator('#stark-frame');
    await expect(inner.locator("body[data-ready='1']")).toBeAttached({ timeout: 20000 });
    await expect(page.locator('a[href="/assets/stark-desk/"]').first()).toBeVisible();   // full-screen link
  });
}

test('Stark desk is listed under AI film on the projects index', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/');
  await expect(page.locator('.night-zone a[href$="/projects/stark-desk/"]')).toBeVisible();
});

test('Stark desk page shares its own image', async ({ page }) => {
  await page.goto('/projects/stark-desk/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/stark-desk\.jpg$/);
});
