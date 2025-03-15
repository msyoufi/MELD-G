import { app, BaseWindowConstructorOptions, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { set_fs, utils, writeFile } from 'xlsx';

export function createWindow(templateName: string, options?: Partial<BaseWindowConstructorOptions>): BrowserWindow {
  const templateFile = getFileRoute(`./frontend/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    center: true,
    webPreferences: {
      // devTools: false,
      preload: getFileRoute('backend/main/preload.js')
    },
    ...options
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

export function promptFilePath_save(dataScope: string, format: FileType): string {
  const fileName = createFileName(dataScope, format);

  const filePath = dialog.showSaveDialogSync({
    defaultPath: getFileRoute(fileName),
    properties: ['createDirectory'],
    filters: [{ name: getFileFilterName(format), extensions: [format] }]
  });

  return filePath;
}

function createFileName(dataScope: string, format: FileType): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replaceAll(':', '');
  const scopes = dataScope.replaceAll(', ', '_');

  return 'Export_' + scopes + '_' + date + '_' + time + '.' + format;
}

function getFileFilterName(format: FileType): string {
  let filterName = '';

  switch (format) {
    case 'json':
      filterName = 'JSON Dateien';
      break;
    case 'csv':
      filterName = 'Excel .csv Dateien';
      break;
    case 'xlsx':
      filterName = 'Excel .xlsx Dateien';
  }

  return filterName += ` (*.${format})`;
}

export function writeJsonFile(filePath: string, data: any): boolean {
  try {
    const dataJSON = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, dataJSON, 'utf-8');

    return true;

  } catch (err: unknown) {
    throw err;
  }
}

// load 'fs' for readFile and writeFile support for the xlsx library 
set_fs(fs);

export function writeExcelFile(filePath: string, data: any, type: 'csv' | 'xlsx'): boolean {
  try {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();

    utils.book_append_sheet(workbook, worksheet, 'MELD');
    writeFile(workbook, filePath, { bookType: type });

    return true;

  } catch (err: unknown) {
    throw err;
  }
}