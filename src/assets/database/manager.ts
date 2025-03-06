import Database from 'better-sqlite3';
import { getFileRoute } from '../../main.js';
import fs from 'node:fs';

export const MELD_FORM: FormControl[] = JSON.parse(
  fs.readFileSync(getFileRoute('assets/database/form.json'), 'utf-8')
);

const DB = new Database(getFileRoute('db/meld.db'));

initDB();

function initDB(): void {
  try {
    const migration = fs.readFileSync(getFileRoute('assets/database/schema.sql'), 'utf8');

    DB.pragma('journal_mode = WAL');
    DB.exec(migration);

    // importCasesData();

  } catch (err: unknown) {
    console.log(err);
  }
}

export function getPatientList(): PatientInfos[] {
  try {
    const allPatients = DB.prepare('SELECT * FROM patients').all() as PatientInfos[];
    return allPatients;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function getCase(patient: PatientInfos): MeldCase {
  try {
    const meld = DB.prepare(`
      SELECT * FROM meld WHERE patient_id = @id
    `).get({ id: patient.id }) as MELD;

    const mris: Record<string, MRI> = {};

    const rawMRIs = DB.prepare(`
      SELECT MRIs.*, annotations.* FROM MRIs
      LEFT JOIN annotations ON annotations.mri_id = MRIs.id
      WHERE patient_id = @id
    `).all({ id: patient.id }) as (Omit<MRI, 'annotations'> & Annotation)[];

    for (const mri of rawMRIs) {
      const { id, patient_id, study_id, ...annotation } = mri;

      if (!mris[study_id])
        mris[study_id] = { id, patient_id, study_id, annotations: [] };

      // mri_id is only defined if MRI has annotations !!
      if (annotation.mri_id)
        mris[study_id].annotations.push(annotation);
    }

    const MRIs: MRI[] = Object.values(mris);

    return { patient, MRIs, meld };

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function importCasesData(): void {
  try {
    const meldCases = JSON.parse(
      fs.readFileSync(getFileRoute('../json/MELD_data.json'), 'utf-8')
    ) as MeldCase[];

    for (const mCase of meldCases) {
      let patient_id: number | bigint = 0;
      let mri_id: number | bigint = 0;
      let changes: number | bigint = 0;

      DB.transaction(() => {
        patient_id = dynamicInsert('patients', mCase.patient);
        if (!patient_id) return;

        mCase.meld.patient_id = patient_id;

        changes = dynamicInsert('MELD', mCase.meld);
        if (!changes) return;

        for (const mri of mCase.MRIs) {
          const { annotations, ...mriData } = mri;
          mriData.patient_id = patient_id;

          mri_id = dynamicInsert('MRIs', mriData);
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

function dynamicInsert(table: string, data: Record<string, any>): number | bigint {
  try {
    const keys = Object.keys(data);
    const columns = keys.join(', ');
    const params = keys.map(k => '@' + k).join(', ');

    const results = DB.prepare(`
      INSERT INTO '${table}' (${columns}) VALUES (${params})
    `).run(data);

    return results.lastInsertRowid;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function closeDB(): void {
  DB.close();
}