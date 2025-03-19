import * as db from '../database/data-manager.js';
import { importCasesData } from '../database/import.js';
import { collectExportData, getFlatData, getNestedData } from './export.js';
import { handleError, promptFilePath_open, promptFilePath_save, readFile, showMessageDialog, writeHtmlToExcel, writeJsonFile, writeJsonToExcel } from './utils.js';
import { refreshPatientsList, syncPatientList } from './windows.js';

export function onCaseCreate(e: any, patient: Omit<PatientInfos, 'id'>): PatientInfos | null {
  try {
    const newPatientInfos = db.createCase(patient);

    if (newPatientInfos)
      syncPatientList(newPatientInfos);

    return newPatientInfos;

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function onCaseDelete(e: any, id: number | bigint): number {
  try {
    const changes = db.deleteCase(id);

    if (changes)
      syncPatientList(id);

    return changes;

  } catch (err: unknown) {
    handleError(err);
    return 0;
  }
}

export function onPatientInfosUpdate(e: any, patient: PatientInfos): PatientInfos | null {
  try {
    const updatedPatientInfos = db.updatePatientInfos(patient);

    syncPatientList(updatedPatientInfos);

    return updatedPatientInfos;

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function onDataExport(e: any, config: ExportConfigs): boolean {
  try {
    const { dataScope, format, entities } = config;

    const filePath = promptFilePath_save(format, dataScope);

    if (!filePath)
      return false;

    const collectedData = collectExportData(dataScope, entities);

    switch (format) {
      case 'json':
        const nestedData = getNestedData(collectedData);
        writeJsonFile(filePath, nestedData);
        break;

      case 'csv':
      case 'xlsx':
        const flatData = getFlatData(collectedData);
        writeJsonToExcel(filePath, flatData, format);
    }

    return true;

  } catch (err: unknown) {
    handleError(err);
    return false;
  }
}

export function onDataImport(): void {
  try {
    const answer = showMessageDialog(
      'Nur aus diesem Programm exportierte und NICHT anonymisierte Daten können importiert werden!\nNur JSON-Dateien sind erlaubt.',
      ['JSON-Datei auswhählen', 'Abbrechen'],
      'info'
    );

    // 0 == confirm | 1 == cancle
    if (answer)
      return;

    const pathes = promptFilePath_open('json');

    if (!pathes || !pathes.length)
      return;

    const filePath = pathes[0];
    const data = readFile(filePath) as MELDCase_Import[];
    const report = importCasesData(data);

    let message = 'Es wurden keine Daten importiert!\nEntweder sind die Daten bereits in der Datenbank voranden oder ist das Datenformat inkompatibel.';

    if (report.imported) {
      message = `${report.imported}/${report.total} Fälle wurden erfolgreich importiert`;
      refreshPatientsList();
    }

    showMessageDialog(message, ['Schließen'], 'info');

  } catch (err: unknown) {
    handleError(err);
  }
}

export function onDictionaryTableExport(e: any, sheetHTMLs: SheetHTML[]): boolean {
  try {
    const filePath = promptFilePath_save('xlsx', 'Datenverzeichnis');

    if (!filePath)
      return false;

    writeHtmlToExcel(filePath, sheetHTMLs, 'xlsx');

    return true;

  } catch (err: unknown) {
    handleError(err);
    return false;
  }
}