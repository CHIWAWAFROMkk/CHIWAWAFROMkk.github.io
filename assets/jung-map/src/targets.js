function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleTargets(rgba, w, h, n, { threshold = 0.3, seed = 1 } = {}) {
  const lit = [];
  for (let i = 0; i < w * h; i++) {
    const lum = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) / 255;
    if (lum >= threshold) lit.push(i);
  }
  const out = new Float32Array(n * 3);
  if (lit.length === 0) return out;
  const rand = mulberry32(seed);
  for (let k = 0; k < n; k++) {
    const idx = lit[Math.floor(rand() * lit.length)];
    const px = idx % w, py = Math.floor(idx / w);
    out[k * 3] = (px + 0.5) / w * 2 - 1;
    out[k * 3 + 1] = 1 - (py + 0.5) / h * 2;
    out[k * 3 + 2] = (rand() * 2 - 1) * 0.2;
  }
  return out;
}
