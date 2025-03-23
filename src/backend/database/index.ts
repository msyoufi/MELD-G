import Database from 'better-sqlite3';
import fs from 'node:fs';
import { getFileRoute, handleError, promptFilePath_save, showMessageDialog } from '../main/utils.js';

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

export async function createDBBackup(): Promise<void> {
  try {
    const filePath = promptFilePath_save('db', 'Backup');

    if (!filePath)
      return;

    const { totalPages } = await DB.backup(filePath);

    if (totalPages > 0)
      showMessageDialog('Backup erfolgreich erstellt.', ['Schließen'], 'info');
    else
      throw new Error('Eine Backup-Datei konnte nicht erstellt werden!');

  } catch (err: unknown) {
    handleError(err);
  }
}