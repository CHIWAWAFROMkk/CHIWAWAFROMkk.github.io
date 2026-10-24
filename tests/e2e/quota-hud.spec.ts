import { test, expect, type Page } from '@playwright/test';
import { QD_HUD_TEXT } from '../../src/scripts/qd-hud-text';
import { BEATS } from '../../src/scripts/qd-hud-scenario';
import { motionChoice, noHorizontalOverflow } from './helpers';

const PAGE = '/projects/quota-deck/live/';
const T = QD_HUD_TEXT.zh;
const note = (id: string) => BEATS.find(b => b.id === id)!.note.zh;
const hud = (page: Page) => page.frameLocator('#qd-frame');

/** Opens the page on a controlled clock and waits for the afternoon to start at 0 s. */
async function open(page: Page, path = PAGE) {
  await page.clock.install();
  await page.goto(path);
  await page.locator('[data-quota-hud]').scrollIntoViewIfNeeded();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', 'running', { timeout: 15_000 });
  await expect(hud(page).locator('#strip')).toBeVisible();
}

test.describe('QuotaDeck live edition: the real HUD', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing on desktop; phone layout below');
  // page.clock.runFor plays every simulated frame, so long advances cost real seconds.
  test.describe.configure({ timeout: 120_000 });

  test('starts running with five rings on the strip', async ({ page }) => {
    await open(page);
    await expect(hud(page).locator('#strip .item')).toHaveCount(5);
    await expect(page.locator('[data-qd-note]')).toHaveText(note('start'));
  });

  test('the simulated desktop fills the stage width and shows its wallpaper through the HUD window', async ({ page }) => {
    await open(page);
    const desk = await page.locator('[data-qd-desk]').boundingBox();
    const screen = await page.locator('[data-qd-screen]').boundingBox();
    expect(Math.abs(screen!.width - desk!.width)).toBeLessThanOrEqual(2);   // the desk's 1 px border on each side
    // QuotaDeck's HUD declares color-scheme: dark; a frame with another scheme gets an opaque backdrop over the wallpaper.
    expect(await page.locator('#qd-frame').evaluate(f => getComputedStyle(f).colorScheme)).toBe('dark');
  });

  test('12.5 s: Claude is done — New reply', async ({ page }) => {
    await open(page);
    await page.clock.runFor(12_500);
    await expect(hud(page).locator('.alert-pill', { hasText: 'New reply' })).toBeVisible();
    await expect(page.locator('[data-qd-note]')).toHaveText(note('claude-done'));
  });

  test('32.5 s: an approval request; Allow once answers it and says nothing ran', async ({ page }) => {
    await open(page);
    await page.clock.runFor(32_500);
    await expect(hud(page).locator('.alert-pill', { hasText: 'Approve?' })).toBeVisible();
    // The HUD measures waits against the visitor's own clock: a request made seconds ago must not read "1189m".
    await expect(hud(page).locator('.alert-pill', { hasText: 'Approve?' })).not.toHaveText(/\d{2,}m/);
    await hud(page).locator('#strip [data-id=claude]').click();
    await hud(page).getByRole('button', { name: 'Allow once' }).click();
    await expect(page.locator('[data-qd-log]')).toHaveText(T.allowed);
    await page.clock.runFor(1_000);
    await expect(hud(page).locator('.alert-pill', { hasText: 'Approve?' })).toBeHidden();
  });

  test('52.5 s with no answer: a hint invites the visitor to try', async ({ page }) => {
    await open(page);
    await page.clock.runFor(52_500);
    await expect(page.locator('[data-qd-hint]')).toBeVisible();
  });

  test('pause holds the afternoon still', async ({ page }) => {
    await open(page);
    await page.locator('[data-qd-play]').click();
    await page.clock.runFor(15_000);
    await expect(page.locator('[data-qd-note]')).toHaveText(note('start'));
    await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', 'paused');
  });

  test('the notch style shows the notch instead of the strip', async ({ page }) => {
    await open(page);
    await page.locator('[data-qd-style="notch"]').click();
    await expect(hud(page).locator('#notch')).toBeVisible();
    await expect(hud(page).locator('#strip')).toBeHidden();
  });

  test('motion off: no autoplay; Next walks every beat, and the HUD itself does not animate', async ({ page }) => {
    await motionChoice(page, 'off');
    await page.goto(PAGE);
    await page.locator('[data-quota-hud]').scrollIntoViewIfNeeded();
    await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', 'stepping', { timeout: 15_000 });
    for (const id of ['claude-done', 'codex-start', 'approval', 'codex-done', 'tokens', 'loop']) {
      await page.locator('[data-qd-step]').click();
      await expect(page.locator('[data-qd-note]')).toHaveText(note(id));
    }
    await expect(hud(page).locator('#strip')).toBeVisible();
    const sheets = await page.frameLocator('#qd-frame').locator('link[rel=stylesheet]').evaluateAll(ls => ls.map(l => l.getAttribute('href')));
    expect(sheets.some(h => h?.endsWith('hud-host-off.css'))).toBe(true);
  });

  test('a vendored file that fails to load falls back to the screenshots', async ({ page }) => {
    await page.route('**/175d31c/src/renderer/hud.js', r => r.fulfill({ status: 404, body: '' }));
    await page.goto(PAGE);
    await page.locator('[data-quota-hud]').scrollIntoViewIfNeeded();   // the demo only starts loading near the screen
    // The failure line, not the no-JS line: the demo noticed the failure and said so.
    await expect(page.locator('#qd-fallback')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#qd-fallback')).toHaveText(T.failed);
    await expect(page.locator('#qd-stage')).toBeHidden();
  });

  test('a visitor with JavaScript never sees the no-JavaScript line, before or after the demo starts', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByText(T.noscript)).toBeHidden();
    await expect(page.locator('#qd-fallback')).toBeHidden();
    await page.locator('[data-quota-hud]').scrollIntoViewIfNeeded();
    await expect(page.locator('#qd-stage')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(T.noscript)).toBeHidden();
  });

  test('the page only ever asks this site for files', async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', r => hosts.add(new URL(r.url()).host));
    await open(page);
    await page.clock.runFor(35_000);
    expect([...hosts]).toEqual(['localhost:4399']);
  });

  test('the HRIS track runs the same demo and links back inside /hris/', async ({ page }) => {
    await open(page, '/hris/projects/quota-deck/live/');
    await expect(page.locator('main a[href="/hris/projects/quota-deck/"]').last()).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the explanation and the screenshots show', async ({ page }) => {
    await page.goto(PAGE);
    // Playwright's text search skips <noscript>, so the paragraph is located directly.
    await expect(page.locator('noscript p')).toBeVisible();
    await expect(page.locator('noscript p')).toHaveText(QD_HUD_TEXT.zh.noscript);
    await expect(page.locator('#qd-fallback')).toBeHidden();
    await expect(page.locator('#qd-stage')).toBeHidden();
    await expect(page.locator('.qshots img').first()).toBeVisible();
  });
});

for (const width of [390, 360]) {
  test(`phone ${width}px: no sideways scroll, and an opened card fits on screen`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone');
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PAGE);
    await page.locator('[data-quota-hud]').scrollIntoViewIfNeeded();
    await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', /running|stepping/, { timeout: 15_000 });
    expect(await noHorizontalOverflow(page)).toBe(true);
    await hud(page).locator('#strip [data-id=claude]').click();
    await expect(hud(page).locator('#card')).toHaveClass(/shown/);
    const frame = await page.locator('#qd-frame').boundingBox();
    const card = await hud(page).locator('#card').evaluate(c => { const r = c.getBoundingClientRect(); return { left: r.left, right: r.right }; });
    const scale = frame!.width / (await page.locator('#qd-frame').evaluate(f => (f as HTMLIFrameElement).offsetWidth));
    expect(frame!.x + card.left * scale).toBeGreaterThanOrEqual(0);
    expect(frame!.x + card.right * scale).toBeLessThanOrEqual(width);
  });
}
