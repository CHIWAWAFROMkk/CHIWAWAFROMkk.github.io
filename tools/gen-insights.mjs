// Regenerates the insights data: npm run insights:gen (run from the repository root).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { loadSqlJs } from './sqljs-node.mjs';
import { generate } from './insights-gen.mjs';
import { QUERIES, ALL, runQueries } from '../src/scripts/insights-queries.mjs';

const SQL = await loadSqlJs();
const { db, bytes } = generate(SQL, readFileSync('public/assets/delivery-schema.sql', 'utf8'));
const results = runQueries(db, Object.keys(QUERIES), ALL);
db.close();

mkdirSync('public/assets/insights', { recursive: true });
mkdirSync('public/downloads/insights', { recursive: true });
writeFileSync('public/assets/insights/campus-term.sqlite', bytes);
writeFileSync('src/data/insights.json', JSON.stringify({ results }) + '\n');
copyFileSync('tools/insights-gen.mjs', 'public/downloads/insights/insights-gen.mjs');
copyFileSync('src/scripts/insights-queries.mjs', 'public/downloads/insights/insights-queries.mjs');
console.log(`orders ${results.kpi.values[0][0]} · ${bytes.length} bytes`);
