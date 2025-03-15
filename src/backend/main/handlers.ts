import * as db from '../database/data-manager.js';
import { importCasesData } from '../database/import.js';
import { collectExportData, getFlatData, getNestedData } from './export.js';
import { promptFilePath_open, promptFilePath_save, readFile, showMessageDialog, writeExcelFile, writeJsonFile } from './utils.js';
import { refreshPatientsList, syncPatientList } from './windows.js';

export function onCaseCreate(e: any, patient: Omit<PatientInfos, 'id'>): PatientInfos | null {
  const newPatientInfos = db.createCase(patient);

  if (newPatientInfos)
    syncPatientList(newPatientInfos);

  return newPatientInfos;
}

export function onCaseDelete(e: any, id: number | bigint): number {
  const changes = db.deleteCase(id);

  if (changes)
    syncPatientList(id);

  return changes;
}

export function onPatientInfosUpdate(e: any, patient: PatientInfos): PatientInfos {
  const updatedPatientInfos = db.updatePatientInfos(patient);

  syncPatientList(updatedPatientInfos);

  return updatedPatientInfos;
}

export function onDataExport(e: any, config: ExportConfigs): boolean {
  const { dataScope, format, entities } = config;

  const filePath = promptFilePath_save(dataScope, format);

  if (!filePath)
    return false;

  const collectedData = collectExportData(dataScope, entities);

  switch (format) {
    case 'json':
      const nestedData = getNestedData(collectedData);
      return writeJsonFile(filePath, nestedData);

    case 'csv':
    case 'xlsx':
      const flatData = getFlatData(collectedData);
      return writeExcelFile(filePath, flatData, format);
  }
}

export function onDataImport(): void {
  try {
    const answer = showMessageDialog(
      'Nur aus diesem Programm exportierte und NICHT anonymisierte Daten können importiert werden! Nur JSON-Dateien sind erlaubt!',
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

    let message = 'Es konnten keine Daten importiert werden!. Bitte überprüfen Sie ihr Datenformat.';

    if (report.imported) {
      message = `${report.imported}/${report.total} Fälle wurden erfolgreich importiert`;
      refreshPatientsList();
    }

    showMessageDialog(message, ['Schließen'], 'info');

  } catch (err: unknown) {
    console.log(err)
  }
}