// One-off visual check for phase 1: every main page in each motion tier at desktop and phone width.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4397, OUT = 'test-results/phase1';
const PAGES = ['/', '/brief/', '/projects/', '/projects/ai-career/', '/projects/hris-workflow/', '/en/', '/en/projects/'];
const SIZES = [['desktop', 1440, 900], ['phone', 390, 844]];
const TIERS = ['full', 'gentle', 'off'];
if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const [name, w, h] of SIZES) for (const tier of TIERS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: tier === 'gentle' ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(t => { try { localStorage.setItem('hyj-intro-seen', '1'); if (t === 'off') localStorage.setItem('hyj-motion', 'off'); } catch {} }, tier);
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}${p}`);
      await page.waitForTimeout(2500);
      // Scroll through once, as a visitor would, so scroll-armed reveals and the film zone's fade-up have played.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${OUT}/${name}-${tier}${p.replaceAll('/', '_') || '_'}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(`screenshots in ${OUT}`);
