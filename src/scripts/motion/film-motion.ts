/** Film pages: one-shot picture reveals that only change opacity and transform.
 *  [data-fm="bloom"]      a grayscale copy over the still fades out, so the one red appears last.
 *  [data-fm="letterbox"]  two bars over the video retract like a widening screen.
 *  Shares arm.ts: only pictures still below the fold are armed; without JS or with reduced
 *  motion the bars and the copy are never shown at all. */
import { armOnScroll } from './arm';

export function initFilmMotion(root: ParentNode = document): () => void {
  return armOnScroll(root.querySelectorAll<HTMLElement>('[data-fm]'), { margin: '0px 0px -22% 0px' });
}
