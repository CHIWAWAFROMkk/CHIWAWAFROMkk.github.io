/** Numbers that are UI ordinals or product names, not claims. */
export const ALLOWED_TOKENS = ['01', '02', '1:00'];
// Names, not claims: a product, record ids, an exam, a licence (Apache-2.0) and QuotaDeck's release (package.json at 974c61d).
const ALLOWED_PATTERNS = [/Microsoft 365/g, /DEMO-\d+/g, /CET-6/g, /Apache-2\.0/g, /\b0\.6\.0\b/g];

export function stripAllowed(text: string): string {
  let out = text;
  for (const re of ALLOWED_PATTERNS) out = out.replace(re, ' ');
  return out;
}

/** '2026.03—2026.06 · 4–5 天 · 12/23 · 5%' → ['2026.03', '2026.06', '4–5', '12/23', '5%'] */
export function digitTokens(text: string): string[] {
  return (stripAllowed(text).match(/\d[\d,.:–/]*\d%?|\d%?/g) ?? []).filter(t => !ALLOWED_TOKENS.includes(t));
}

/** Numbers in text that are not, as whole tokens, numbers of the ledger corpus. */
export function strayTokens(text: string, corpus: string): string[] {
  const allowed = new Set(digitTokens(corpus));
  return digitTokens(text).filter(t => !allowed.has(t));
}
