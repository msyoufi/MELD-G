import { getMeldData, getMRIs, getPatientInfos } from '../database/export.js';

export function collectExportData(dataScope: string, entities: string | undefined): CollectedExportData {
  const exportData: CollectedExportData = {};
  const scopes = dataScope.split(',').map(s => s.trim());

  let mris: (MRI & Annotation)[] | null = null;
  let filteredPatientsIds: string | null = null;

  if (entities) {
    mris = getMRIs(entities);

    if (!mris.length)
      return exportData;

    filteredPatientsIds = Array.from(new Set(mris.map(m => m.patient_id))).join(', ');
  }

  for (const scope of scopes) {
    switch (scope) {
      case 'patients':
        exportData.patients = getPatientInfos(filteredPatientsIds);
        break;

      case 'melds':
        exportData.melds = getMeldData(filteredPatientsIds);
        break;

      case 'mris':
        if (mris)
          exportData.mris = mris;
        else
          exportData.mris = getMRIs(null);
    }
  }

  return exportData;
}

export function getFlatData(data: CollectedExportData): any[] {
  const exportMap = new Map<number | bigint, any>();
  let completeCases: any[] = [];

  const { patients, mris, melds } = data;

  if (patients)
    addPatientInfos_flat(patients, exportMap);

  if (melds)
    addMeldData_flat(melds, exportMap);

  if (mris)
    completeCases = addMris_flat(mris, exportMap);

  return completeCases.length
    ? completeCases
    : Array.from(exportMap.values());
}

function addPatientInfos_flat(
  patients: PatientInfos[],
  exportMap: Map<number | bigint, any>
): void {
  const total = patients.length;

  for (let i = 0; i < total; i++) {
    const { id, ...patient } = patients[i];
    exportMap.set(id, { ...patient });
  }
}

function addMeldData_flat(
  melds: (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' })[],
  exportMap: Map<number | bigint, any>
): void {
  const total = melds.length;

  for (let i = 0; i < total;) {
    const formatedMeld = formatMeldData(melds[i], ++i);
    const { patient_id, meld } = formatedMeld;

    const caseData = { ...(exportMap.get(patient_id) || {}), ...meld };
    exportMap.set(patient_id, caseData);
  }
}

function addMris_flat(
  mrisWithAnnotations: (MRI & Annotation)[],
  exportMap: Map<number | bigint, any>
): any[] {
  const total = mrisWithAnnotations.length;
  const completeCases: any[] = [];

  for (let i = 0; i < total; i++) {
    const { id, patient_id, ann_id, mri_id, ...annoData } = mrisWithAnnotations[i];
    const completeCase = { ...(exportMap.get(patient_id) || {}), ...annoData };
    completeCases.push(completeCase);
  }

  return completeCases;
}


export function getNestedData(data: CollectedExportData): MELDCase_Export[] {
  const exportMap = new Map<number | bigint, MELDCase_Export>();
  const { patients, mris, melds } = data;

  if (patients)
    addPatientInfos_nested(patients, exportMap);

  if (mris)
    addMris_nested(mris, exportMap);

  if (melds)
    addMeldData_nested(melds, exportMap);

  return Array.from(exportMap.values());
}

function addPatientInfos_nested(
  patients: PatientInfos[],
  exportMap: Map<number | bigint, MELDCase_Export>
): void {
  const total = patients.length;

  for (let i = 0; i < total; i++) {
    const { id, ...patient } = patients[i];
    exportMap.set(id, { patient });
  }
}

function addMris_nested(
  mrisWithAnnotations: (MRI & Annotation)[],
  exportMap: Map<number | bigint, MELDCase_Export>
): void {
  const total = mrisWithAnnotations.length;

  for (let i = 0; i < total; i++) {
    const { id, patient_id, study_id, ann_id, mri_id, ...annoData } = mrisWithAnnotations[i];

    let patientEntry = exportMap.get(patient_id);

    if (!patientEntry) {
      patientEntry = { MRIs: [] };
      exportMap.set(patient_id, patientEntry);

    } else if (!patientEntry.MRIs) {
      patientEntry.MRIs = [];
    }

    let mriEntry = patientEntry.MRIs!.find(mri => mri.study_id === study_id);

    if (!mriEntry) {
      mriEntry = { study_id, annotations: [] };
      patientEntry.MRIs!.push(mriEntry);
    }

    if (ann_id)
      mriEntry.annotations.push(annoData);
  }
}

function addMeldData_nested(
  melds: (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' })[],
  exportMap: Map<number | bigint, MELDCase_Export>
): void {
  const total = melds.length;

  for (let i = 0; i < total;) {
    const formatedMeld = formatMeldData(melds[i], ++i);
    const { patient_id, meld } = formatedMeld;

    const caseData = { ...(exportMap.get(patient_id) || {}), meld };
    exportMap.set(patient_id, caseData);
  }
}

function formatMeldData(
  rawMeld: (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' }),
  idNumber: number
): { patient_id: number | bigint, meld: MELD_Export } {

  const { patient_id, radiology_other, is_complete, ...meldData } = rawMeld;

  const meld = Object.assign({
    id: createMeldId(meldData.site, meldData.patient_control, idNumber),
    radiology_report: radiology_other,
    participant_information_complete: is_complete
  },
    meldData
  );

  return { patient_id, meld };
}

function createMeldId(site: string, patient_control: '1' | '2', idNumber: number): string {
  const type = patient_control === '1' ? 'P' : 'C';
  const idString = idNumber.toString().padStart(4, '0');

  return `MELD_${site}_${type}_${idString}`;
}