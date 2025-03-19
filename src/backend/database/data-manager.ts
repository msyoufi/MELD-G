import fs from 'node:fs';
import { DB } from "./index.js";
import { dynamicInsert, dynamicUpdate, dynamicDelete } from './utils.js';
import { getFileRoute, handleError } from '../main/utils.js';

export let MELD_FORM: FormControl[] = [];
export let ENTITIES: EntityGroup[] = [];

export function loadJsonFiles(): void {
  MELD_FORM = JSON.parse(
    fs.readFileSync(getFileRoute('backend/resources/form.json'), 'utf-8')
  );

  ENTITIES = JSON.parse(
    fs.readFileSync(getFileRoute('backend/resources/entities.json'), 'utf-8')
  );
}

export function getAllPatients(): PatientInfos[] {
  try {
    return DB.prepare('SELECT * FROM patients ORDER BY surename').all() as PatientInfos[];

  } catch (err: unknown) {
    handleError(err);
    return [];
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
    handleError(err);
    return [];
  }
}

export function createCase(patient: Omit<PatientInfos, 'id'>): PatientInfos | null {
  let newPatient: PatientInfos | null = null;

  DB.transaction(() => {
    newPatient = dynamicInsert<PatientInfos>('patients', patient);
    if (!newPatient) return;

    const meld = dynamicInsert<MELD>('MELD', { patient_id: newPatient.id });

    if (!meld) {
      newPatient = null;
      return;
    }
  })();

  return newPatient;
}

export function getCase(patient: PatientInfos): MELDCase | null {
  try {
    const mrisWithAnnotations = getCaseMRIs(patient.id);
    const { MRIs, annotations } = separateMIRs_Annotations(mrisWithAnnotations);
    const meld = getCaseMeldData(patient.id);

    return { patient, MRIs, annotations, meld };

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

function getCaseMRIs(patientId: number | bigint): (MRI & Annotation)[] {
  return DB.prepare(`
    SELECT MRIs.*, annotations.* FROM MRIs
    LEFT JOIN annotations ON annotations.mri_id = MRIs.id
    WHERE patient_id = @patientId
  `).all({ patientId }) as (MRI & Annotation)[]
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
  return DB.prepare(`
    SELECT * FROM meld WHERE patient_id = @patientId
  `).get({ patientId }) as MELD;
}

export function deleteCase(id: number | bigint): number {
  return dynamicDelete('patients', { id });
}

export function updatePatientInfos(patient: PatientInfos): PatientInfos {
  return dynamicUpdate('patients', patient, { id: patient.id });
}

export function updateMeldData(e: any, meld: Partial<MELD>): MELD | null {
  try {
    return dynamicUpdate('MELD', meld, { patient_id: meld.patient_id! });

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function createMRI(e: any, mri: Omit<MRI, 'id'>): MRI | null {
  try {
    return dynamicInsert('MRIs', mri);

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function deleteMRI(e: any, id: string): number {
  try {
    return dynamicDelete('MRIs', { id });

  } catch (err: unknown) {
    handleError(err);
    return 0;
  }
}

export function createAnnotation(e: any, annotation: AnnotationForm): Annotation | null {
  try {
    const { ann_id, ...annData } = annotation;
    return dynamicInsert('annotations', annData);

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function updateAnnotation(e: any, annotation: AnnotationForm): Annotation | null {
  try {
    const { ann_id, mri_id, ...annData } = annotation;
    return dynamicUpdate('annotations', annData, { ann_id });

  } catch (err: unknown) {
    handleError(err);
    return null;
  }
}

export function deleteAnnotation(e: any, ann_id: string): number {
  try {
    return dynamicDelete('annotations', { ann_id });

  } catch (err: unknown) {
    handleError(err);
    return 0;
  }
}