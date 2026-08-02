import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'queue.db');

export const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id            TEXT PRIMARY KEY,
    url           TEXT NOT NULL UNIQUE,
    company_name  TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    attempts      INTEGER DEFAULT 0,
    max_attempts  INTEGER DEFAULT 1,
    error         TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  )
`);