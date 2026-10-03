const TIERS = ['high', 'low', 'none'];

// override 只能往“更保守”的方向改：想强制 high 时，自动推断的结果也必须是 high。
export function chooseTier({ webgl2, reducedMotion, coarse, cores, override }) {
  if (!webgl2) return 'none';
  const auto = reducedMotion || coarse || cores <= 4 ? 'low' : 'high';
  if (!TIERS.includes(override)) return auto;
  if (override === 'high') return auto;
  return override;
}
