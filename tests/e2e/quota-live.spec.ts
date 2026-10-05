import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/quota-deck/live/';
// The live demos run continuous canvas animation (and a Python runtime); run each file's tests one after another so
// that sixteen parallel workers do not starve them of CPU and slow their real-time replays past the timeouts.
test.describe.configure({ mode: 'default', timeout: 120_000 });
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the layout test');

async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#qd-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-state', 'running', { timeout: 30_000 });
  await expect(page.frameLocator('#qd-frame').locator('.provider')).toHaveCount(5, { timeout: 20_000 });
}
const frame = (page: Page) => page.frameLocator('#qd-frame');
const codex = async (page: Page) => Number(await page.locator('#qd-stage').getAttribute('data-codex'));

test('QuotaDeck\'s own tray UI renders the simulated quota', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(frame(page).locator('h1')).toHaveText('QuotaDeck');
  await expect(frame(page).locator('#syncMeta')).toContainText('更新');
  await expect(frame(page).locator('[data-provider="workbuddy"] .state-word')).toHaveText('缓存数据');
  await expect(page.locator('.qd-apphead')).toContainText('演示数据 · 非真实额度');
});

test('opening a provider row keeps the window updating', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  // Opened from the keyboard: focus stays on the row (the condition that once froze the window), and the frequent
  // rebuilds of the list cannot race a mouse click's actionability checks on a loaded machine.
  await frame(page).locator('[data-provider="codex"] .provider-summary').focus();
  await page.keyboard.press('Enter');
  await expect(frame(page).locator('[data-provider="codex"]')).toHaveClass(/open/);
  const before = await frame(page).locator('#syncMeta').textContent();
  await expect(frame(page).locator('#syncMeta')).not.toHaveText(before!, { timeout: 3_000 });
  await expect(frame(page).locator('[data-provider="codex"]')).toHaveClass(/open/);
});

test('a control under the pointer is not rebuilt while the visitor aims at it', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const f = frame(page);
  await f.locator('[data-view="collab"]').click();
  // Timed inside the page, from the pointer's arrival to the list's first rebuild, so a slow machine cannot fail it.
  const gap = f.locator('#agentChoices').evaluate(el => new Promise<number>(resolve => {
    let over = 0;
    el.addEventListener('pointerover', () => { over ||= performance.now(); }, true);
    new MutationObserver(() => { if (over) resolve(performance.now() - over); }).observe(el, { childList: true });
    setTimeout(() => resolve(Infinity), 6000);
  }));
  // The container persists while compact.js rebuilds its contents, so hovering it cannot race a rebuild; the pointer
  // lands on one of the agent labels inside.
  await f.locator('#agentChoices').hover();
  expect(await gap).toBeGreaterThan(1400);                                  // held for 1.5 s from the moment of aiming
});

test('the live source lines are quota-history.cjs 50–61, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/assets/quotadeck/e9557c6/src/main/quota-history.cjs', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(49, 61);
  await expect(page.locator('#qd-code .cl-src')).toHaveText(file);
});

test('Antigravity gets QuotaDeck\'s own burn rate and exhaustion estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-eta')).toContainText('点/小时', { timeout: 15_000 });
  await expect(frame(page).locator('[data-provider="antigravity"]')).toContainText('近 1 小时采样');
  await expect(page.locator('#qd-code .cl-l[data-n="57"] .cl-cnt')).toContainText('点/小时');
});

test('at 600× a window ends and resets to 100%', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-stage')).not.toHaveAttribute('data-resets', '0', { timeout: 40_000 });
});

test('a big task takes Codex down by about 24 points', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('[data-sp="1"]').click();
  await page.waitForTimeout(1500);
  const before = await codex(page);
  await page.locator('#qd-task').click();
  await page.waitForTimeout(1500);
  await page.locator('[data-sp="600"]').click();
  await expect.poll(() => codex(page), { timeout: 4_000 }).toBeLessThan(before - 20);   // well before Codex's reset at 09:00 + 2.4 h
});

test('the page\'s collaboration runs through queued, running and done, and invents no answer', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'running');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-agents', /codex:queue/);
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-agents', /codex:run/, { timeout: 3_000 });
  await expect(page.locator('#qd-collab')).toBeDisabled();
  await expect(page.locator('#qd-strip')).toContainText('不调用真实 Agent');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-strip-k')).toHaveText('✓ 4/4 已完成');
  await frame(page).locator('[data-view="collab"]').click();
  await expect(frame(page).locator('#collabResults .result')).toHaveCount(4);
  for (const pre of await frame(page).locator('#collabResults pre').allTextContents()) expect(pre).toContain('没有调用真实 Agent');
});

