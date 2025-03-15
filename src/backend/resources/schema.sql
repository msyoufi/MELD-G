CREATE TABLE IF NOT EXISTS 'patients' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'kkb_id' TEXT NOT NULL UNIQUE,
    'firstname' TEXT NOT NULL,
    'surename' TEXT NOT NULL,
    'DOB' TEXT NOT NULL,
    'sex' TEXT NOT NULL CHECK (sex IN ('0', '1', '555')),
    'has_lesional_mri' TEXT NOT NULL CHECK (has_lesional_mri IN ('0', '1')),
    'is_complete' TEXT NOT NULL CHECK (is_complete IN ('0', '2'))
);

CREATE TABLE IF NOT EXISTS 'mris' (
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
    'radiology' TEXT DEFAULT '',
    'radiology_other' TEXT DEFAULT '',
    'field_strengths' TEXT NOT NULL DEFAULT '2',
    'age_at_preop_t1_3t' TEXT DEFAULT '',
    'preop_t1_yr_3t' TEXT DEFAULT '',
    'postop_t1_yr' TEXT DEFAULT '',
    'preop_t1' TEXT NOT NULL DEFAULT '1',
    'preop_t2' TEXT NOT NULL DEFAULT '1',
    'preop_flair' TEXT NOT NULL DEFAULT '1',
    'preop_dwi' TEXT NOT NULL DEFAULT '1',
    'postop_t1' TEXT DEFAULT '',
    'fields' TEXT NOT NULL DEFAULT '0',
    'lesion_mask' TEXT NOT NULL DEFAULT '0',
    'age_at_onset' TEXT DEFAULT '',
    'gtcs' TEXT DEFAULT '',
    'drug_resistant' TEXT DEFAULT '',
    'aeds' TEXT DEFAULT '',
    'mri_negative' TEXT DEFAULT '',
    'seeg' TEXT DEFAULT '',
    'operated' TEXT DEFAULT '',
    'surgery_year' TEXT DEFAULT '',
    'age_at_surgery' TEXT DEFAULT '',
    'mri_negative_surgery' TEXT DEFAULT '',
    'procedure' TEXT DEFAULT '',
    'procedure_other' TEXT DEFAULT '',
    'histology' TEXT DEFAULT '',
    'histology_other' TEXT DEFAULT '',
    'seizure_free' TEXT DEFAULT '',
    'seizure_free_aura' TEXT DEFAULT '',
    'engel_1yr' TEXT DEFAULT '',
    'ilae_1yr' TEXT DEFAULT '',
    'engel' TEXT DEFAULT '',
    'ilae' TEXT DEFAULT '',
    'follow_up' TEXT DEFAULT '',
    'aeds_post_op' TEXT DEFAULT '',
    FOREIGN KEY ('patient_id') REFERENCES patients('id') ON DELETE CASCADE
);