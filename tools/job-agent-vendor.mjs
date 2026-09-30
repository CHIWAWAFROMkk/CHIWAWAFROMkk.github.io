// npm run job-agent:vendor — copies the matching engine, unmodified, from a checkout of the public repository pinned to
// one commit. Usage: JOB_AGENT_ROOT=<personal-job-agent checkout> npm run job-agent:vendor
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const COMMIT = '4397ded9c603e7e26d3dc241eb910ce3ad0a749a';
const MODULES = ['__init__', 'constants', 'models/__init__', 'models/application', 'models/application_tracking', 'models/base',
  'models/commute', 'models/interview_debrief', 'models/job', 'models/job_record', 'models/profile', 'services/__init__',
  'services/application_pack', 'services/job_repository', 'services/local_matcher', 'services/tracking_parser'];
const COPY = [...MODULES.map(m => [`src/job_agent/${m}.py`, `job_agent/${m}.py`]), ['tests/helpers.py', 'tests/helpers.py'], ['LICENSE', 'LICENSE']];

const root = process.env.JOB_AGENT_ROOT;
if (!root) { console.error('Set JOB_AGENT_ROOT to a checkout of https://github.com/CHIWAWAFROMkk/personal-job-agent'); process.exit(1); }
const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== COMMIT) { console.error(`The checkout is at ${head}; run: git -C "${root}" checkout ${COMMIT}`); process.exit(1); }
const out = `public/assets/py/job-agent/${COMMIT.slice(0, 7)}`;
const files = COPY.map(([from, to]) => {
  const bytes = readFileSync(join(root, from));
  mkdirSync(dirname(join(out, to)), { recursive: true });
  writeFileSync(join(out, to), bytes);
  return { path: to, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ repository: 'https://github.com/CHIWAWAFROMkk/personal-job-agent', commit: COMMIT, files }, null, 2) + '\n');
console.log(`${files.length} files → ${out}`);
