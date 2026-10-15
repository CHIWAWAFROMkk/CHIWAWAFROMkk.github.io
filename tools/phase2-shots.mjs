// One-off visual check for phase 2: HRIS pages in light and dark, desktop and phone.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4395, OUT = 'test-results/phase2';
const PAGES = ['/hris/', '/hris/brief/', '/hris/projects/', '/hris/workbench/', '/hris/projects/hris-workflow/', '/hris/projects/ai-career/live/', '/en/hris/'];
if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]]) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(t => { localStorage.setItem('hyj-hris-intro-seen', '1'); localStorage.setItem('hyj-hris-theme', t); }, theme);
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}${p}`);
      await page.waitForTimeout(2000);
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/${name}-${theme}${p.replaceAll('/', '_')}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(`screenshots in ${OUT}`);
