import type { Tier } from './motion/tier';

export interface Pt { x: number; y: number }
/** SVG user space of the home page's trace; the SVG scales it to its box. */
export const TRACE_VIEW = { w: 640, h: 220 } as const;
/** Opacity of the idle edges over paper; tests keep it above the visibility floor (spec §7.3). */
export const TRACE_ALPHA = 0.32;

/** n steps on a shallow zigzag: even steps on the upper line, odd ones on the lower. */
export function traceNodes(n = 5): Pt[] {
  const padX = 48, top = 64, bottom = 156;
  return Array.from({ length: n }, (_, i) => ({ x: padX + (i * (TRACE_VIEW.w - 2 * padX)) / (n - 1), y: i % 2 === 0 ? top : bottom }));
}

/** A cubic edge that leaves and arrives horizontally. */
export function edgePath(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

/** The point at fraction p along edgePath(a, b). */
export function pointOnEdge(a: Pt, b: Pt, p: number): Pt {
  const mx = (a.x + b.x) / 2, u = 1 - p;
  return {
    x: u * u * u * a.x + 3 * u * u * p * mx + 3 * u * p * p * mx + p * p * p * b.x,
    y: u * u * u * a.y + 3 * u * u * p * a.y + 3 * u * p * p * b.y + p * p * p * b.y,
  };
}

export interface PulseState { edge: number; progress: number; done: number }

/** Where the pulse is t ms into the loop: it crosses the n-1 edges during the first `travel` of each period,
 *  ticking each step as it reaches it, then rests with every step ticked. edge -1 means resting. */
export function pulseAt(t: number, period: number, n = 5, travel = 0.6): PulseState {
  const phase = (((t % period) + period) % period) / period;
  if (phase >= travel) return { edge: -1, progress: 1, done: n };
  const x = (phase / travel) * (n - 1);
  const edge = Math.floor(x);
  return { edge, progress: x - edge, done: edge + 1 };
}

export function periodFor(tier: Tier): number {
  return tier === 'gentle' ? 15000 : 5000;
}
