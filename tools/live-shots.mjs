// npm run live:shots — builds the site, serves dist/ and captures each live edition once its real program is running.
// Output: public/media/live-previews/<id>.jpg and manifest.json (sizes for width/height attributes).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4398;
const OUT = 'public/media/live-previews';
const SHOTS = [
  { id: 'career', path: '/projects/ai-career/live/', stage: '#cl-stage', ready: async p => { await p.locator('#cl-chip.live').waitFor({ timeout: 90_000 }); await p.locator('#cl-score', { hasText: '84' }).waitFor({ timeout: 20_000 }); } },
  { id: 'campus', path: '/projects/ai-campus/live/', stage: '#cm-stage', ready: async p => { await p.locator('#cm-stage[data-state="done"]').waitFor({ timeout: 90_000 }); } },
  { id: 'quota', path: '/projects/quota-deck/live/', stage: '#qd-stage', ready: async p => { await p.locator('#qd-stage[data-state="running"]').waitFor({ timeout: 30_000 }); await p.waitForTimeout(3000); } },
];

if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }).status !== 0) process.exit(1);
const server = spawn('node', ['tools/serve-dist.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const manifest = {};
try {
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => { try { localStorage.setItem('hyj-intro-seen', '1'); localStorage.setItem('hyj-motion', 'full'); } catch {} });
    await page.goto(`http://localhost:${PORT}${s.path}`);
    await page.locator(s.stage).scrollIntoViewIfNeeded();
    await s.ready(page);
    await page.waitForTimeout(1200);                       // let the zone's fade-up from black finish
    const stage = page.locator(s.stage);
    const box = await stage.boundingBox();
    await stage.screenshot({ path: `${OUT}/${s.id}.jpg`, type: 'jpeg', quality: 82 });
    manifest[s.id] = { file: `/media/live-previews/${s.id}.jpg`, w: Math.round(box.width), h: Math.round(box.height) };
    await page.close();
    console.log(`✓ ${s.id}`);
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
