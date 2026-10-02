import { END } from '../data/film-edit';

/** Film time → percentage across the track (0–100), clamped. */
export const pct = (t: number): number => (Math.min(Math.max(t, 0), END) / END) * 100;

/** A click x pixels into a track of the given width → film time, clamped. */
export const timeAt = (x: number, width: number): number => (width > 0 ? Math.min(Math.max(x / width, 0), 1) * END : 0);

/** 43.88 → '0:43.9'; rounds to tenths first so 59.99 becomes '1:00.0', not '0:60.0'. */
export function clock(t: number): string {
  const tenths = Math.round(Math.max(0, t) * 10);
  const m = Math.floor(tenths / 600);
  return `${m}:${((tenths - m * 600) / 10).toFixed(1).padStart(4, '0')}`;
}

export const speedLabel = (v: number): string => `${v.toFixed(2)}×`;

/** The next index in a direction, kept inside 0…len-1 (a missing index counts as before the first). */
export const stepIndex = (len: number, i: number, dir: 1 | -1): number => Math.min(Math.max(i + dir, 0), len - 1);
