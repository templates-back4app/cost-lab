const BASE = `http://127.0.0.1:${process.env.SCRATCH_PORT ?? 7401}`;
const call = async (method, path, { body, token } = {}) => {
  const r = await fetch(BASE + path, { method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
};
export const api = {
  signup: (u, p) => call('POST', '/signup', { body: { username: u, password: p } }),
  login:  (u, p) => call('POST', '/login',  { body: { username: u, password: p } }),
  tokenOf: (r) => r.body?.token,
  create: (t, text) => call('POST', '/notes', { body: { text }, token: t }),
  idOf:   (r) => r.body?.id,
  list:   (t) => call('GET', '/notes', { token: t }),
  countOf:(r) => (Array.isArray(r.body) ? r.body.length : null),
  get:    (t, id) => call('GET', `/notes/${id}`, { token: t }),
  remove: (t, id) => call('DELETE', `/notes/${id}`, { token: t }),
};
