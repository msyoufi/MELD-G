CREATE TABLE IF NOT EXISTS 'patients' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'kkb_id' TEXT NOT NULL UNIQUE,
    'firstname' TEXT NOT NULL,
    'surename' TEXT NOT NULL,
    'DOB' TEXT NOT NULL,
    'sex' TEXT NOT NULL CHECK (sex IN ('0', '1')),
    'has_lesional_mri' TEXT NOT NULL CHECK (has_lesional_mri IN ('0', '1')),
    'is_complete' TEXT NOT NULL CHECK (is_complete IN ('0', '2'))
);

CREATE TABLE IF NOT EXISTS 'MRIs' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'patient_id' INTEGER NOT NULL,
    'study_id' TEXT NOT NULL UNIQUE,
    FOREIGN KEY ('patient_id') REFERENCES patients('id') ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'annotations' (
    'ann_id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'mri_id' INTEGER NOT NULL,
    'arrow_num' TEXT,
    'entity_name' TEXT NOT NULL,
    'entity_code' TEXT NOT NULL,
    'epileptogenic' TEXT CHECK (epileptogenic IN ('', '0', '1')),
    'therapy' TEXT CHECK (therapy IN ('', '0', '1')),
    'follow_up' TEXT CHECK (follow_up IN ('', '0', '1')),
    FOREIGN KEY ('mri_id') REFERENCES MRIs('id') ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'meld' (
    'patient_id' INTEGER NOT NULL,
    'site' TEXT NOT NULL DEFAULT 'H127',
    'patient_control' TEXT NOT NULL DEFAULT '1',
    'sex' TEXT NOT NULL CHECK (sex IN ('0', '1')),
    'radiology' TEXT,
    'radiology_other' TEXT,
    'field_strengths' TEXT NOT NULL DEFAULT '2',
    'age_at_preop_t1_3t' TEXT,
    'preop_t1_yr_3t' TEXT,
    'postop_t1_yr' TEXT,
    'preop_t1' TEXT NOT NULL DEFAULT '1',
    'preop_t2' TEXT NOT NULL DEFAULT '1',
    'preop_flair' TEXT NOT NULL DEFAULT '1',
    'preop_dwi' TEXT NOT NULL DEFAULT '1',
    'postop_t1' TEXT,
    'fields' TEXT NOT NULL DEFAULT '0',
    'lesion_mask' TEXT NOT NULL DEFAULT '0',
    'age_at_onset' TEXT,
    'gtcs' TEXT,
    'drug_resistant' TEXT,
    'aeds' TEXT,
    'mri_negative' TEXT,
    'seeg' TEXT,
    'operated' TEXT,
    'surgery_year' TEXT,
    'age_at_surgery' TEXT,
    'mri_negative_surgery' TEXT,
    'procedure' TEXT,
    'procedure_other' TEXT,
    'histology' TEXT,
    'histology_other' TEXT,
    'seizure_free' TEXT,
    'seizure_free_aura' TEXT,
    'engel_1yr' TEXT,
    'ilae_1yr' TEXT,
    'engel' TEXT,
    'ilae' TEXT,
    'follow_up' TEXT,
    'aeds_post_op' TEXT,
    'participant_information_complete'TEXT NOT NULL DEFAULT '0' CHECK( participant_information_complete in ('0', '2')),
    FOREIGN KEY ('patient_id') REFERENCES patients('id') ON DELETE CASCADE
);