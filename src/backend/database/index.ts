import Database from 'better-sqlite3';
import fs from 'node:fs';
import { getFileRoute } from '../main/utils.js';

export let DB: Database.Database;

export function initDB(): void {
  const migration = fs.readFileSync(getFileRoute('backend/resources/schema.sql'), 'utf8');

  DB = new Database(getFileRoute('db/epi.db'));
  DB.pragma('journal_mode = WAL');
  DB.exec(migration);
};

export function closeDBConnection(): void {
  DB?.close();
}