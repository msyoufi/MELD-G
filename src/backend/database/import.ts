import { DB } from "./index.js";
import { dynamicInsert } from './utils.js';

export function importCasesData(meldCases: MELDCase_Import[]): ImportReport {
  const total = meldCases.length;
  const report = { total, imported: 0 };

  for (let i = 0; i < total; i++) {
    const { patient, MRIs, meld } = meldCases[i];

    if (!patient)
      continue;

    let patient_id: number | bigint = 0;
    let changes: number | bigint = 0;

    DB.transaction(() => {
      patient_id = dynamicInsert<PatientInfos>('patients', patient).id;

      if (!patient_id)
        return;

      if (meld) {
        const formatedMeld = formatMeld(patient_id, meld);
        changes = dynamicInsert<MELD>('meld', formatedMeld).patient_id;

        if (!changes)
          return;
      }

      if (MRIs) {
        changes = insertCaseMRIs(patient_id, MRIs);

        if (!changes)
          return;
      }

      report.imported++;
    })();
  }

  return report;
}

function formatMeld(patient_id: number | bigint, exportedMeld: MELD_Export): MELD {
  const { id, sex, radiology_report, participant_information_complete, ...meldData } = exportedMeld;

  return {
    patient_id,
    radiology_other: radiology_report,
    ...meldData
  };
}

function insertCaseMRIs(patient_id: number | bigint, exportedMRIs: MRI_Export[]): number | bigint {
  let mri_id: number | bigint = 0;
  let changes: number | bigint = 0;

  for (const mri of exportedMRIs) {
    const { annotations, ...mriData } = mri;
    mri_id = dynamicInsert<MRI>('mris', { patient_id, ...mriData }).id;

    if (!mri_id)
      return mri_id;

    for (const annotation of annotations) {
      changes = dynamicInsert<Annotation>('annotations', { mri_id, ...annotation }).ann_id;

      if (!changes)
        return changes;
    }
  }

  return 1;
}