import * as db from '../database/data-manager.js';
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