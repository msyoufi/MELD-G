import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import * as data from './assets/database/manager.js';

const windows: AppWindows = { main: null, form: null };

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return quitApp();

  await app.whenReady()

  registerIpcHandlers();

  windows.main = createWindow('home');
  windows.main.on('closed', quitApp);

  sendOnReady(windows.main, 'patient:list', data.getPatientList());
}

function registerIpcHandlers(): void {
  ipcMain.handle('form:open', manageFormWindow);

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

function manageFormWindow(e: IpcMainInvokeEvent, patient: PatientInfos | null): void {
  if (windows.form)
    updateFormWindow(patient);
  else
    openFormWindow(patient);
}

function openFormWindow(patient: PatientInfos | null): void {
  windows.form = createWindow('form');
  windows.form.on('closed', () => windows.form = null);
  sendOnReady(windows.form, 'form:get', data.MELD_FORM);

  if (patient)
    sendOnReady(windows.form, 'case:get', data.getCase(patient));
}

function updateFormWindow(patient: PatientInfos | null): void {
  const kkb_id = windows.form!.title.split('-').at(-1)?.trim();

  if (!patient)
    windows.form!.webContents.send('form:reset');

  if (patient && patient.kkb_id !== kkb_id)
    windows.form!.webContents.send('case:get', data.getCase(patient));

  windows.form!.focus();
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