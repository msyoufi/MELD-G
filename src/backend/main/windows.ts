import { app, Rectangle } from 'electron';
import { createWindow, sendOnReady } from './utils.js';
import * as db from '../database/data-manager.js';
import { closeDBConnection } from '../database/db-manager.js';

const windows: AppWindows = { main: null, form: null, dictionary: null };
let formWinBounds: Rectangle | null = null;

export function createMainWindow(): void {
  const mainWin = createWindow('home');

  mainWin.maximize();
  mainWin.on('closed', quitApp);

  windows.main = mainWin;

  sendOnReady(mainWin, 'patient:all', db.getAllPatients());
  sendOnReady(mainWin, 'entity:all', db.ENTITIES);
}

export function onFormWindowRequest(e: any, patient: PatientInfos | null): void {
  if (windows.form)
    updateFormWindow(patient);
  else
    createFormWindow(patient);
}

function createFormWindow(patient: PatientInfos | null): void {
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
    sendOnReady(formWin, 'case:get', db.getCase(patient));
}

function updateFormWindow(patient: PatientInfos | null): void {
  const formWin = windows.form;
  const current_kkb_id = formWin.title.split('-').at(-1)?.trim();

  if (patient && patient.kkb_id !== current_kkb_id)
    formWin.webContents.send('case:get', db.getCase(patient));

  if (!patient && current_kkb_id !== 'Neuer Fall') {

    if (formWin.listenerCount('closed') < 3)
      formWin.once('closed', () => createFormWindow(null));

    formWin.close();
  }

  formWin.focus();
}

export function openDictionaryWindow(): void {
  if (windows.dictionary)
    return;

  const dictWin = createWindow('dictionary');
  dictWin.once('closed', () => windows.dictionary = null);

  dictWin.removeMenu();
  dictWin.maximize();

  sendOnReady(dictWin, 'form:get', db.MELD_FORM);
  sendOnReady(dictWin, 'entity:all', db.ENTITIES);

  windows.dictionary = dictWin;
}

export function syncPatientList(newData: PatientInfos | number | bigint): void {
  windows.main.send('patient-list:sync', newData);
}

export function refreshPatientsList(): void {
  windows.main.send('patient:all', db.getAllPatients());
}

export function openExportModal(): void {
  const modalWin = createWindow('export', {
    width: 700,
    height: 600,
    parent: windows.main,
    modal: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    kiosk: true,
  });

  modalWin.removeMenu();

  sendOnReady(modalWin, 'entity:all', db.ENTITIES);
}

export function quitApp(): void {
  try {
    windows.form?.destroy();
    closeDBConnection();
    app.quit();

  } catch (err: unknown) {
    console.log(err);
  }
}