// Picture colour and soundtrack peaks of the finished Mais je t'aime film, every 0.1 s, for the edit desk.
// Run once after the film changes: node tools/film-signals.mjs   (set FFMPEG to override the ffmpeg path)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const FF = process.env.FFMPEG ?? 'C:/Users/yoshi/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const FILM = 'public/media/mais-je-taime/video/film-60s.mp4';
const OUT = 'public/media/mais-je-taime/film-signals.json';
const FPS = 10, N = 600, SR = 8000, PER = SR / FPS;

const run = args => execFileSync(FF, ['-v', 'error', '-i', FILM, ...args, '-'], { maxBuffer: 1 << 28 });

// One frame every 0.1 s, scaled to a single pixel with area averaging = the frame's mean colour.
const rgb = run(['-vf', `fps=${FPS},scale=1:1:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24']);
const hex = v => v.toString(16).padStart(2, '0');
const colors = Array.from({ length: N }, (_, i) => {
  const j = Math.min(i, rgb.length / 3 - 1) * 3;
  return `#${hex(rgb[j])}${hex(rgb[j + 1])}${hex(rgb[j + 2])}`;
});

// Mono 8 kHz PCM; the loudest sample in each 0.1 s, normalised to the loudest in the film.
const pcm = run(['-vn', '-ac', '1', '-ar', String(SR), '-f', 's16le']);
const raw = Array.from({ length: N }, (_, i) => {
  let m = 0;
  for (let k = i * PER; k < (i + 1) * PER && 2 * k + 1 < pcm.length; k++) m = Math.max(m, Math.abs(pcm.readInt16LE(2 * k)));
  return m;
});
const top = Math.max(...raw) || 1;
const peaks = raw.map(m => Math.round((m / top) * 1000) / 1000);

writeFileSync(OUT, JSON.stringify({ fps: FPS, colors, peaks }) + '\n');
console.log(`${OUT}: ${colors.length} colours, ${peaks.length} peaks`);
