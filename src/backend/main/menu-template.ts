import { MenuItemConstructorOptions } from "electron";
import { onFormWindowRequest, openExportModal } from "./windows.js";
import { onDataImport } from "./handlers.js";

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
        type: 'separator'
      }, {
        label: 'Schließen',
        role: 'quit'
      }
    ]
  }
];

export default MENU_TEMPLATE;