import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge not found; add its path to tools/print-resume.mjs');

const src = pathToFileURL(resolve('tools/resume-en.html')).href;
const out = resolve('public/downloads/resume/heyanjun-resume-en.pdf');
mkdirSync(resolve('public/downloads/resume'), { recursive: true });
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${out}`, src], { stdio: 'inherit' });

const size = statSync(out).size;
if (size < 10_000) throw new Error(`PDF looks empty (${size} bytes)`);
console.log(`wrote ${out} (${size} bytes)`);
