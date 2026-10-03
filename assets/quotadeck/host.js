// Hosts QuotaDeck's tray UI exactly as published: points window.quotaDeck at the bridge the portfolio page provides,
// copies compact.html's stylesheet link and body (its script tag excluded) into this document, then runs compact.js.
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
  for (const node of [...doc.body.childNodes]) if (node.nodeName !== 'SCRIPT') document.body.append(document.importNode(node, true));
  const script = document.createElement('script');
  script.src = doc.querySelector('script[src]').getAttribute('src');
  script.onerror = () => parent.__quotaDeckFailed?.('compact.js');
  document.body.append(script);
})().catch(error => parent.__quotaDeckFailed?.(String(error && error.message || error)));
