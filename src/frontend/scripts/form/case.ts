import { get, listen, promptUser, getFormValues, showMessage } from "../shared/utils.js";
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
listen('main_submit_btn', 'click', onMainSubmit);
window.addEventListener('keyup', onKeyup);

function onKeyup(e: KeyboardEvent): void {
  if (e.ctrlKey && e.key.toLowerCase() === 's')
    onMainSubmit();
}

function onMainSubmit(): void {
  if (!patientId)
    createCase();
  else
    updateCase();
}

async function createCase(): Promise<void> {
  if (!patientForm.checkValidity())
    return showMessage('Patientendaten bitte vervollständigen', 'red');

  const { id, ...patientData } = getFormValues<PatientInfos>(patientForm);
  patientData.is_complete = '0';
  patientData.has_lesional_mri = '0';

  const newPatient = await window.electron.handle<PatientInfos | null>('case:create', patientData);

  if (!newPatient)
    return;

  setupWindowAfterCreate(newPatient);
  showMessage('Fall erfolgreich angelegt');
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
    return showMessage('Alles bereits gespeichert!');

  if (patientFormChanged)
    updatePatientInfos();

  if (meldFormChanged)
    updateMeldData();
}

export async function updatePatientInfos(silent?: 'silent'): Promise<void> {
  if (!patientForm.checkValidity())
    return showMessage('Patientendaten bitte vervollständigen', 'red');

  const patient = getFormValues<PatientInfos>(patientForm);
  patient.is_complete = isCompleteInput.checked ? '2' : '0';

  const result = await window.electron.handle<PatientInfos | null>('patient:update', patient);

  if (!result)
    return;

  patientFormChanged = false;

  if (!silent)
    showMessage('Änderungen gespeichert');
}

async function updateMeldData(): Promise<void> {
  if (!meldForm.checkValidity())
    return showMessage('Pflichtfelder der MELD-Fragen bitte vervollständigen', 'red');

  const meld = getFormValues<Partial<MELD>>(meldForm);

  const result = await window.electron.handle<MELD | null>('meld:update', meld);

  if (!result)
    return;

  meldFormChanged = false;

  showMessage('Änderungen gespeichert');
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
listen('main_delete_btn', 'click', onCaseDeleteClick);

async function onCaseDeleteClick(): Promise<void> {
  const answer = await promptUser('Diesen Fall vollständig löschen?', 'Löschen');

  if (answer === 'confirm')
    deleteCase();
}

async function deleteCase(): Promise<void> {
  const result = await window.electron.handle<number>('case:delete', patientId);

  if (!result)
    return showMessage('Fall konnte nicht gelöscht werden', 'red', 4000);

  closeWindow();
}