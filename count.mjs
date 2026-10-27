// Counts the code you have to own in each version, with a real tokenizer rather
// than a guess. Test scaffolding is excluded from both sides: verify/ is how the
// two are held to the same standard, not part of either app.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { encode } from 'gpt-tokenizer';

const ROOT = import.meta.dirname;
// what every application ever built needs, versus what is actually yours
const INFRASTRUCTURE = new Set(['db.mjs', 'auth.mjs', 'server.mjs', 'setup.mjs', 'main.js']);

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p));
    else if (['.mjs', '.js'].includes(extname(name))) out.push(p);
  }
  return out;
}

async function measure(dirName) {
  const files = await walk(join(ROOT, dirName));
  const rows = [];
  for (const f of files.sort()) {
    const src = await readFile(f, 'utf8');
    const base = f.split('/').pop();
    rows.push({
      file: relative(ROOT, f),
      kind: INFRASTRUCTURE.has(base) ? 'infrastructure' : 'your product',
      lines: src.split('\n').filter((l) => l.trim()).length,
      tokens: encode(src).length,
    });
  }
  return rows;
}

const scratch = await measure('from-scratch');
const backend = await measure('on-a-backend');

const sum = (rows, kind) => rows.filter((r) => !kind || r.kind === kind)
  .reduce((a, r) => ({ files: a.files + 1, lines: a.lines + r.lines, tokens: a.tokens + r.tokens }),
    { files: 0, lines: 0, tokens: 0 });

for (const [name, rows] of [['writing the backend yourself', scratch], ['on a backend that already exists', backend]]) {
  const w = Math.max(...rows.map((r) => r.file.length));
  console.log('');
  console.log(`  ${name}`);
  console.log('');
  console.log(`    ${'file'.padEnd(w)}  ${'what it is'.padEnd(14)}  lines  tokens`);
  console.log(`    ${'-'.repeat(w)}  ${'-'.repeat(14)}  -----  ------`);
  for (const r of rows)
    console.log(`    ${r.file.padEnd(w)}  ${r.kind.padEnd(14)}  ${String(r.lines).padStart(5)}  ${String(r.tokens).padStart(6)}`);
  const t = sum(rows), i = sum(rows, 'infrastructure');
  console.log(`    ${'total'.padEnd(w)}  ${''.padEnd(14)}  ${String(t.lines).padStart(5)}  ${String(t.tokens).padStart(6)}`);
  console.log(`    of which the part every app has: ${i.tokens} tokens (${Math.round((i.tokens / t.tokens) * 100)}%)`);
}

const a = sum(scratch), b = sum(backend);
console.log('');
console.log(`  code you own:  ${a.files} files / ${a.lines} lines / ${a.tokens} tokens`);
console.log(`                 ${b.files} files / ${b.lines} lines / ${b.tokens} tokens`);
console.log(`  difference:    ${a.tokens - b.tokens} fewer tokens, ${(a.tokens / b.tokens).toFixed(1)}x less code to produce and maintain`);
console.log('');
