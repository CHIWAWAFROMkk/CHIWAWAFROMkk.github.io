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
