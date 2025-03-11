import { app, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import { quitApp, createMainWindow, onFormWindowRequest } from './backend/main/windows.js';
import { onCaseCreate, onCaseDelete, onPatientInfosUpdate } from './backend/main/handlers.js';
import * as db from './backend/database/data-manager.js';

createSingleInstanceApp();

async function createSingleInstanceApp(): Promise<void> {
  if (!app.requestSingleInstanceLock())
    return quitApp();

  await app.whenReady();

  createAppMenu();
  registerIpcHandlers();
  createMainWindow();
}

function createAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Daten-Manager',
      submenu: [
        {
          label: 'Neuen Fall anlegen',
          click: (e: any) => onFormWindowRequest(e, null)
        },
        { type: 'separator' },
        {
          label: 'Daten importieren',
          click: () => { console.log('importieren') }
        },
        {
          label: 'Daten exportieren',
          click: () => { console.log('exportieren') }
        },
        { type: 'separator' },
        {
          label: 'Schließen',
          role: 'quit'
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu);
}

function registerIpcHandlers(): void {
  ipcMain.handle('window:close', e => e.sender.close());

  // Main Window
  ipcMain.handle('patient:all', db.getAllPatients);
  ipcMain.handle('search:advanced', db.searchPatients_advanced);
  ipcMain.handle('form-window:show', onFormWindowRequest);

  // Form Window
  ipcMain.handle('case:create', onCaseCreate);
  ipcMain.handle('case:delete', onCaseDelete);

  ipcMain.handle('patient:update', onPatientInfosUpdate);
  ipcMain.handle('meld:update', db.updateMeldData);

  ipcMain.handle('MRI:create', db.createMRI);
  ipcMain.handle('MRI:delete', db.deleteMRI);

  ipcMain.handle('annotation:create', db.createAnnotation);
  ipcMain.handle('annotation:update', db.updateAnnotation);
  ipcMain.handle('annotation:delete', db.deleteAnnotation);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});