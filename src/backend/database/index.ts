import Database from 'better-sqlite3';
import fs from 'node:fs';
import { getFileRoute } from '../main/utils.js';

export const DB = new Database(getFileRoute('db/epi.db'));

export function initDB(): void {
  const migration = fs.readFileSync(getFileRoute('backend/resources/schema.sql'), 'utf8');
  DB.pragma('journal_mode = WAL');
  DB.exec(migration);
};

export function closeDBConnection(): void {
  DB.close();
}