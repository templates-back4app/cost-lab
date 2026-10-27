// Everything the other version spends four files on is configuration here: the
// class, and who may do what to it. Sign-up, login, password hashing, session
// tokens and per-row ownership already exist.
const BASE = `http://127.0.0.1:${process.env.PARSE_PORT ?? 1340}/parse`;
const H = { 'X-Parse-Application-Id': 'cost-app', 'X-Parse-Master-Key': 'cost-master-key',
  'Content-Type': 'application/json' };

const r = await fetch(`${BASE}/schemas/Note`, { method: 'POST', headers: H, body: JSON.stringify({
  className: 'Note',
  fields: { text: { type: 'String' } },
  classLevelPermissions: {
    find:   { requiresAuthentication: true },
    get:    { requiresAuthentication: true },
    count:  { requiresAuthentication: true },
    create: { requiresAuthentication: true },
    update: { requiresAuthentication: true },
    delete: { requiresAuthentication: true },
    addField: {},
  },
}) });
const body = await r.json();
if (!r.ok && body.code !== 103) throw new Error(JSON.stringify(body));
console.error('Note class ready');
