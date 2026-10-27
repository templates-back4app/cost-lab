// One battery, run against both implementations. The comparison only means
// anything if both pass it, so this runs first and the count runs second.
const which = process.argv[2];
const { api } = await import(`./adapter-${which}.mjs`);
const stamp = Date.now().toString(36);
const A = { u: `ana_${stamp}`, p: 'correct-horse-1' };
const B = { u: `bruno_${stamp}`, p: 'correct-horse-2' };

const results = [];
const check = (name, passed, detail = '') => results.push([name, passed, detail]);

const ra = await api.signup(A.u, A.p);
check('a new account can sign up', ra.ok, `HTTP ${ra.status}`);
const rb = await api.signup(B.u, B.p);
check('a second account can sign up', rb.ok, `HTTP ${rb.status}`);

const bad = await api.login(A.u, 'wrong-password');
check('the wrong password is rejected', !bad.ok, `HTTP ${bad.status}`);

const la = await api.login(A.u, A.p);
const ta = api.tokenOf(la);
check('the right password signs you in', la.ok && !!ta, `HTTP ${la.status}`);
const lb = await api.login(B.u, B.p);
const tb = api.tokenOf(lb);

const anon = await api.list(undefined);
check('a stranger cannot list notes', !anon.ok || api.countOf(anon) === 0, `HTTP ${anon.status}`);

const made = await api.create(ta, 'ana first note');
const id = api.idOf(made);
check('a signed-in person can write a note', made.ok && !!id, `HTTP ${made.status}`);

const mine = await api.list(ta);
check('you see your own note', api.countOf(mine) === 1, `${api.countOf(mine)} row(s)`);

const theirs = await api.list(tb);
check("you do not see someone else's note", api.countOf(theirs) === 0, `${api.countOf(theirs)} row(s)`);

const peek = await api.get(tb, id);
check("you cannot open someone else's note by id", !peek.ok || !peek.body?.text, `HTTP ${peek.status}`);

const steal = await api.remove(tb, id);
const stillThere = await api.list(ta);
check("you cannot delete someone else's note", api.countOf(stillThere) === 1, `${api.countOf(stillThere)} row(s) left`);

const gone = await api.remove(ta, id);
const after = await api.list(ta);
check('you can delete your own note', gone.ok && api.countOf(after) === 0, `${api.countOf(after)} row(s) left`);

const w = Math.max(...results.map((r) => r[0].length));
const passed = results.filter((r) => r[1]).length;
for (const [n, ok, d] of results) console.log(`    ${ok ? 'pass' : 'FAIL'}  ${n.padEnd(w)}  ${d}`);
console.log(`    ${passed} of ${results.length} acceptance checks pass`);
process.exitCode = passed === results.length ? 0 : 1;
