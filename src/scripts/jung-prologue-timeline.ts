/** Timeline of the Jung page's opening: the film's keyframes, each held and slowly pushed in, joined the way the film
 *  joins them (a dissolve or a push-through). Pure functions of time, so the picture is fully determined by t. */

export const HOLD = 4.2;                  // seconds a picture stays alone on screen
export const TRANS = 1.2;                 // seconds of a transition
export const PERIOD = HOLD + TRANS;
const LIFE = HOLD + 2 * TRANS;            // a picture is visible from the start of the transition into it to the end of the one out of it
const DRIFT = 0.06;                       // slow push-in over a picture's life
const PUSH_OUT = 0.35;                    // push-through: the outgoing picture grows by this much…
const PUSH_IN = 0.15;                     // …while the incoming one settles from this much larger

/** How picture i hands over to picture i + 1 (the last one loops back to the first). */
export const KINDS = ['dissolve', 'push', 'dissolve', 'push', 'dissolve', 'dissolve'] as const;
export type Kind = (typeof KINDS)[number];

export interface Shot {
  a: number;          // main picture
  b: number;          // incoming picture
  mix: number;        // 0 = only a, 1 = only b
  zoomA: number;
  zoomB: number;
  quote: number;      // opacity of picture a's line
  kind: Kind;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const drift = (life: number) => 1 + DRIFT * clamp01(life / LIFE);

export function shotAt(t: number, n: number): Shot {
  const loop = n * PERIOD;
  let local = t % loop;
  if (local < 0) local += loop;
  const a = Math.min(n - 1, Math.floor(local / PERIOD + 1e-9));   // the epsilon keeps exact boundaries on the new picture
  const b = (a + 1) % n;
  const u = Math.max(0, local - a * PERIOD);          // time since picture a became the main one
  const kind = KINDS[a % KINDS.length];
  const p = u <= HOLD ? 0 : smooth((u - HOLD) / TRANS);
  let zoomA = drift(u + TRANS);                       // a has been visible since TRANS before it became main
  let zoomB = drift(Math.max(0, u - HOLD));
  if (kind === 'push' && p > 0) {
    zoomA *= 1 + PUSH_OUT * p;
    zoomB *= 1 + PUSH_IN * (1 - p);
  }
  const quote = u >= HOLD ? 0 : Math.min(smooth((u - 0.5) / 0.6), smooth((HOLD - u) / 0.6));
  return { a, b, mix: p, zoomA, zoomB, quote, kind };
}

/** The progress bar: 1 for pictures already shown in this loop, the share of its period for the current one, 0 for the rest. */
export function segmentProgress(t: number, n: number): number[] {
  const loop = n * PERIOD;
  let local = t % loop;
  if (local < 0) local += loop;
  const a = Math.min(n - 1, Math.floor(local / PERIOD + 1e-9));
  const within = Math.min(1, Math.max(0, (local - a * PERIOD) / PERIOD));
  return Array.from({ length: n }, (_, i) => (i < a ? 1 : i === a ? within : 0));
}
