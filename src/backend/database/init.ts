import Database from 'better-sqlite3';
import fs from 'node:fs';
import { getFileRoute } from '../main/utils.js';
import { importCasesData } from './import.js';

export const DB = new Database(getFileRoute('db/meld.db'));

(function initDB(): void {
  try {
    const migration = fs.readFileSync(getFileRoute('backend/resources/schema.sql'), 'utf8');

    DB.pragma('journal_mode = WAL');
    DB.exec(migration);
    // importCasesData();

  } catch (err: unknown) {
    console.log(err);
  }
})();