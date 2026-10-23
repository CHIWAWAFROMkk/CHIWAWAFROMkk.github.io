// Hosts QuotaDeck's HUD exactly as vendored: window.hud is the bridge the portfolio page provides (it stands in for the
// desktop program's preload), then hud.html's stylesheets and body are copied in and its scripts run in their order.
// The vendored files stay byte-identical (tests check their SHA-256). Motion tiers reach the HUD through one of two
// stylesheets of the portfolio's own, since the site's global motion rules do not cross into the iframe.
(() => {
  const fail = reason => { try { parent.__qdFailed?.(String(reason)); } catch { /* not inside the portfolio page */ } };
  const bridge = parent !== window ? parent.__qdHud : null;
  if (!bridge) { document.addEventListener('DOMContentLoaded', () => { document.body.textContent = 'QuotaDeck 网页演示需要在作品集页面里打开。'; }); return; }
  window.hud = bridge;
  const load = el => new Promise((resolve, reject) => {
    el.onload = resolve;
    el.onerror = () => reject(new Error(`${el.getAttribute('src') || el.getAttribute('href')}: failed to load`));
  });
  addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('hud.html');
      if (!response.ok) throw new Error(`hud.html: HTTP ${response.status}`);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sheets = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(link => document.importNode(link, true));
      const tier = parent.__qdTier;
      if (tier === 'off' || tier === 'gentle') {
        const extra = document.createElement('link');
        extra.rel = 'stylesheet';
        extra.href = `/assets/quotadeck/hud-host-${tier}.css`;
        sheets.push(extra);
      }
      await Promise.all(sheets.map(sheet => { const done = load(sheet); document.head.append(sheet); return done; }));
      for (const node of [...doc.body.childNodes]) if (node.nodeName !== 'SCRIPT') document.body.append(document.importNode(node, true));
      for (const old of doc.querySelectorAll('script[src]')) {
        const script = document.createElement('script');
        script.src = old.getAttribute('src');
        const done = load(script);
        document.body.append(script);
        await done;
      }
    } catch (error) {
      fail(error.message);
    }
  });
})();
