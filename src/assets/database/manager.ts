import Database from 'better-sqlite3';
import { getFileRoute } from '../../main.js';
import fs from 'node:fs';

const db = new Database(getFileRoute('db/meld.db'));
initDB();

function initDB(): void {
  try {
    const migration = fs.readFileSync(getFileRoute('assets/database/schema.sql'), 'utf8');

    db.pragma('journal_mode = WAL');
    db.exec(migration);

  } catch (err: unknown) {
    console.log(err);
  }
}

export function closeDB(): void {
  db.close();
}