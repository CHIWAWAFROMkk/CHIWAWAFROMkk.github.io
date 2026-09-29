/** How many particles a device gets: phones and touch screens take the lighter load. */
export function particleBudget(width: number, coarse: boolean): number {
  return width < 800 || coarse ? 50000 : 200000;
}

export type Quality = 'full' | 'reduced' | 'static';

/** After a short probe: below 40 fps halve the work; below 20 give up on the film and show the static opening. */
export function decideQuality(avgFps: number): Quality {
  if (avgFps < 20) return 'static';
  if (avgFps < 40) return 'reduced';
  return 'full';
}

/** Frame-rate probe: counts only real frame intervals (gaps over 100 ms mean the film was offscreen or the tab was hidden)
 *  and decides after 90 counted frames or two counted seconds, whichever comes first. */
export interface Probe { frames: number; time: number; done: boolean }
export const PROBE_START: Probe = { frames: 0, time: 0, done: false };

export function probeStep(p: Probe, dtMs: number): { next: Probe; fps: number | null } {
  if (p.done || dtMs <= 0 || dtMs > 100) return { next: p, fps: null };
  const next = { frames: p.frames + 1, time: p.time + dtMs, done: false };
  if (next.frames >= 90 || next.time >= 2000) return { next: { ...next, done: true }, fps: (next.frames * 1000) / next.time };
  return { next, fps: null };
}
