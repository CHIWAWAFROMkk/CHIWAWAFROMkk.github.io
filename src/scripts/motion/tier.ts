/** Motion tiers (spec §7.3). Base.astro's inline script writes <html data-motion> before first paint with the same rules
 *  as pickTier; everything else reads it through currentTier(). */
export type Tier = 'full' | 'gentle' | 'lite' | 'off';
export type Choice = 'full' | 'gentle' | 'off';
export const MOTION_KEY = 'hyj-motion';
export const CHOICES: readonly Choice[] = ['full', 'gentle', 'off'];
export const SLOW_FPS = 30;

export interface TierEnv { choice: string | null; reduced: boolean; saveData: boolean; deviceMemory?: number }

export function pickTier(env: TierEnv): Tier {
  if (CHOICES.includes(env.choice as Choice)) return env.choice as Choice;
  if (env.reduced) return 'gentle';
  if (env.saveData || (env.deviceMemory !== undefined && env.deviceMemory <= 4)) return 'lite';
  return 'full';
}

export function currentTier(doc: Document = document): Tier {
  const t = doc.documentElement.dataset.motion;
  return t === 'gentle' || t === 'lite' || t === 'off' ? t : 'full';
}

/** Anything moves at all: one-shot fades included. */
export const anyMotion = (): boolean => typeof document !== 'undefined' && currentTier() !== 'off';
/** Travelling motion (slides, splits, parallax, magnets): full and lite only. */
export const fullMotion = (): boolean => {
  if (typeof document === 'undefined') return false;
  const t = currentTier();
  return t === 'full' || t === 'lite';
};

export function averageFps(stamps: readonly number[]): number {
  if (stamps.length < 2) return Infinity;
  return ((stamps.length - 1) * 1000) / (stamps[stamps.length - 1] - stamps[0]);
}

export function readChoice(): Choice | null {
  try {
    const c = localStorage.getItem(MOTION_KEY);
    return CHOICES.includes(c as Choice) ? (c as Choice) : null;
  } catch {
    return null;
  }
}

/** Stores the visitor's tier and applies it to this page. Returns false when storage is blocked, so the caller knows a
 *  reload would fall back to the automatic tier. */
export function saveChoice(c: Choice): boolean {
  document.documentElement.dataset.motion = c;
  try { localStorage.setItem(MOTION_KEY, c); return true; } catch { return false; }
}

/** Samples the first frames of a visible page; a page that cannot hold 30 fps drops from full to lite.
 *  A hidden tab has no frames to measure, and a visitor who chose a tier is never second-guessed. */
export function watchFps(doc: Document = document, frames = 60): void {
  if (doc.visibilityState !== 'visible' || currentTier(doc) !== 'full' || readChoice() !== null) return;
  const stamps: number[] = [];
  const tick = (t: number) => {
    if (doc.visibilityState !== 'visible') return;
    stamps.push(t);
    if (stamps.length < frames) { requestAnimationFrame(tick); return; }
    if (averageFps(stamps) < SLOW_FPS && currentTier(doc) === 'full') doc.documentElement.dataset.motion = 'lite';
  };
  requestAnimationFrame(tick);
}
