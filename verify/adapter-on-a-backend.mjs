const BASE = `http://127.0.0.1:${process.env.PARSE_PORT ?? 1340}/parse`;
const call = async (method, path, { body, token } = {}) => {
  const r = await fetch(BASE + path, { method,
    headers: { 'X-Parse-Application-Id': 'cost-app', 'X-Parse-Revocable-Session': '1',
      'content-type': 'application/json', ...(token ? { 'X-Parse-Session-Token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
};
export const api = {
  signup: (u, p) => call('POST', '/users', { body: { username: u, password: p } }),
  login:  (u, p) => call('GET', `/login?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`),
  tokenOf: (r) => r.body?.sessionToken,
  create: (t, text) => call('POST', '/classes/Note', { body: { text }, token: t }),
  idOf:   (r) => r.body?.objectId,
  list:   (t) => call('GET', '/classes/Note', { token: t }),
  countOf:(r) => (Array.isArray(r.body?.results) ? r.body.results.length : null),
  get:    (t, id) => call('GET', `/classes/Note/${id}`, { token: t }),
  remove: (t, id) => call('DELETE', `/classes/Note/${id}`, { token: t }),
};
