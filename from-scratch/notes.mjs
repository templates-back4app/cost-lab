import { db } from './db.mjs';

export function create(ownerId, text) {
  if (typeof text !== 'string' || !text.trim())
    throw Object.assign(new Error('text is required'), { status: 400 });
  const info = db.prepare('INSERT INTO notes (ownerId, text, createdAt) VALUES (?, ?, ?)')
    .run(ownerId, text, new Date().toISOString());
  return { id: Number(info.lastInsertRowid), text };
}

export function list(ownerId) {
  return db.prepare('SELECT id, text FROM notes WHERE ownerId = ? ORDER BY id').all(ownerId);
}

export function get(ownerId, id) {
  const row = db.prepare('SELECT id, text, ownerId FROM notes WHERE id = ?').get(id);
  if (!row) throw Object.assign(new Error('not found'), { status: 404 });
  // the ownership check, which has to be written on every single read
  if (row.ownerId !== ownerId) throw Object.assign(new Error('not found'), { status: 404 });
  return { id: row.id, text: row.text };
}

export function remove(ownerId, id) {
  const row = db.prepare('SELECT ownerId FROM notes WHERE id = ?').get(id);
  if (!row) throw Object.assign(new Error('not found'), { status: 404 });
  if (row.ownerId !== ownerId) throw Object.assign(new Error('not found'), { status: 404 });
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return { deleted: true };
}
