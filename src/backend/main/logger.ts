import fs from 'node:fs';
import { getFileRoute, showMessageDialog } from './utils.js';
import { SqliteError } from 'better-sqlite3';
import { app } from 'electron';

export function logError(err: unknown): void {
  try {
    let message = 'Unbekannter Fehler';
    const now = new Date().toLocaleString();

    if (err instanceof SqliteError || err instanceof Error)
      message = `${err.name} - ${err.message}`;

    const logEntry = `${now} : ${message}\n`;

    fs.appendFile(getFileRoute('log.txt'), logEntry, err => {
      if (err) console.log(err);
    });

  } catch (err: unknown) {
    if (app.isReady())
      showMessageDialog(
        'Fehler beim Loggen des letzten Fehlers\n' + (err as Error).message,
        ['Schließen'],
        'error'
      );
  }
}