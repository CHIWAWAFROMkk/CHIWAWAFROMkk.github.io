const DIGITS = '0123456789';

/** A decoding frame: characters left of the lock point are final; digits right of it are noise; everything else stays. */
export function scrambleText(final: string, k: number, rand: () => number): string {
  if (k >= 1) return final;
  const lock = Math.floor(final.length * Math.max(0, k));
  let out = '';
  for (let i = 0; i < final.length; i++) out += i < lock || !/\d/.test(final[i]) ? final[i] : DIGITS[Math.floor(rand() * 10)];
  return out;
}
