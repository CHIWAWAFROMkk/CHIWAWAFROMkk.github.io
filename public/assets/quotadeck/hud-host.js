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
  // The desktop HUD is driven by the mouse: the strip opens a card on pointerup, and alert capsules are not focusable.
  // For keyboard users on the web page, a keyboard-made click (detail 0) on a strip icon becomes the press the strip
  // expects, and capsules join the tab order and answer Enter and Space. Nothing in the vendored files changes.
  function keyboard() {
    document.addEventListener('click', event => {
      const item = event.detail === 0 && event.target.closest?.('#strip .item');
      if (!item) return;
      const at = { bubbles: true, button: 0, screenX: 0, screenY: 0, pointerId: 1 };
      item.dispatchEvent(new PointerEvent('pointerdown', at));
      item.dispatchEvent(new PointerEvent('pointerup', at));
    }, true);
    const focusable = () => document.querySelectorAll('.alert-pill:not([tabindex])').forEach(pill => { pill.tabIndex = 0; });
    new MutationObserver(focusable).observe(document.body, { childList: true, subtree: true });
    focusable();
    document.addEventListener('keydown', event => {
      const pill = event.target.closest?.('.alert-pill');
      if (!pill || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      pill.click();
    });
  }
  addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('hud.html');
      if (!response.ok) throw new Error(`hud.html: HTTP ${response.status}`);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sheets = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(link => document.importNode(link, true));
      // Focus rings for keyboard users (the desktop HUD is mouse-only); a file, since the host's CSP allows no inline style.
      const a11y = document.createElement('link');
      a11y.rel = 'stylesheet';
      a11y.href = '/assets/quotadeck/hud-host-a11y.css';
      sheets.push(a11y);
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
      keyboard();
    } catch (error) {
      fail(error.message);
    }
  });
})();
