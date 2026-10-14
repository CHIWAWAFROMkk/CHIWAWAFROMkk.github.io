import type { Tier } from './motion/tier';

export const SEEN_KEY = 'hyj-intro-seen';
export const INTRO_MS = 2400;
export const FONT_WAIT_MS = 800;

export const INTRO_GENTLE_MS = 800;
export type IntroMode = 'full' | 'gentle';

export function introMode(env: { seen: boolean; tier: Tier; fontsReady: boolean }): IntroMode | null {
  if (env.seen || env.tier === 'off' || !env.fontsReady) return null;
  return env.tier === 'gentle' ? 'gentle' : 'full';
}

/** Seconds into the intro at which letter k of line `line` appears: lines start 0.45 s apart, letters stream 35 ms apart. */
export function introLetterDelay(line: number, k: number): number {
  return Math.round((0.1 + line * 0.45 + k * 0.035) * 1000) / 1000;
}

export function readSeen(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSeen(storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked: the next visit is treated as a first visit, which is acceptable.
  }
}

/** true if p settles successfully within ms. */
export function withTimeout(p: Promise<unknown>, ms: number): Promise<boolean> {
  return Promise.race([
    p.then(() => true, () => false),
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), ms)),
  ]);
}
