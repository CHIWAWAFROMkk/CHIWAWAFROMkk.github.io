import type { Tier } from './tier';

const TOKEN = /[A-Za-z0-9]+(?:['’.+\-][A-Za-z0-9]+)*%?|\p{Script=Han}|\s+|[^\s]/gu;
const HAN = /^\p{Script=Han}$/u;
const WORD = /^[A-Za-z0-9]/;
const STOP = /^[，。、；：！？,.;:!?）)」』]$/u;

/** Splits text into the pieces a language model would stream: up to `han` Chinese characters or `words` Latin words,
 *  breaking after punctuation and where Chinese meets Latin. Joining the pieces gives back the text exactly. */
export function chunkText(text: string, size = { han: 3, words: 2 }): string[] {
  const chunks: string[] = [];
  let cur = '', h = 0, w = 0;
  const flush = () => { if (cur) chunks.push(cur); cur = ''; h = 0; w = 0; };
  for (const t of text.match(TOKEN) ?? []) {
    if (/^\s+$/.test(t)) { cur += t; if (w >= size.words) flush(); continue; }
    const isHan = HAN.test(t), isWord = !isHan && WORD.test(t);
    if (h >= size.han || w >= size.words || (isHan && w > 0) || (isWord && h > 0)) flush();
    cur += t;
    if (isHan) h++;
    else if (isWord) w++;
    if (STOP.test(t)) flush();
  }
  flush();
  return chunks;
}

/** Milliseconds between chunks. */
export function streamStep(tier: Tier): number {
  return tier === 'gentle' ? 70 : 45;
}
