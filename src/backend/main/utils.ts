import { app, BrowserWindow } from 'electron';
import path from 'node:path';

export function createWindow(templateName: string): BrowserWindow {
  const templateFile = getFileRoute(`./frontend/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: getFileRoute('backend/main/preload.js')
    }
  });

  window.loadFile(templateFile);
  window.on('ready-to-show', window.show);

  // Remove in production
  window.webContents.openDevTools();

  return window;
}

export function sendOnReady(window: BrowserWindow, channel: MeldChannel, data: any): void {
  window.webContents.on('did-finish-load', () => {
    window.webContents.send(channel, data);
  });
}

export function getFileRoute(filePath: string): string {
  return path.join(app.getAppPath(), 'src', filePath);
}