test('the tray UI\'s own collaboration form runs the same flow; a second run is refused', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const f = frame(page);
  await f.locator('[data-view="collab"]').click();
  await f.locator('#collabTask').fill('分析这个产品需求');
  await f.locator('#agentChoices input[value="codex"]').check();
  await f.locator('#agentChoices input[value="claude"]').check();
  await f.locator('#runCollabBtn').click();
  await expect(page.locator('#qd-collab')).toBeDisabled();
  await expect(f.locator('#runCollabBtn')).toHaveText('Agent 并行执行中…');
  const second = await page.evaluate(() => (window as any).__quotaDeckBridge.runCollaboration({ task: 'x', agents: ['codex', 'claude'] }).then(() => 'ran', (e: Error) => e.message));
  expect(second).toBe('已有协作任务运行，请等待结束');
  await expect(f.locator('#collabResults .result')).toHaveCount(2, { timeout: 10_000 });
});

test('a second run right after the first one finishes completes too', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'running');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-collab')).toBeEnabled();
});

test('keyboard: the collaboration button gets its focus back when the run ends', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#qd-stage')).toHaveAttribute('data-collab', 'done', { timeout: 10_000 });
  await expect(page.locator('#qd-collab')).toBeFocused();
});

test('the page button stays disabled while a collaboration runs', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#qd-collab').click();
  await expect(page.locator('#qd-collab')).toBeDisabled();
  const f = frame(page);
  await f.locator('[data-view="collab"]').click();
  await expect(f.locator('#runCollabBtn')).toBeDisabled();
});

test('pausing and changing speed keeps the estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#qd-eta')).toContainText('点/小时', { timeout: 15_000 });
  await page.locator('[data-sp="0"]').click();
  const t = await page.locator('#qd-clock-text').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('#qd-clock-text')).toHaveText(t!);
  await page.locator('[data-sp="60"]').click();
  await page.waitForTimeout(2500);
  await expect(page.locator('#qd-eta')).toContainText('点/小时');
});

test('reduced motion starts paused with an estimate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('[data-sp="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#qd-eta')).toContainText('点/小时');
  const t = await page.locator('#qd-clock-text').textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator('#qd-clock-text')).toHaveText(t!);
});

test('a blocked QuotaDeck file falls back to the screenshots', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/quotadeck/e9557c6/src/main/snapshot.cjs', r => r.abort());
  await page.goto(PATH);
  await page.locator('[data-quota-live]').scrollIntoViewIfNeeded();   // the stage hides itself on failure
  await expect(page.locator('#qd-fallback')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#qd-stage')).toBeHidden();
  await expect(page.locator('.qd-intro')).toBeHidden();
  await expect(page.locator('.qshots figure[data-shot]')).toHaveCount(3);
});

for (const blocked of ['**/assets/quotadeck/host.js', '**/quotadeck/e9557c6/src/renderer/compact.css']) {
  test(`the host failing (${blocked.split('/').pop()}) falls back to the screenshots`, async ({ page, isMobile }) => {
    desktopOnly(!!isMobile);
    await page.route(blocked, r => r.abort());
    await page.goto(PATH);
    await page.locator('[data-quota-live]').scrollIntoViewIfNeeded();   // the stage hides itself on failure
    await expect(page.locator('#qd-fallback')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.qshots figure[data-shot]')).toHaveCount(3);
  });
}

test('the demo makes no request off the site', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  const off: string[] = [];
  page.on('request', r => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.hostname.endsWith('fonts.googleapis.com') && !u.hostname.endsWith('fonts.gstatic.com')) off.push(r.url()); });
  await live(page);
  await page.waitForTimeout(2000);
  expect(off).toEqual([]);
});

test('English page: English interface; QuotaDeck\'s window stays as published', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#qd-title')).toHaveText('Time machine: QuotaDeck, live');
  await expect(page.locator('#qd-task')).toHaveText('Give Codex a big task');
  await expect(page.locator('.qd-apphead')).toContainText('in Chinese');
  await expect(frame(page).locator('nav button').first()).toHaveText('额度');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('on a phone the window and the timeline stack without widening the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout');
  await live(page);
  const w = await page.locator('.qd-window').boundingBox(), t = await page.locator('.qd-tl').boundingBox();
  expect(t!.y).toBeGreaterThan(w!.y + w!.height - 1);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('the live stage has no serious accessibility issue', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const { violations } = await new AxeBuilder({ page }).include('#qd-stage').exclude('#qd-frame').analyze();
  const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test('the faint helper text in the tray reaches 4.5:1 on its paper, without touching the vendored files', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const ratio = await frame(page).locator('.topbar p').evaluate(el => {
    const rgb = (s: string) => s.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
    const lum = (c: number[]) => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    let bgEl: Element | null = el; let bg = 'rgba(0, 0, 0, 0)';
    while (bgEl && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(bgEl).backgroundColor; bgEl = bgEl.parentElement; }
    const a = lum(rgb(getComputedStyle(el).color)), b = lum(rgb(bg));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test('choosing a model filter with the keyboard keeps focus on that filter', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await frame(page).locator('[data-view="models"]').click();
  const codexFilter = frame(page).locator('#modelFilters [data-filter="codex"]');
  await codexFilter.focus();
  await codexFilter.press('Enter');
  await expect(frame(page).locator('#modelFilters [data-filter="codex"]')).toBeFocused();
  await expect(frame(page).locator('#modelFilters [data-filter="codex"]')).toHaveClass(/active/);
});
