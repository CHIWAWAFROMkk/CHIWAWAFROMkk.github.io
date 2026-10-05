// Hosts QuotaDeck's tray UI exactly as published: points window.quotaDeck at the bridge the portfolio page provides,
// copies compact.html's stylesheet link and body (its script tag excluded) into this document, then runs compact.js.
// The vendored files stay byte-identical (tests check their SHA-256). Two exhibition-only adjustments live here instead:
// the faint helper ink is darkened to reach 4.5:1 on every paper tone, and keyboard focus survives a filter re-render.
(async () => {
  const bridge = parent !== window ? parent.__quotaDeckBridge : null;
  if (!bridge) { document.body.textContent = 'QuotaDeck 网页演示需要在作品集页面里打开。'; return; }
  window.quotaDeck = bridge;
  const response = await fetch('compact.html');
  if (!response.ok) throw new Error(`compact.html: HTTP ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const el = document.importNode(link, true);
    el.onerror = () => parent.__quotaDeckFailed?.(`${link.getAttribute('href')}: failed to load`);
    document.head.append(el);
  }
  const legible = document.createElement('style');
  legible.textContent = ':root{--ink-3:#6b6356}@media (prefers-color-scheme: dark){:root{--ink-3:#9a9183}}';
  document.head.append(legible);
  for (const node of [...doc.body.childNodes]) if (node.nodeName !== 'SCRIPT') document.body.append(document.importNode(node, true));
  // compact.js re-renders the filter buttons on click; give focus back to the same filter so keyboard use is not interrupted.
  document.addEventListener('click', event => {
    const pressed = event.target instanceof Element ? event.target.closest('[data-filter]') : null;
    if (!pressed) return;
    const value = pressed.dataset.filter;
    setTimeout(() => {                                  // after compact.js has handled the same click (its listener may run after this one)
      if (document.activeElement && document.activeElement !== document.body) return;
      const again = [...document.querySelectorAll('[data-filter]')].find(b => b.dataset.filter === value);
      if (again) again.focus();
    });
  });
  const script = document.createElement('script');
  script.src = doc.querySelector('script[src]').getAttribute('src');
  script.onerror = () => parent.__quotaDeckFailed?.('compact.js');
  document.body.append(script);
})().catch(error => parent.__quotaDeckFailed?.(String(error && error.message || error)));
