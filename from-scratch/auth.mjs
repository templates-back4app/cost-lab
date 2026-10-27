import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from './db.mjs';

const KEYLEN = 64;
const COST = { N: 16384, r: 8, p: 1 };

function hash(password, salt) {
  return scryptSync(password, salt, KEYLEN, COST).toString('hex');
}

export function signup(username, password) {
  if (!username || !password) throw Object.assign(new Error('username and password are required'), { status: 400 });
  if (password.length < 8) throw Object.assign(new Error('password too short'), { status: 400 });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) throw Object.assign(new Error('username taken'), { status: 409 });
  const salt = randomBytes(16).toString('hex');
  const info = db.prepare('INSERT INTO users (username, salt, hash, createdAt) VALUES (?, ?, ?, ?)')
    .run(username, salt, hash(password, salt), new Date().toISOString());
  return issueSession(Number(info.lastInsertRowid));
}

export function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) throw Object.assign(new Error('invalid credentials'), { status: 401 });
  const got = Buffer.from(hash(password, user.salt), 'hex');
  const want = Buffer.from(user.hash, 'hex');
  if (got.length !== want.length || !timingSafeEqual(got, want))
    throw Object.assign(new Error('invalid credentials'), { status: 401 });
  return issueSession(user.id);
}

function issueSession(userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?, ?, ?)')
    .run(token, userId, new Date().toISOString());
  return { token };
}

export function userFor(token) {
  if (!token) throw Object.assign(new Error('not signed in'), { status: 401 });
  const row = db.prepare('SELECT userId FROM sessions WHERE token = ?').get(token);
  if (!row) throw Object.assign(new Error('not signed in'), { status: 401 });
  return row.userId;
}
