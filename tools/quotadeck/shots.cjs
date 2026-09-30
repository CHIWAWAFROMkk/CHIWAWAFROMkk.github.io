// Captures QuotaDeck's tray window (quota / models / collab) with the demo preload. Refuses to shoot unless the header says demo data.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const root = process.env.QUOTADECK_ROOT;
const out = process.env.QUOTADECK_SHOTS_OUT;
app.setPath('userData', path.join(os.tmpdir(), 'quotadeck-shots-profile'));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 520, height: 840, show: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: false } });
  await win.loadFile(path.join(root, 'src/renderer/compact.html'));
  await new Promise(r => setTimeout(r, 600));
  for (const view of ['quota', 'models', 'collab']) {
    const check = await win.webContents.executeJavaScript(`(async () => {
      document.querySelector('[data-view="${view}"]').click();
      await new Promise(r => setTimeout(r, 300));
      const text = document.body.innerText;
      return { demo: text.includes('演示数据 · 非真实额度'), overflow: document.documentElement.scrollWidth > innerWidth, invalid: /NaN|undefined/.test(text) };
    })()`);
    if (!check.demo) throw Error(`${view}: header does not say demo data — refusing to capture`);
    if (check.overflow || check.invalid) throw Error(`${view}: layout check failed ${JSON.stringify(check)}`);
    await fs.writeFile(path.join(out, `${view}.png`), (await win.webContents.capturePage()).toPNG());
  }
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
