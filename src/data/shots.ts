import { readFileSync } from 'node:fs';
import { SITE } from './site';

type Size = { file: string; w: number; h: number };
const manifest = () => JSON.parse(readFileSync('public/media/live-previews/manifest.json', 'utf8')) as Record<string, Size & { crop: Size }>;

/** The three live-edition details with their copy, read at build time from tools/live-shots.mjs's manifest. */
export function productShots() {
  const m = manifest();
  return SITE.shots.items.map(item => ({ ...item, img: m[item.id].crop }));
}
