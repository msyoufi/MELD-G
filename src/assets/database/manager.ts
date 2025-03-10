import Database from 'better-sqlite3';
import { getFileRoute } from '../../main.js';
import fs from 'node:fs';

export const MELD_FORM: FormControl[] = JSON.parse(
  fs.readFileSync(getFileRoute('assets/database/form.json'), 'utf-8')
);

export const ENTITIES: EntityGroup[] = JSON.parse(
  fs.readFileSync(getFileRoute('assets/database/entities.json'), 'utf-8')
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
    return DB.prepare('SELECT * FROM patients ORDER BY surename').all() as PatientInfos[];

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function advancedSearch(e: any, filters: AdvancedSearchForm): PatientInfos[] {
  try {
    let results: PatientInfos[] = [];
    const { studyId, entityCode } = filters;

    if (studyId) {
      results = DB.prepare(`
        SELECT * FROM patients WHERE id = (
          SELECT patient_id FROM MRIs WHERE study_id = @studyId
          )
        ORDER BY surename
      `).all({ studyId }) as PatientInfos[];

    } else if (entityCode) {
      results = DB.prepare(`
        SELECT * FROM patients WHERE id IN (
          SELECT patient_id FROM MRIs WHERE id IN (
              SELECT mri_id FROM annotations WHERE entity_code = @entityCode
              )
          )
        ORDER BY surename
      `).all({ entityCode }) as PatientInfos[];
    }

    return results;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function createCase(patient: Omit<PatientInfos, 'id'>): PatientInfos | null {
  try {
    let newPatient: PatientInfos | null = null;

    DB.transaction(() => {
      newPatient = dynamicInsert<PatientInfos>('patients', patient);
      if (!newPatient) return;

      const meld = dynamicInsert<MELD>('MELD', { patient_id: newPatient.id });
      if (!meld) return;
    })();

    return newPatient;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function deleteCase(id: number | bigint): number {
  try {
    return dynamicDelete('patients', { id });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function getCaseData(patient: PatientInfos): MELDCase {
  try {
    const MRIs: Map<string, MRI> = new Map();
    const annotations: Map<string, Annotation> = new Map();

    const mrisStatement = DB.prepare(`
      SELECT MRIs.*, annotations.* FROM MRIs
      LEFT JOIN annotations ON annotations.mri_id = MRIs.id
      WHERE patient_id = @id
    `);

    const rows = mrisStatement.all({ id: patient.id }) as (MRI & Annotation)[]

    for (const row of rows) {
      const { id, patient_id, study_id, ...annotation } = row;
      const mri_id = id.toString();

      if (!MRIs.has(mri_id))
        MRIs.set(mri_id, { id, patient_id, study_id });

      // mri_id is only defined if MRI has annotations !!
      if (annotation.mri_id)
        annotations.set(annotation.ann_id.toString(), annotation);
    }

    const meld = DB.prepare(`
      SELECT * FROM meld WHERE patient_id = @id
    `).get({ id: patient.id }) as MELD;

    return { patient, MRIs, annotations, meld };

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function updatePatientInfos(patient: PatientInfos): PatientInfos {
  try {
    return dynamicUpdate('patients', patient, { id: patient.id });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function updateMeldData(e: any, meld: Partial<MELD>): MELD {
  try {
    return dynamicUpdate('MELD', meld, { patient_id: meld.patient_id! });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function createMRI(e: any, mri: Omit<MRI, 'id'>): MRI {
  try {
    return dynamicInsert('MRIs', mri);

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function deleteMRI(e: any, id: string): number {
  try {
    return dynamicDelete('MRIs', { id });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function createAnnotation(e: any, annotation: AnnotationForm): Annotation {
  try {
    const { ann_id, ...annData } = annotation;
    return dynamicInsert('annotations', annData);

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function updateAnnotation(e: any, annotation: AnnotationForm): Annotation {
  try {
    const { ann_id, mri_id, ...annData } = annotation;
    return dynamicUpdate('annotations', annData, { ann_id });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function deleteAnnotation(e: any, ann_id: string): number {
  try {
    return dynamicDelete('annotations', { ann_id });

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function importCasesData(): void {
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

function dynamicInsert<T>(table: string, data: Record<string, any>): T {
  try {
    const keys = Object.keys(data);
    const columns = keys.join(', ');
    const params = keys.map(k => '@' + k).join(', ');

    const results = DB.prepare(`
      INSERT INTO '${table}' (${columns}) VALUES (${params}) RETURNING *
    `).get(data) as T;

    return results;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function dynamicUpdate<T>(table: string, data: Record<string, any>, condition: { [key: string]: number | bigint | string }
): T {
  try {
    const keys = Object.keys(data);
    const params = keys.map(k => k + ' = @' + k).join(', ');
    const column = Object.keys(condition)[0];
    const value = condition[column];

    const results = DB.prepare(`
      UPDATE '${table}' SET ${params} WHERE ${column} = ${value} RETURNING *
    `).get(data) as T;

    return results;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function dynamicDelete(table: string, condition: { [key: string]: number | bigint | string }): number {
  try {
    const column = Object.keys(condition)[0];
    const value = condition[column];

    const results = DB.prepare(`
      DELETE FROM '${table}' WHERE ${column} = ${value}
    `).run();

    return results.changes;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function closeDB(): void {
  DB.close();
}