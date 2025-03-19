import { app, BaseWindowConstructorOptions, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { read, set_fs, utils, writeFile } from 'xlsx';
import { logError } from './logger.js';

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

export function showMessageDialog(
  message: string,
  buttons: string[],
  type?: 'none' | 'info' | 'error' | 'question' | 'warning',
): number {
  return dialog.showMessageBoxSync({ message, buttons, defaultId: 0, cancelId: 1, type });
}

export function promptFilePath_open(format: FileType): string[] | undefined {
  const filePath = dialog.showOpenDialogSync({
    filters: [{ name: getFileFilterName(format), extensions: [format] }]
  });

  return filePath;
}

export function promptFilePath_save(format: FileType, customName?: string): string {
  const fileName = createFileName(format, customName);

  const filePath = dialog.showSaveDialogSync({
    defaultPath: getFileRoute(fileName),
    properties: ['createDirectory'],
    filters: [{ name: getFileFilterName(format), extensions: [format] }]
  });

  return filePath;
}

function createFileName(format: FileType, customName?: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replaceAll(':', '');
  const name = customName
    ? customName.replaceAll(',', '_').replaceAll(' ', '') + '_'
    : '';

  return 'Export_' + name + date + '_' + time + '.' + format;
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

export function writeJsonFile(filePath: string, data: any): void {
  const dataJSON = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, dataJSON, 'utf-8');
}

// load 'fs' for readFile and writeFile support for the xlsx library 
set_fs(fs);

export function writeJsonToExcel(filePath: string, data: Record<string, any>[], type: 'csv' | 'xlsx'): void {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();

  utils.book_append_sheet(workbook, worksheet, 'MELD');
  writeFile(workbook, filePath, { bookType: type });
}

export function writeHtmlToExcel(filePath: string, sheetHTMLs: SheetHTML[], type: 'csv' | 'xlsx'): void {
  const workbook = utils.book_new();

  for (const { name, html } of sheetHTMLs) {
    const wb = read(html, { type: "string" });
    const worksheet = wb.Sheets[wb.SheetNames[0]];

    utils.book_append_sheet(workbook, worksheet, name);
  }

  writeFile(workbook, filePath, { bookType: type });
}

export function readFile(filePath: string): any {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

export function handleError(err: any): void {
  logError(err);

  if (app.isReady())
    showMessageDialog(err.message, ['Schließen'], 'error');
}