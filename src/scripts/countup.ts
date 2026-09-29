const NUMBER = /\d[\d,]*(?:\.\d+)?/;

/** One number string scaled by k, keeping its decimals and thousands separators. */
function scale(digits: string, k: number): string {
  const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
  const v = Number(digits.replace(/,/g, '')) * Math.max(0, k);
  return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
}

/** Text at fraction k (0–1) of a count-up to `final`: the first number scales, its format and the surrounding text stay. */
export function countText(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  return final.replace(NUMBER, m => scale(m, k));
}

/** Like countText, but every number in the text counts up together. */
export function countEvery(final: string, k: number): string {
  if (k >= 1 || final.includes(':')) return final;
  return final.replace(new RegExp(NUMBER, 'g'), m => scale(m, k));
}
