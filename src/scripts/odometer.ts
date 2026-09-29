/** Odometer layout: which characters spin, and how far. Pure. */
export interface Slot { digit: number | null; char: string }

export function slots(text: string): Slot[] {
  return [...text].map(char => ({ digit: /\d/.test(char) ? Number(char) : null, char }));
}

/** Reel rows (each row 1em; the strip holds 0–9 three times): start in the first or second turn, stop in the third. */
export function reelRows(from: number | null, to: number): { from: number; to: number } {
  return { from: from === null ? 0 : 10 + from, to: 20 + to };
}
