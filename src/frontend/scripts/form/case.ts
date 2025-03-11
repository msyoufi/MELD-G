import { get, listen, promptUser, getFormValues } from "../shared/utils.js";
import { renderMRIs } from "./mri-renderer.js";
import { showHiddenElements, closeWindow } from "./index.js";

export let patientId: number | bigint = 0;
export let patientFormChanged = false;
export let meldFormChanged = false;

export function setInitialCaseState(newPatientId: number | bigint): void {
  patientId = newPatientId;
  patientFormChanged = false;
  meldFormChanged = false;
}

const patientForm = get<HTMLFormElement>('patient_form');
const meldForm = get<HTMLFormElement>('meld_form');
const opSection = get<HTMLDivElement>('op_section');
const isCompleteInput = get<HTMLInputElement>('is_complete');

const dynamicControles = ['radiology', 'procedure', 'histology'];

listen(patientForm, 'submit', e => e.preventDefault());
listen(meldForm, 'submit', e => e.preventDefault());

listen(isCompleteInput, 'change', () => patientFormChanged = true);
listen(patientForm, 'input', () => patientFormChanged = true);
listen(meldForm, 'input', () => meldFormChanged = true);

listen(meldForm, 'change', onMeldFormChange);
listen('main_submit', 'click', onMainSubmit);

function onMainSubmit(): void {
  if (!patientId)
    createCase();
  else
    updateCase();
}

async function createCase(): Promise<void> {
  try {
    if (!patientForm.checkValidity())
      return console.log('invalid patient form');

    const { id, ...patientData } = getFormValues<PatientInfos>(patientForm);
    patientData.is_complete = '0';
    patientData.has_lesional_mri = '0';

    const newPatient = await window.electron.handle<PatientInfos>('case:create', patientData);

    setupWindowAfterCreate(newPatient);

    console.log(newPatient);

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

function setupWindowAfterCreate(newPatient: PatientInfos): void {
  patientId = newPatient.id;
  patientFormChanged = false;
  get<HTMLInputElement>('meld_patient_id').value = newPatient.id.toString();

  showHiddenElements();
  populatePatientForm(newPatient);
  renderMRIs(new Map(), new Map());
}

function updateCase(): void {
  if (!patientFormChanged && !meldFormChanged)
    return console.log('no changes to save');

  if (patientFormChanged)
    updatePatientInfos();

  if (meldFormChanged)
    updateMeldData();
}

export async function updatePatientInfos(): Promise<void> {
  try {
    if (!patientForm.checkValidity())
      return console.log('invalid patient form');

    const patient = getFormValues<PatientInfos>(patientForm);
    patient.is_complete = isCompleteInput.checked ? '2' : '0';

    const result = await window.electron.handle<PatientInfos>('patient:update', patient);

    patientFormChanged = false;

    console.log(result);

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

async function updateMeldData(): Promise<void> {
  try {
    if (!meldForm.checkValidity())
      return console.log('invalid MELD form');

    const meld = getFormValues<Partial<MELD>>(meldForm);

    const result = await window.electron.handle<MELD>('meld:update', meld);

    meldFormChanged = false;

    console.log(result);

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

export function populatePatientForm(patient: PatientInfos): void {
  patientForm.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = patient[input.name as keyof PatientInfos];
      input.value = value.toString();
    });

  isCompleteInput.checked = patient.is_complete === '2';
}

export function populateMeldForm(meld: MELD): void {
  meldForm.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = meld[input.name as keyof MELD];

      if (input.type === 'radio')
        input.checked = input.value === value;
      else
        input.value = value.toString();
    });
}

export function onMeldFormChange(): void {
  updateDynamicControls();
  toggleOpSection();
}

function updateDynamicControls(): void {
  dynamicControles.forEach(controlName => {
    const isOtherSelected = get<HTMLSelectElement>(controlName).value === '23';
    const otherField = get<HTMLDivElement>(`field_${controlName}_other`);

    otherField.style.display = isOtherSelected ? 'grid' : 'none';

    if (!isOtherSelected)
      otherField.querySelector('input')!.value = '';
  });
}

function toggleOpSection(): void {
  const isOperated = get<HTMLInputElement>('operated_1').checked;
  opSection.style.display = isOperated ? 'block' : 'none';

  if (!isOperated)
    resetOpSection();
}

function resetOpSection(): void {
  opSection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(input => {
    if (input.type === 'radio')
      input.checked = false;
    else
      input.value = '';
  });
}

// Case delete
listen('case_delete_btn', 'click', onCaseDeleteClick);

async function onCaseDeleteClick(): Promise<void> {
  const answer = await promptUser('Diesen Fall vollständig löschen?', 'Löschen');

  if (answer === 'confirm')
    deleteCase();
}

async function deleteCase(): Promise<void> {
  try {
    const result = await window.electron.handle<number>('case:delete', patientId);

    if (!result)
      throw new Error('Fehler beim Löschen des Falls!');

    closeWindow();

  } catch (err: unknown) {
    console.log(err);
  }
}