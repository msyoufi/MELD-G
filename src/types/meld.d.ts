interface ExportedMELDCase {
  patient: PatientInfos,
  MRIs: (MRI & { 'annotations': Annotation[] })[],
  meld: MELD
}

// Map key as string to avoid dealing with Bigint and Integer imprecision  (key = id)
interface MELDCase {
  patient: PatientInfos,
  MRIs: Map<string, MRI>,
  annotations: Map<string, Annotation>
  meld: MELD
}

interface PatientInfos {
  id: number | bigint,
  kkb_id: string,
  firstname: string,
  surename: string,
  DOB: string,
  sex: '0' | '1' | '555',
  has_lesional_mri: '0' | '1',
  is_complete: '0' | '2'
}

interface MRI {
  id: number | bigint,
  patient_id: number | bigint,
  study_id: string,
}

interface Annotation {
  ann_id: number | bigint,
  mri_id: number | bigint,
  arrow_num: string,
  entity_name: string,
  entity_code: string,
  epileptogenic: '' | '0' | '1',
  therapy: '' | '0' | '1',
  follow_up: '' | '0' | '1'
}

interface AnnotationForm extends Annotation {
  ann_id: string,
  mri_id: string,
}

interface MELD {
  patient_id: number | bigint,
  site: string,
  patient_control: '1' | '2',
  radiology: string,
  radiology_other: string,
  field_strengths: '2',
  age_at_preop_t1_3t: string,
  preop_t1_yr_3t: string,
  postop_t1_yr: string,
  preop_t1: '1',
  preop_t2: '1',
  preop_flair: '1',
  preop_dwi: '1',
  postop_t1: string,
  fields: '0',
  lesion_mask: '0',
  age_at_onset: string,
  gtcs: string,
  drug_resistant: string,
  aeds: string,
  mri_negative: string,
  seeg: string,
  operated: string,
  surgery_year: string,
  age_at_surgery: string,
  mri_negative_surgery: string,
  procedure: string,
  procedure_other: string,
  histology: string,
  histology_other: string,
  seizure_free: string,
  seizure_free_aura: string,
  engel_1yr: string,
  ilae_1yr: string,
  engel: string,
  ilae: string,
  follow_up: string,
  aeds_post_op: string
}

interface SearchForm {
  query: string,
  completeStatus: 'all' | '0' | '2',
  mriStatus: 'all' | '0' | '1',
}

interface AdvancedSearchForm {
  studyId: string,
  entityCode: string,
}

interface FormControl {
  name: string,
  type: 'text' | 'textArea' | 'number' | 'select' | 'radio',
  content: string,
  note: string,
  required: 0 | 1,
  section: 'main' | 'op',
  choices: Choice[]
}

interface Choice {
  value: string,
  label: string
}

interface EntityGroup {
  group_name: string,
  group_code: string,
  entities: PathoEntity[]
}

interface Entity {
  name: string,
  code: string
}