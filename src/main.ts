import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import * as db from './assets/database/manager.js';

const windows: AppWindows = { main: null, form: null };

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return quitApp();

  await app.whenReady()

  registerIpcHandlers();

  windows.main = createWindow('home');
  windows.main.on('closed', quitApp);

  sendOnReady(windows.main, 'patient:list', db.getPatientList());
}

function registerIpcHandlers(): void {
  ipcMain.handle('form:open', manageFormWindow);

  ipcMain.handle('annotation:create', db.createAnnotation);
  ipcMain.handle('annotation:update', db.updateAnnotation);
  ipcMain.handle('annotation:delete', db.deleteAnnotation);

  ipcMain.handle('MRI:create', db.createMRI);
  ipcMain.handle('MRI:delete', db.deleteMRI);
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
  sendOnReady(windows.form, 'form:get', db.MELD_FORM);
  sendOnReady(windows.form, 'entity:list', db.ENTITIES);

  if (!patient) return;

  sendOnReady(windows.form, 'case-data:get', db.getCaseData(patient));
  sendOnReady(windows.form, 'case-MRIs:get', db.getCaseMRIs(patient.id));
}

function updateFormWindow(patient: PatientInfos | null): void {
  const kkb_id = windows.form!.title.split('-').at(-1)?.trim();

  if (!patient)
    windows.form!.webContents.send('form:reset');

  if (patient && patient.kkb_id !== kkb_id) {
    windows.form!.webContents.send('case-data:get', db.getCaseData(patient));
    windows.form!.webContents.send('case-MRIs:get', db.getCaseMRIs(patient.id));
  }

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
    db.closeDB();
    app.quit();

  } catch (err: unknown) {
    console.log(err);
  }
}