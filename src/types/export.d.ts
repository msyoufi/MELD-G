interface ExportConfigs {
  format: FileType
  dataScope: string,
  entities?: string,
}

interface ExportConfigsForm extends ExportConfigs {
  anonymous?: '1',
}

interface MELDCase_Export {
  patient?: PatientInfos_Export,
  MRIs?: MRI_Export[],
  meld?: MELD_Export
}

type PatientInfos_Export = Omit<PatientInfos, 'id'>

interface MRI_Export {
  study_id: string,
  annotations: Annotation_Export[]
}

type Annotation_Export = Omit<Annotation, 'ann_id' | 'mri_id'>

type MELD_Export =
  Omit<MELD, 'patient_id' | 'radiology_other'> &
  {
    id: string,
    sex: '0' | '1' | '555',
    radiology_report: string,
    participant_information_complete: '0' | '2'
  };

interface CollectedExportData {
  patients?: PatientInfos[],
  mris?: (MRI & Annotation)[],
  melds?: (MELD & { sex: '0' | '1' | '555', is_complete: '0' | '2' })[]
}

// Data dictionary export

interface SheetHTML {
  name: string,
  html: string
}

//  Import types

interface MELDCase_Import extends MELDCase_Export {
  patient: PatientInfos_Export,
}

interface ImportReport {
  total: number,
  imported: number
}