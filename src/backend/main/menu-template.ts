import { MenuItemConstructorOptions } from "electron";
import { onFormWindowRequest, openDictionaryWindow, openExportModal } from "./windows.js";
import { onDataImport } from "./handlers.js";
import { createDBBackup } from "../database/index.js";

const MENU_TEMPLATE: MenuItemConstructorOptions[] = [
  {
    label: 'Daten-Manager',
    submenu: [
      {
        label: 'Neuen Fall anlegen',
        click: (e: any) => onFormWindowRequest(e, null)
      }, {
        type: 'separator'
      }, {
        label: 'Daten exportieren',
        click: openExportModal
      }, {
        label: 'Daten importieren',
        click: onDataImport
      }, {
        label: 'Datenbank-Backup exportieren',
        click: createDBBackup
      }, {
        type: 'separator'
      }, {
        label: 'Schließen',
        role: 'quit'
      }
    ]
  },
  {
    label: 'Hilfe',
    submenu: [
      {
        label: 'Datenverzeichnis',
        click: openDictionaryWindow
      }
    ]
  }
];

export default MENU_TEMPLATE;