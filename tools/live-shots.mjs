// npm run live:shots — builds the site, serves dist/ and captures each live edition once its real program is running.
// Output: public/media/live-previews/<id>.jpg (the whole stage), <id>-crop.jpg (a 16:10 detail for the home page and the
// overview) and manifest.json (sizes for width/height attributes).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4398;
const OUT = 'public/media/live-previews';
const SHOTS = [
  { id: 'career', path: '/projects/ai-career/live/', stage: '#cl-stage', crop: { x: 340, y: 50, w: 1088, h: 680 }, ready: async p => { await p.locator('#cl-chip.live').waitFor({ timeout: 90_000 }); await p.locator('#cl-score', { hasText: '84' }).waitFor({ timeout: 20_000 }); } },
  { id: 'campus', path: '/projects/ai-campus/live/', stage: '#cm-stage', crop: { x: 260, y: 40, w: 1168, h: 730 }, ready: async p => { await p.locator('#cm-stage[data-state="done"]').waitFor({ timeout: 90_000 }); } },
  { id: 'quota', path: '/projects/quota-deck/live/', stage: '#qd-stage', crop: { x: 455, y: 90, w: 976, h: 610 }, ready: async p => { await p.locator('#qd-stage[data-state="running"]').waitFor({ timeout: 30_000 }); await p.waitForTimeout(3000); } },
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
    // The detail: the stage's top at the top of the screen, then a 16:10 clip of its most telling part.
    await stage.evaluate(el => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(400);
    const top = await stage.boundingBox();
    await page.screenshot({ path: `${OUT}/${s.id}-crop.jpg`, type: 'jpeg', quality: 85, clip: { x: top.x + s.crop.x, y: top.y + s.crop.y, width: s.crop.w, height: s.crop.h } });
    manifest[s.id] = { file: `/media/live-previews/${s.id}.jpg`, w: Math.round(box.width), h: Math.round(box.height),
      crop: { file: `/media/live-previews/${s.id}-crop.jpg`, w: s.crop.w, h: s.crop.h } };
    await page.close();
    console.log(`✓ ${s.id}`);
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
