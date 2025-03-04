interface MeldCase {
  patient: PatientInfos,
  MRIs: MRI[],
  meld: MELD
}

interface PatientInfos {
  kkb_id: string,
  firstname: string,
  surename: string,
  DOB: string,
  sex: '0' | '1',
  has_lesional_mri: '0' | '1',
}

interface MRI {
  study_id: string,
  is_lesional: '0' | '1',
  entities: Entity[]
}

interface Entity {
  entity_code: string,
  epileptogenic: string,
  therapy: string,
  follow_up: string
}

interface MELD {
  site: 'H127',
  patient_control: '1',
  sex: string,
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
  aeds_post_op: string,
  participant_information_complete: '0' | '2'
}

interface ManagementForm {
  query: string,
  completeStatus: 'all' | '0' | '2',
  mriStatus: 'all' | '0' | '1',
}