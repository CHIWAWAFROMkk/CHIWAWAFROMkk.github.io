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

// The AI site's résumé and the HRIS site's own HR résumé, each in both languages.
const JOBS = [
  ['tools/resume-zh.html', 'heyanjun-resume-zh.pdf'],
  ['tools/resume-en.html', 'heyanjun-resume-en.pdf'],
  ['tools/resume-hr-zh.html', 'heyanjun-resume-hr-zh.pdf'],
  ['tools/resume-hr-en.html', 'heyanjun-resume-hr-en.pdf'],
];
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Edge's launcher can return before its browser process has written the PDF: wait until the file exists and stops growing. */
function waitForFile(out) {
  let last = -1;
  for (let i = 0; i < 120; i++) {
    sleep(250);
    if (!existsSync(out)) continue;
    const size = statSync(out).size;
    if (size > 0 && size === last) return size;
    last = size;
  }
  throw new Error(`${out} was not written within 30 s`);
}

mkdirSync(resolve('public/downloads/resume'), { recursive: true });
// One at a time, or ONLY=<file name part> to print just the matching ones.
for (const [html, pdf] of JOBS.filter(([, pdf]) => !process.env.ONLY || pdf.includes(process.env.ONLY))) {
  const src = pathToFileURL(resolve(html)).href;
  const out = resolve('public/downloads/resume', pdf);
  rmSync(out, { force: true });
  // A profile of its own per run, so Edge cannot hand the job to an instance that is still running.
  const profile = mkdtempSync(join(tmpdir(), 'print-resume-'));
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${profile}`, `--print-to-pdf=${out}`, src], { stdio: 'inherit' });
  const size = waitForFile(out);
  // Edge may still hold the profile for a moment; a leftover temp folder is harmless.
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* left for the OS to clean */ }
  if (size < 10_000) throw new Error(`PDF looks empty (${size} bytes)`);
  console.log(`wrote ${out} (${size} bytes)`);
}
