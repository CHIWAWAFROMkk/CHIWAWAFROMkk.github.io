export const EXPAND_MS = 520;

export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

/** Only a plain primary click gets the expand animation; modified clicks (new tab/window) stay native. */
export function shouldAnimateClick(e: ClickLike, reducedMotion: boolean): boolean {
  return !reducedMotion && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
