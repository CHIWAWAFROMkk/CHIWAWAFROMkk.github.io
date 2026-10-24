import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge not found; add its path to tools/print-resume.mjs');

// The AI site's English résumé, and the HRIS site's own HR résumé in both languages.
const JOBS = [
  ['tools/resume-en.html', 'heyanjun-resume-en.pdf'],
  ['tools/resume-hr-zh.html', 'heyanjun-resume-hr-zh.pdf'],
  ['tools/resume-hr-en.html', 'heyanjun-resume-hr-en.pdf'],
];
mkdirSync(resolve('public/downloads/resume'), { recursive: true });
for (const [html, pdf] of JOBS) {
  const src = pathToFileURL(resolve(html)).href;
  const out = resolve('public/downloads/resume', pdf);
  // A profile of its own per run, so Edge cannot hand the job to an instance still exiting and return before the file exists.
  const profile = mkdtempSync(join(tmpdir(), 'print-resume-'));
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${profile}`, `--print-to-pdf=${out}`, src], { stdio: 'inherit' });
  rmSync(profile, { recursive: true, force: true });
  const size = statSync(out).size;
  if (size < 10_000) throw new Error(`PDF looks empty (${size} bytes)`);
  console.log(`wrote ${out} (${size} bytes)`);
}
