// Four mistakes that are ordinary in hand-written auth, each applied to a copy of
// the from-scratch version, then the same acceptance battery run against it.
//
// The question is not "can these happen" -- it is how many of them the tests you
// would actually have would notice.
import { cp, readFile, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, 'from-scratch');
const VERIFY = join(import.meta.dirname, 'verify', 'acceptance.mjs');

const SLIPS = [
  { name: 'password compared with ===', file: 'auth.mjs',
    find: `  const got = Buffer.from(hash(password, user.salt), 'hex');
  const want = Buffer.from(user.hash, 'hex');
  if (got.length !== want.length || !timingSafeEqual(got, want))
    throw Object.assign(new Error('invalid credentials'), { status: 401 });`,
    replace: `  if (hash(password, user.salt) !== user.hash)
    throw Object.assign(new Error('invalid credentials'), { status: 401 });` },

  { name: 'session token from Math.random()', file: 'auth.mjs',
    find: `  const token = randomBytes(32).toString('hex');`,
    replace: `  const token = Math.random().toString(36).slice(2);` },

  { name: 'no ownership check when reading', file: 'notes.mjs',
    find: `  if (!row) throw Object.assign(new Error('not found'), { status: 404 });
  // the ownership check, which has to be written on every single read
  if (row.ownerId !== ownerId) throw Object.assign(new Error('not found'), { status: 404 });
  return { id: row.id, text: row.text };`,
    replace: `  if (!row) throw Object.assign(new Error('not found'), { status: 404 });
  return { id: row.id, text: row.text };` },

  { name: 'no ownership check when deleting', file: 'notes.mjs',
    find: `  const row = db.prepare('SELECT ownerId FROM notes WHERE id = ?').get(id);
  if (!row) throw Object.assign(new Error('not found'), { status: 404 });
  if (row.ownerId !== ownerId) throw Object.assign(new Error('not found'), { status: 404 });
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);`,
    replace: `  db.prepare('DELETE FROM notes WHERE id = ?').run(id);` },
];

const wait = (port) => new Promise(async (ok, err) => {
  for (let i = 0; i < 80; i++) {
    try { await fetch(`http://127.0.0.1:${port}/notes`); return ok(); } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  err(new Error(`nothing on ${port}`));
});

const rows = [];
let port = 7450;
for (const slip of SLIPS) {
  const dir = await mkdtemp(join(tmpdir(), 'slip-'));
  await cp(SRC, join(dir, 'from-scratch'), { recursive: true });
  const target = join(dir, 'from-scratch', slip.file);
  const src = await readFile(target, 'utf8');
  if (!src.includes(slip.find)) throw new Error(`slip "${slip.name}" did not match ${slip.file}`);
  await writeFile(target, src.replace(slip.find, slip.replace));

  port++;
  const server = spawn(process.execPath, [join(dir, 'from-scratch', 'server.mjs')],
    { env: { ...process.env, SCRATCH_PORT: String(port) }, stdio: 'ignore' });
  await wait(port);

  const out = await new Promise((ok) => {
    const p = spawn(process.execPath, [VERIFY, 'from-scratch'],
      { env: { ...process.env, SCRATCH_PORT: String(port) }, stdio: ['ignore', 'pipe', 'ignore'] });
    let b = ''; p.stdout.on('data', (d) => (b += d)); p.on('close', () => ok(b));
  });
  server.kill();
  await rm(dir, { recursive: true, force: true });

  const failed = [...out.matchAll(/^    FAIL  (.+?)\s{2,}/gm)].map((m) => m[1]);
  rows.push([slip.name, failed]);
}

const w = Math.max(...rows.map((r) => r[0].length));
console.log('');
console.log(`  ${'the mistake'.padEnd(w)}  caught by the battery?`);
console.log(`  ${'-'.repeat(w)}  ----------------------`);
for (const [name, failed] of rows)
  console.log(`  ${name.padEnd(w)}  ${failed.length ? `yes — "${failed[0]}"` : 'NO — all 11 checks still pass'}`);
const caught = rows.filter((r) => r[1].length).length;
console.log('');
console.log(`  ${caught} of ${rows.length} caught. The other ${rows.length - caught} ship.`);
console.log(`  None of the four is possible in the version that does not write this code.`);
console.log('');
