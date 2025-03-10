import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, Rectangle } from 'electron';
import path from 'node:path';
import * as db from './assets/database/manager.js';

const windows: AppWindows = { main: null, form: null };
let formWinBounds: Rectangle | null = null;

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return quitApp();

  await app.whenReady()

  registerIpcHandlers();

  const mainWin = createWindow('home');

  mainWin.maximize();
  mainWin.on('closed', quitApp);

  windows.main = mainWin;

  sendOnReady(mainWin, 'patient:all', db.getPatientList());
  sendOnReady(mainWin, 'entity:all', db.ENTITIES);
}

function registerIpcHandlers(): void {
  ipcMain.handle('form-window:show', manageFormWindow);

  ipcMain.handle('case:create', onCaseCreate);
  ipcMain.handle('case:delete', onCaseDelete);

  ipcMain.handle('patient:update', onPatientInfosUpdate);
  ipcMain.handle('patient:all', db.getPatientList);
  ipcMain.handle('meld:update', db.updateMeldData);

  ipcMain.handle('MRI:create', db.createMRI);
  ipcMain.handle('MRI:delete', db.deleteMRI);

  ipcMain.handle('annotation:create', db.createAnnotation);
  ipcMain.handle('annotation:update', db.updateAnnotation);
  ipcMain.handle('annotation:delete', db.deleteAnnotation);

  ipcMain.handle('search:advanced', db.advancedSearch);

  ipcMain.handle('window:close', e => e.sender.close());
}

function manageFormWindow(e: IpcMainInvokeEvent, patient: PatientInfos | null): void {
  if (windows.form)
    updateFormWindow(patient);
  else
    openFormWindow(patient);
}

function openFormWindow(patient: PatientInfos | null): void {
  const formWin = createWindow('form');

  if (formWinBounds)
    formWin.setBounds(formWinBounds);
  else
    formWin.maximize();

  formWin.removeMenu();
  formWin.once('close', () => formWinBounds = formWin.getBounds());
  formWin.once('closed', () => windows.form = null);

  windows.form = formWin;

  sendOnReady(formWin, 'form:get', db.MELD_FORM);
  sendOnReady(formWin, 'entity:all', db.ENTITIES);

  if (patient)
    sendOnReady(formWin, 'case:get', db.getCaseData(patient));
}

function updateFormWindow(patient: PatientInfos | null): void {
  const formWin = windows.form;
  const current_kkb_id = formWin.title.split('-').at(-1)?.trim();

  if (patient && patient.kkb_id !== current_kkb_id)
    formWin.webContents.send('case:get', db.getCaseData(patient));

  if (!patient && current_kkb_id !== 'Neuer Fall') {

    if (formWin.listenerCount('closed') < 3)
      formWin.once('closed', () => openFormWindow(null));

    formWin.close();
  }

  formWin.focus();
}

function onCaseCreate(e: any, patient: Omit<PatientInfos, 'id'>): PatientInfos | null {
  const newPatientInfos = db.createCase(patient);

  if (newPatientInfos)
    syncPatientList(newPatientInfos);

  return newPatientInfos;
}

function onCaseDelete(e: any, id: number | bigint): number {
  const changes = db.deleteCase(id);

  if (changes)
    syncPatientList(id);

  return changes;
}

function onPatientInfosUpdate(e: any, patient: PatientInfos): PatientInfos {
  const updatedPatientInfos = db.updatePatientInfos(patient);

  syncPatientList(updatedPatientInfos);

  return updatedPatientInfos;
}

function syncPatientList(newData: PatientInfos | number | bigint): void {
  windows.main.send('patient-list:sync', newData);
}

function createWindow(templateName: string): BrowserWindow {
  const templateFile = getFileRoute(`./assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: getFileRoute('preload.js')
    }
  });

  window.loadFile(templateFile);
  window.on('ready-to-show', window.show);

  // Remove in production
  window.webContents.openDevTools();

  return window;
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
    windows.form?.destroy();
    db.closeDB();
    app.quit();

  } catch (err: unknown) {
    console.log(err);
  }
}