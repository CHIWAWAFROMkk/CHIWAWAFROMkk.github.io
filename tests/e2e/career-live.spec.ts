import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/ai-career/';
const JD2 = '岗位：数据分析实习生\n岗位要求：\n- 熟练使用 Python 和 SQL；\n- 每周至少 3 天；\n- 有数据可视化经验（Power BI 或 Tableau）；\n- 良好的沟通能力。';
test.describe.configure({ timeout: 120_000 });

async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cl-score')).toHaveText('84', { timeout: 20_000 });
  await expect(page.locator('#cl-obs')).not.toBeEmpty({ timeout: 10_000 });
}
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the start-button test');

test('the real engine boots in the browser and caps the demo at 84', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#cl-chip')).toHaveText(/^PYTHON 3\.13\.\d+ · WEBASSEMBLY$/);
  await expect(page.locator('#cl-raw')).toHaveText('原始分 86');
  await expect(page.locator('#cl-ceil')).toContainText('上限 84');
  await expect(page.locator('#cl-code .cl-l[data-n="700"]')).toHaveClass(/on/);
  await expect(page.locator('#cl-obs')).toHaveText('有待确认的硬门槛（必须熟练使用 SQL），原始分 86，总分被限制在 84。1 条已确认的事实进入材料。');
  await expect(page.locator('#cl-boot-log')).toContainText('MB');
  await expect(page.locator('#cl-lat')).toContainText('ms');
});

test('the live source lines are the vendored engine, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/assets/py/job-agent/4397ded/job_agent/services/local_matcher.py', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(696, 702);
  await expect(page.locator('#cl-code .cl-src')).toHaveText(file);
});

test('three days slams the score down to 59 and lights line 698', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-days').selectOption('3');
  await expect(page.locator('#cl-score')).toHaveText('59', { timeout: 15_000 });
  await expect(page.locator('#cl-raw')).toHaveText('原始分 81');
  await expect(page.locator('#cl-code .cl-l[data-n="698"]')).toHaveClass(/on/);
  await expect(page.locator('#cl-obs')).toContainText('硬门槛不满足（每周至少 4 天）');
});

test('confirming Tableau puts a second fact into the materials', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-facts select[data-id="fact-pending-tableau"]').selectOption('user_confirmed');
  await expect(page.locator('#cl-facts-n')).toHaveText('2', { timeout: 15_000 });
  await expect(page.locator('#cl-raw')).toHaveText('原始分 95');
  await expect(page.locator('#cl-score')).toHaveText('84');
});

test('a pasted job description is parsed by the engine', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill(JD2);
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-obs')).toContainText('不设上限', { timeout: 20_000 });
  await expect(page.locator('#cl-circuit svg')).toHaveAttribute('aria-label', /良好的沟通能力: 未评估/);
  await expect(page.locator('#cl-jd-view mark')).toHaveCount(4);
});

test('an added fact is part of the next result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('.cl-add summary').click();
  await page.locator('#cl-add-text').fill('用 Python 做过销售数据清洗');
  await page.locator('#cl-add-skills').fill('Python, pandas');
  await page.locator('#cl-add-status').selectOption('user_confirmed');
  await page.locator('#cl-add-btn').click();
  await expect(page.locator('#cl-facts li')).toHaveCount(3, { timeout: 15_000 });
  await expect(page.locator('#cl-circuit')).toContainText('用 Python 做过销售数据清洗');
});

test('removing the only confirmed fact shows the engine\'s refusal', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-facts li').first().getByRole('button').click();
  await expect(page.locator('#cl-obs')).toContainText('引擎未生成材料：Profile 中没有可用于投递材料的已确认事实。', { timeout: 15_000 });
  await expect(page.locator('#cl-score')).toHaveText('45');
  await expect(page.locator('#cl-facts-n')).toHaveText('0');
});

test('an empty job description explains itself and keeps the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill('   ');
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-status')).toHaveText('职位描述不能为空。');
  await expect(page.locator('#cl-score')).toHaveText('84');
});

test('rapid edits land on the last input', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  for (const v of ['3', '4', '3', '5', '3']) await page.locator('#cl-days').selectOption(v);
  await expect(page.locator('#cl-score')).toHaveText('59', { timeout: 15_000 });
  await page.waitForTimeout(2500);
  await expect(page.locator('#cl-score')).toHaveText('59');
  await expect(page.locator('#cl-obs')).toContainText('原始分 81');
});

test('blocked runtime falls back to the replay, with a retry', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/pyodide.asm.wasm', r => r.abort());
  await page.goto(PATH);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cl-replay')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#cl-fallback-note')).toBeVisible();
  await expect(page.locator('#cl-retry')).toBeVisible();
  await expect(page.locator('#agent-results')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#cl-stage')).toBeHidden();
});

test('the replay can be chosen by hand and left again', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(`${PATH}?engine=replay`);
  await expect(page.locator('#cl-replay')).toBeVisible();
  await expect(page.locator('#cl-fallback-note')).toBeHidden();
  await page.locator('#cl-toggle-replay').click();
  await expect(page.locator('#cl-stage')).toBeVisible();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
});

