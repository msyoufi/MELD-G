import Database from 'better-sqlite3';
import { getFileRoute } from '../../main.js';
import fs from 'node:fs';

const DB = new Database(getFileRoute('db/meld.db'));
initDB();

function initDB(): void {
  try {
    const migration = fs.readFileSync(getFileRoute('assets/database/schema.sql'), 'utf8');

    DB.pragma('journal_mode = WAL');
    DB.exec(migration);
    // importMeldData();

  } catch (err: unknown) {
    console.log(err);
  }
}

export function getPatientList(): PatientInfos[] {
  try {
    const allPatients = DB.prepare(`SELECT * FROM 'patients'`).all() as PatientInfos[];
    return allPatients;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function importMeldData(): void {
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
        const { entities, ...mriData } = mri;
        mriData.patient_id = patient_id;

        mri_id = dynamicInsert('MRIs', mriData);
        if (!mri_id) return;

        for (const entity of entities) {
          entity.mri_id = mri_id;

          changes = dynamicInsert('entities', entity);
          if (!changes) return;
        }
      }
    })();
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