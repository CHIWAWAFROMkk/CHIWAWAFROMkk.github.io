/** Text at fraction k (0–1) of a count-up to `final`: the first number scales, its format and the surrounding text stay. */
export function countText(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  const m = final.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/s);
  if (!m) return final;
  const [, pre, digits, post] = m;
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  const v = Number(digits.replace(/,/g, '')) * Math.max(0, k);
  return pre + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US')) + post;
}
