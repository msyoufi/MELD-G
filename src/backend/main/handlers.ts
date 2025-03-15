import * as db from '../database/data-manager.js';
import { collectExportData, getFlatData, getNestedData } from './export.js';
import { promptFilePath_save, writeExcelFile, writeJsonFile } from './utils.js';
import { syncPatientList } from './windows.js';

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