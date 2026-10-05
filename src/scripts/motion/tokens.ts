/** Shared motion contract from the 2026-10-05 design. */
export const MOTION = {
  ease: 'cubic-bezier(.2,.8,.2,1)', quick: 0.2, reveal: 0.6, title: 0.9,
  staggerChar: 0.04, staggerRow: 0.07, staggerBlock: 0.09, magnetMax: 6,
} as const;
export function prefersMotion(): boolean {
  return typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function isCoarse(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}
export function magnetOffset(dx: number, dy: number, strength: number, max: number): { x: number; y: number } {
  if (![dx, dy, strength, max].every(Number.isFinite) || strength <= 0 || max <= 0) return { x: 0, y: 0 };
  const x = dx / strength, y = dy / strength, length = Math.hypot(x, y);
  const scale = length > max ? max / length : 1;
  return { x: x * scale || 0, y: y * scale || 0 };
}
export function splitUnits(text: string): 'chars' | 'words' {
  return /[㐀-鿿豈-﫿]/.test(text) ? 'chars' : 'words';
}
