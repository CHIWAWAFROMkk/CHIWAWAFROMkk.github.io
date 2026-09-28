import { test, expect } from '@playwright/test';
import { CASES, OUTCOME_LABEL, DEMO_TEXT } from '../../src/scripts/hris-demo';
import { fact } from '../../src/data/facts';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`HRIS page (${lang})`, () => {
    test.beforeEach(async ({ page }) => { await page.goto(`${prefix}/projects/hris-workflow/`); });

    test('five-part summary is present', async ({ page }) => {
      await expect(page.locator('.p-summary dt')).toHaveCount(5);
    });

    test('states personal scope with the ledger wording and never the old 6000 framing', async ({ page }) => {
      await expect(page.getByText('about 2000 employees', { exact: false }).or(page.getByText('约 2000 名员工', { exact: false })).first()).toBeVisible();
      const body = await page.locator('main').innerText();
      expect(body).not.toContain('约 6000 名员工的档案维护');
      expect(body).toContain(fact('F5').text[lang].split(' · ')[2]);
    });

    test('demo is labelled as simulated and every case reaches its outcome', async ({ page }) => {
      await expect(page.getByText(DEMO_TEXT.badge[lang])).toBeVisible();
      for (const c of CASES) {
        await page.locator(`[data-case="${c.id}"]`).click();
        await expect(page.locator('[data-outcome]')).toHaveText(OUTCOME_LABEL[c.outcome][lang]);
        await expect(page.locator(`[data-case="${c.id}"]`)).toHaveAttribute('aria-pressed', 'true');
        const stopped = await page.locator('[data-step][data-state="stopped"]').count();
        expect(stopped, c.id).toBe(c.outcome === 'done' ? 0 : 1);
      }
    });

    test('links to the downloadable design and does not overflow', async ({ page }) => {
      await expect(page.locator(`a[href="${encodeURI('/downloads/hris/HRIS方案.md')}"], a[href="/downloads/hris/HRIS方案.md"]`).first()).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}

test.describe('HRIS demo without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows the first case statically', async ({ page }) => {
    await page.goto('/projects/hris-workflow/');
    await expect(page.locator('[data-outcome]')).toHaveText(OUTCOME_LABEL[CASES[0].outcome].zh);
  });
});
