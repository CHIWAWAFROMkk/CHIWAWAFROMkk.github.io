/**
 * The final cut of Mais je t'aime, transcribed row by row from
 * D:\Users\yoshi\AgentWorkspace\MaisJeTaime\成片\edit_60s.py — SHOTS (lines 26–49), END (line 51), TRANS (lines 54–57).
 * A row is (shot, source clip, source in, source out, start in the film, desaturated in the edit); a slot runs to the
 * next row's start. S02 was generated but is not in the cut: S01 runs on to 7.17 s in its place.
 */
export interface EditRow { id: string; src: string | null; inPt: number; outPt: number; start: number; gray: boolean }
export interface Slot extends EditRow { stop: number; speed: number | null }

export const FPS = 24;
export const END = 60.0;
const S16_SP = 3.6667 / 4.25;
/** S16 holds a white frame and a black frame (frames 6 and 7), slowed slightly so the white one lands on the 44.17 s gunshot. */
export const S16_START = 44.17 - (6 / 24) / S16_SP;

export const EDIT: readonly EditRow[] = [
  { id: 'S00', src: null, inPt: 0, outPt: 0, start: 0.00, gray: false },
  { id: 'S01', src: 'S01_即梦_01', inPt: 0.1, outPt: 5.0, start: 2.17, gray: false },
  { id: 'S03', src: 'S03_可灵_01', inPt: 0.0, outPt: 5.04, start: 7.17, gray: false },
  { id: 'S04', src: 'S04_即梦_02', inPt: 0.0, outPt: 4.5, start: 12.17, gray: false },
  { id: 'S05a', src: 'S05a_即梦_05', inPt: 0.3, outPt: 2.7, start: 16.17, gray: true },
  { id: 'S05b', src: 'S05b_即梦_01', inPt: 0.5, outPt: 3.5, start: 18.17, gray: true },
  { id: 'S06', src: 'S06_即梦_01', inPt: 0.3, outPt: 3.5, start: 20.17, gray: true },
  { id: 'S07', src: 'S07_即梦_01_去色', inPt: 0.8, outPt: 4.8, start: 22.17, gray: true },
  { id: 'S08', src: 'S08_即梦_01_去色', inPt: 0.5, outPt: 4.5, start: 24.17, gray: true },
  { id: 'S09', src: 'S09_即梦_01_去色', inPt: 0.2, outPt: 4.2, start: 26.17, gray: true },
  { id: 'S10', src: 'S10_即梦_01_去色', inPt: 0.2, outPt: 4.2, start: 28.17, gray: true },
  { id: 'S11', src: 'S11_即梦_01_去色', inPt: 0.3, outPt: 4.3, start: 32.17, gray: true },
  { id: 'S12', src: 'S12_可灵_01', inPt: 0.0, outPt: 2.3, start: 34.17, gray: true },
  { id: 'S13', src: 'S13_可灵_01_去色', inPt: 0.0, outPt: 4.5, start: 36.17, gray: true },
  { id: 'S14a', src: 'S14a_可灵_01', inPt: 0.5, outPt: 1.3, start: 40.17, gray: false },
  { id: 'S14b', src: 'S14b_可灵_01', inPt: 0.2, outPt: 1.0, start: 40.98, gray: false },
  { id: 'S14c', src: 'S14c_可灵_01', inPt: 4.0, outPt: 5.0, start: 41.79, gray: false },
  { id: 'S15', src: 'S15_可灵_01', inPt: 0.3, outPt: 2.3, start: 42.60, gray: false },
  { id: 'S16', src: 'S16_定稿_即梦03剪辑', inPt: 0.0, outPt: 3.6667, start: S16_START, gray: false },
  { id: 'S17', src: 'S17_可灵_01', inPt: 0.3, outPt: 5.0, start: 48.17, gray: false },
  { id: 'S18', src: 'S18_可灵_01', inPt: 1.5, outPt: 5.0, start: 52.17, gray: false },
  { id: 'S19', src: 'S19_即梦_01', inPt: 1.0, outPt: 4.4, start: 54.17, gray: false },
  { id: 'S20', src: 'S20_可灵_01_后期上升', inPt: 0.0, outPt: 5.0, start: 56.17, gray: false },
  { id: 'S21', src: null, inPt: 0, outPt: 0, start: 59.40, gray: false },
];

/** Cuts not listed here are hard cuts. */
export const TRANSITIONS: readonly { at: number; kind: 'dissolve' | 'dip'; dur: number }[] = [
  { at: 7.17, kind: 'dissolve', dur: 0.5 }, { at: 16.17, kind: 'dissolve', dur: 0.4 }, { at: 18.17, kind: 'dissolve', dur: 0.25 },
  { at: 20.17, kind: 'dissolve', dur: 0.4 }, { at: 22.17, kind: 'dissolve', dur: 0.4 }, { at: 24.17, kind: 'dissolve', dur: 0.4 },
  { at: 26.17, kind: 'dissolve', dur: 0.4 }, { at: 28.17, kind: 'dip', dur: 0.4 }, { at: 48.17, kind: 'dissolve', dur: 0.5 },
  { at: 54.17, kind: 'dissolve', dur: 0.3 }, { at: 56.17, kind: 'dissolve', dur: 0.6 },
];

/** Vocals enter with S04, the gunshot is S16's white frame, the music collapses with S18. */
export const BEATS: readonly { key: 'vocal' | 'shot' | 'turn'; at: number; label: string }[] = [
  { key: 'vocal', at: 12.17, label: '0:12' }, { key: 'shot', at: 44.17, label: '0:44' }, { key: 'turn', at: 52.17, label: '0:52' },
];

const fr = (t: number) => Math.round(t * FPS);

/** Each row with its end and its speed (source seconds ÷ whole frames of the slot, as edit_60s.py renders it). */
export function slots(): Slot[] {
  return EDIT.map((r, i) => {
    const stop = i + 1 < EDIT.length ? EDIT[i + 1].start : END;
    const speed = r.src === null ? null : (r.outPt - r.inPt) / ((fr(stop) - fr(r.start)) / FPS);
    return { ...r, stop, speed };
  });
}
