import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import * as data from './assets/database/manager.js';

let mainWindow: BrowserWindow | null = null;

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return quitApp();

  await app.whenReady()

  registerIpcHandlers();
  mainWindow = createWindow('home');
  sendOnReady(mainWindow, 'patient:list', data.getPatientList())
}

function registerIpcHandlers(): void {
  ipcMain.handle('form:open', openMeldForm);

  ipcMain.handle('case:create', () => { });
  ipcMain.handle('case:update', () => { });
  ipcMain.handle('case:delete', () => { });
}

function createWindow(templateName: string): BrowserWindow {
  const templateFile = getFileRoute(`./assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: getFileRoute('preload.js')
    }
  });

  window.maximize();
  window.loadFile(templateFile);
  window.on('ready-to-show', window.show);

  // Remove in production
  window.webContents.openDevTools();

  return window;
}

function openMeldForm(e: IpcMainInvokeEvent, patientId: string): void {
  console.log(patientId);
}

function sendOnReady(window: BrowserWindow, channel: MeldChannel, data: any): void {
  window.webContents.on('did-finish-load', () => {
    window.webContents.send(channel, data);
  });
}

export function getFileRoute(filePath: string): string {
  return path.join(app.getAppPath(), 'src', filePath);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

function quitApp(): void {
  try {
    data.closeDB();
    app.quit();

  } catch (err: unknown) {
    console.log(err);
  }
}