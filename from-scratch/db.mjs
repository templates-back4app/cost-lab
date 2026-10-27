import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync(process.env.DB_FILE ?? ':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY,
    username  TEXT NOT NULL UNIQUE,
    salt      TEXT NOT NULL,
    hash      TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token     TEXT PRIMARY KEY,
    userId    INTEGER NOT NULL REFERENCES users(id),
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notes (
    id        INTEGER PRIMARY KEY,
    ownerId   INTEGER NOT NULL REFERENCES users(id),
    text      TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS notes_owner ON notes(ownerId);
`);
