export const SEEN_KEY = 'hyj-intro-seen';
export const INTRO_MS = 2400;
export const FONT_WAIT_MS = 800;

export interface IntroEnv { seen: boolean; reducedMotion: boolean; fontsReady: boolean }

export function shouldPlayIntro(env: IntroEnv): boolean {
  return !env.seen && !env.reducedMotion && env.fontsReady;
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
