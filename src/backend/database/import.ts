import fs from 'node:fs';
import { DB } from "./init.js";
import { getFileRoute } from '../main/utils.js';
import { dynamicInsert } from './utils.js';

export function importCasesData(): void {
  try {
    const meldCases = JSON.parse(
      fs.readFileSync(getFileRoute('../json/MELD_data.json'), 'utf-8')
    ) as ExportedMELDCase[];

    for (const mCase of meldCases) {
      let patient_id: number | bigint = 0;
      let mri_id: number | bigint = 0;
      let changes: number | bigint = 0;

      DB.transaction(() => {
        patient_id = dynamicInsert<PatientInfos>('patients', mCase.patient).id;
        if (!patient_id) return;

        mCase.meld.patient_id = patient_id;

        changes = dynamicInsert<MELD>('MELD', mCase.meld).patient_id;
        if (!changes) return;

        for (const mri of mCase.MRIs) {
          const { annotations, ...mriData } = mri;
          mriData.patient_id = patient_id;

          mri_id = dynamicInsert<MRI>('MRIs', mriData).id;
          if (!mri_id) return;

          for (const annotation of annotations) {
            annotation.mri_id = mri_id;

            changes = dynamicInsert('annotations', annotation);
            if (!changes) return;
          }
        }
      })();
    }

  } catch (err: unknown) {
    console.log(err);
  }
}