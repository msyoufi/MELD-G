import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return app.quit();

  await app.whenReady();
  registerIpcHandlers();
  mainWindow = createWindow('home');
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
  if (process.platform !== 'darwin') app.quit();
});