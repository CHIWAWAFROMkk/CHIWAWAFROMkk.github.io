/** Which numbers in a sentence are counts worth counting up: "约 2000 名员工", "23 段", "2,000 employees".
 *  Dates, versions, times, ranges, decimals and percentages stay as they are, and so do years
 *  ("2027 届", "2026.08") and small numbers, where counting adds nothing. */
export interface Segment { text: string; count: boolean }

const CJK_UNIT = /^\s?[名张段条个项份位次家页道行人所篇种组轮]/;
const EN_UNIT = /^\s[a-z]/i;

export function countableSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(/\d{1,3}(?:,\d{3})+|\d+/g)) {
    const start = m.index!, end = start + m[0].length;
    const before = text[start - 1] ?? '', after = text.slice(end);
    const n = Number(m[0].replace(/,/g, ''));
    const joined = /[\d.:/\-–—~～]/.test(before) || /^[\d.:/\-–—~～%％]/.test(after);
    const unit = CJK_UNIT.test(after) || (EN_UNIT.test(after) && !/^\s(?:to|and|or)\b/i.test(after));
    const yearLike = !m[0].includes(',') && n >= 1900 && n <= 2099 && !CJK_UNIT.test(after) && !/^\s[a-z]+s\b/i.test(after);
    const ok = !joined && unit && n >= 10 && !yearLike;
    if (!ok) continue;
    if (start > last) out.push({ text: text.slice(last, start), count: false });
    out.push({ text: m[0], count: true });
    last = end;
  }
  if (last < text.length) out.push({ text: text.slice(last), count: false });
  return out;
}
