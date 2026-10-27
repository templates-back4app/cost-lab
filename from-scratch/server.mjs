import { createServer } from 'node:http';
import { signup, login, userFor } from './auth.mjs';
import * as notes from './notes.mjs';

const PORT = Number(process.env.SCRATCH_PORT ?? 7401);

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const read = (req) => new Promise((ok, err) => {
  let b = '', size = 0;
  req.on('data', (c) => { size += c.length;
    if (size > 1e6) { err(Object.assign(new Error('body too large'), { status: 413 })); req.destroy(); }
    b += c; });
  req.on('end', () => ok(b));
});
const token = (req) => (req.headers.authorization ?? '').replace(/^Bearer /, '');

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const seg = url.pathname.split('/').filter(Boolean);
    const body = ['POST', 'PUT'].includes(req.method) ? JSON.parse((await read(req)) || '{}') : {};

    if (req.method === 'POST' && seg[0] === 'signup') return json(res, 201, signup(body.username, body.password));
    if (req.method === 'POST' && seg[0] === 'login')  return json(res, 200, login(body.username, body.password));

    if (seg[0] === 'notes') {
      const me = userFor(token(req));
      if (req.method === 'POST' && seg.length === 1)   return json(res, 201, notes.create(me, body.text));
      if (req.method === 'GET' && seg.length === 1)    return json(res, 200, notes.list(me));
      if (req.method === 'GET' && seg[1])              return json(res, 200, notes.get(me, Number(seg[1])));
      if (req.method === 'DELETE' && seg[1])           return json(res, 200, notes.remove(me, Number(seg[1])));
    }
    json(res, 404, { error: 'no such endpoint' });
  } catch (e) {
    json(res, e.status ?? 500, { error: e.message });
  }
}).listen(PORT, '127.0.0.1', () => console.error(`from-scratch up on ${PORT}`));
