import fs from 'node:fs';
import { DB } from "./init.js";
import { dynamicInsert, dynamicUpdate, dynamicDelete } from './utils.js';
import { getFileRoute } from '../main/utils.js';

export const MELD_FORM: FormControl[] = JSON.parse(
  fs.readFileSync(getFileRoute('backend/resources/form.json'), 'utf-8')
);

export const ENTITIES: EntityGroup[] = JSON.parse(
  fs.readFileSync(getFileRoute('backend/resources/entities.json'), 'utf-8')
);

export function getAllPatients(): PatientInfos[] {
  try {
    return DB.prepare('SELECT * FROM patients ORDER BY surename').all() as PatientInfos[];

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function searchPatients_advanced(e: any, filters: AdvancedSearchForm): PatientInfos[] {
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

export function getCase(patient: PatientInfos): MELDCase {
  try {
    const mrisWithAnnotations = getCaseMRIs(patient.id);
    const { MRIs, annotations } = separateMIRs_Annotations(mrisWithAnnotations);
    const meld = getCaseMeldData(patient.id);

    return { patient, MRIs, annotations, meld };

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function getCaseMRIs(patientId: number | bigint): (MRI & Annotation)[] {
  try {
    return DB.prepare(`
      SELECT MRIs.*, annotations.* FROM MRIs
      LEFT JOIN annotations ON annotations.mri_id = MRIs.id
      WHERE patient_id = @patientId
    `).all({ patientId }) as (MRI & Annotation)[]

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function separateMIRs_Annotations(mrisWithAnnotations: (MRI & Annotation)[]): {
  MRIs: Map<string, MRI>,
  annotations: Map<string, Annotation>
} {
  const MRIs: Map<string, MRI> = new Map();
  const annotations: Map<string, Annotation> = new Map();

  for (const mriWihtAnn of mrisWithAnnotations) {
    const { id, patient_id, study_id, ...annotation } = mriWihtAnn;
    const mri_id = id.toString();

    if (!MRIs.has(mri_id))
      MRIs.set(mri_id, { id, patient_id, study_id });

    // mri_id is only defined if MRI has annotations !!
    if (annotation.mri_id)
      annotations.set(annotation.ann_id.toString(), annotation);
  }

  return { MRIs, annotations };
}

function getCaseMeldData(patientId: number | bigint): MELD {
  try {
    return DB.prepare(`
      SELECT * FROM meld WHERE patient_id = @patientId
    `).get({ patientId }) as MELD;

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