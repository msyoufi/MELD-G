import { DB } from "./init.js";

export function getPatientInfos(filteredIds: string | null): PatientInfos[] {
  try {
    const filter = filteredIds
      ? `WHERE id IN (${filteredIds})`
      : '';

    return DB.prepare(`
        SELECT * FROM patients ${filter}
      `).all() as PatientInfos[];

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function getMRIs(entities: string | null): (MRI & Annotation)[] {
  try {
    const entitiesCodes = entities?.split(',').map(e => `'${e.trim()}'`).join(', ');

    const filter = entitiesCodes
      ? ` WHERE mris.id IN (
            SELECT mri_id FROM annotations
            WHERE entity_code IN (${entitiesCodes})
          )`
      : '';

    const mrisWithAnnotations = DB.prepare(`
        SELECT mris.*, annotations.* FROM mris
        LEFT JOIN annotations ON annotations.mri_id = mris.id
        ${filter}
      `).all() as (MRI & Annotation)[];

    return mrisWithAnnotations;

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function getMeldData(filteredIds: string | null): (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' })[] {
  try {
    const filter = filteredIds
      ? `WHERE patient_id IN (${filteredIds})`
      : '';

    return DB.prepare(`
        SELECT meld.*, patients.sex, patients.is_complete FROM meld
        JOIN patients ON patients.id = meld.patient_id
        ${filter}
      `).all() as (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' })[];

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}