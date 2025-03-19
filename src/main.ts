import { app, ipcMain, Menu } from 'electron';
import { createMainWindow, onFormWindowRequest, closeWindows } from './backend/main/windows.js';
import { onDataExport, onCaseCreate, onCaseDelete, onPatientInfosUpdate, onDictionaryTableExport } from './backend/main/handlers.js';
import * as db from './backend/database/data-manager.js';
import MENU_TEMPLATE from './backend/main/menu-template.js';
import { logError } from './backend/main/logger.js';
import { handleError } from './backend/main/utils.js';
import { closeDBConnection, initDB } from './backend/database/index.js';

(async function createSingleInstanceApp() {
  try {
    if (!app.requestSingleInstanceLock())
      return app.quit();

    initDB();
    db.loadJsonFiles();

    await app.whenReady();

    createAppMenu();
    registerIpcHandlers();
    createMainWindow();

  } catch (err: unknown) {
    handleError(err);
    quitApp();
  }
})();

function createAppMenu(): void {
  const menu = Menu.buildFromTemplate(MENU_TEMPLATE)
  Menu.setApplicationMenu(menu);
}

function registerIpcHandlers(): void {
  ipcMain.handle('window:close', e => e.sender.close());
  ipcMain.handle('data:export', onDataExport);
  ipcMain.handle('error:log', (e, error) => logError(error));

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

  // Data Dictionary Window
  ipcMain.handle('table:export', onDictionaryTableExport);
}

export function quitApp(): void {
  try {
    closeWindows();
    closeDBConnection();
    app.quit();

  } catch (err: unknown) {
    handleError(err);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

process.on('uncaughtException', (err) => {
  handleError(err);
});