test('reduced motion shows the final state without the boot show', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('#cl-boot')).toBeHidden();
  await expect(page.locator('#cl-code .cl-l[data-n="702"] .cl-cnt')).toHaveText('score = 84');
});

test('English page: English interface, Chinese engine data', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#cl-title')).toHaveText('Live engine: job agent matching');
  await expect(page.locator('#cl-obs')).toHaveText('Hard requirement to confirm (必须熟练使用 SQL): raw 86, capped at 84. 1 confirmed fact enters the materials.');
  await expect(page.locator('#cl-raw')).toHaveText('raw 86');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('phones wait for the start button before downloading the runtime', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone flow');
  const wasm: string[] = [];
  page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
  await page.goto(PATH);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  expect(wasm).toEqual([]);
  await expect(page.locator('#cl-start-btn')).toContainText('MB');
  await page.locator('#cl-start-btn').click();
  await expect(page.locator('#cl-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cl-score')).toHaveText('84', { timeout: 20_000 });
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('once the engine runs, the live stage has no serious accessibility issue', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const { violations } = await new AxeBuilder({ page }).include('#cl-stage').analyze();
  const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

// ---- review fixes ----
const addFact = async (page: Page, text: string) => {
  await page.locator('#cl-add-text').fill(text);
  await page.locator('#cl-add-btn').click();
};

test('removing every fact empties the list', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-facts li').first().getByRole('button').click();
  await expect(page.locator('#cl-facts li')).toHaveCount(1);
  await page.locator('#cl-facts li').first().getByRole('button').click();
  await expect(page.locator('#cl-facts li')).toHaveCount(0);
  await page.waitForTimeout(2500);
  await expect(page.locator('#cl-facts li')).toHaveCount(0);
});

test('removing added facts in quick succession removes exactly those', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('.cl-add summary').click();
  for (const t of ['经历甲', '经历乙', '经历丙']) await addFact(page, t);
  await expect(page.locator('#cl-facts li')).toHaveCount(5, { timeout: 15_000 });
  await page.locator('#cl-facts li', { hasText: '经历甲' }).getByRole('button').click();
  await page.locator('#cl-facts li', { hasText: '经历乙' }).getByRole('button').click();
  await page.waitForTimeout(2500);
  await expect(page.locator('#cl-facts')).toContainText('经历丙');
  await expect(page.locator('#cl-facts')).not.toContainText('经历甲');
  await expect(page.locator('#cl-facts')).not.toContainText('经历乙');
});

test('choosing the replay during boot and coming back renders at full width', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  await page.locator('#cl-stage').scrollIntoViewIfNeeded();
  await page.locator('#cl-toggle-replay').click();
  await page.locator('#cl-chip.live').waitFor({ state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(3000);
  await expect(page.locator('.cl-fly')).toHaveCount(0);
  await page.locator('#cl-toggle-replay').click();
  await expect(page.locator('#cl-circuit svg')).toHaveAttribute('viewBox', /^0 0 1000 /, { timeout: 15_000 });
});

test('an invalid edit during the animation leaves the previous result complete', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-days').selectOption('3');
  await page.waitForTimeout(1600);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill('   ');
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-status')).toHaveText('职位描述不能为空。');
  await page.waitForTimeout(3000);
  await expect(page.locator('#cl-score')).toHaveText('59');
  await expect(page.locator('#cl-obs')).toContainText('总分被限制在 59');
});

test('English page words validation messages in English', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill('   ');
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-status')).toHaveText('The job description is empty.');
});

test('text without recognisable requirements is explained, not drawn as an empty circuit', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill('hello world');
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-status')).toContainText('没有从这段文字里识别出岗位要求');
  await expect(page.locator('#cl-score')).toHaveText('84');
});

test('a long job description draws twelve requirements promptly and says how many more ran', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  const long = '岗位要求：\n' + Array.from({ length: 40 }, (_, i) => `- 第 ${i + 1} 项：熟悉 Excel，能独立完成数据清洗；`).join('\n');
  await page.locator('#cl-jd-toggle').click();
  await page.locator('#cl-jd-input').fill(long);
  await page.locator('#cl-jd-toggle').click();
  await expect(page.locator('#cl-circuit .cmore')).toContainText('另有', { timeout: 15_000 });
  await expect(page.locator('#cl-obs')).not.toBeEmpty({ timeout: 8_000 });
});

test('the boot byte stream shows the real SHA-256 of the files being loaded', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  const manifest = JSON.parse(readFileSync('public/assets/vendor/pyodide/0.29.5/manifest.json', 'utf8'));
  const wasm = manifest.files.find((f: { name: string }) => f.name === 'pyodide.asm.wasm').sha256.slice(0, 8);
  await live(page);
  await expect(page.locator('#cl-boot-hex')).toContainText(wasm);
});
