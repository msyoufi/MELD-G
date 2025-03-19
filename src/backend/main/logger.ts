import fs from 'node:fs';
import { getFileRoute, showMessageDialog } from './utils.js';

export function logError(err: Error): void {
  try {
    const now = new Date().toLocaleString();
    const logEntry = `${now} - ${(err as Error).message}\n`;

    fs.appendFile(getFileRoute('log.txt'), logEntry, err => {
      if (err) console.log(err);
    });

  } catch (err: unknown) {
    showMessageDialog(
      'Fehler beim Loggen des letzten Fehlers\n' + (err as Error).message,
      ['Schließen'],
      'error'
    );
  }
}