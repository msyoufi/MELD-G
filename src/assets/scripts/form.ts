import { renderForm, renderMRIs } from "./form-renderer.js";
import { formatDate, get, getFormValues, listen } from "./utils.js";

window.electron.receive('form:get', renderForm);
window.electron.receive('case:get', onCaseRecieve);
window.electron.receive('form:reset', onFormReset);

function onCaseRecieve(e: any, meldCase: MeldCase): void {
  setupWindow(meldCase.patient);
  renderMRIs(meldCase.MRIs);
  populateForm(meldCase);
  onFormChange();
  console.log(meldCase)
}

function setupWindow(patient: PatientInfos): void {
  document.title = `
    ${patient.surename}, ${patient.firstname} - 
    ${formatDate(patient.DOB)} -
    ${patient.kkb_id}
  `;
}

function onFormReset(e: any): void {
  console.log('reset');
}

// MRI section
listen('add_mri', 'click', onAddMriClick);

function onAddMriClick(): void {
  // TODO
  console.log('Add new MRI');
}

export function onDeleteMriClick(e: any): void {
  const mriId = e.target.closest('li').dataset.mriId;
  // TODO
  console.log('Delete MRI', mriId);
}

export function onAddAnnotationClick(e: any): void {
  const mriId = e.target.closest('li').dataset.mriId;
  // TODO
  console.log('Add Annotation', mriId);
}

export function onEditAnnotationClick(e: any): void {
  const annId = e.target.closest('li').dataset.annId;
  // TODO
  console.log('Edit Annotation', annId);
}

export function onDeleteAnnotationClick(e: any): void {
  const annId = e.target.closest('li').dataset.annId;
  // TODO
  console.log('Delete Annotation', annId);
}

export function onStudyIdClick(e: any): void {
  navigator.clipboard.writeText(e.target.innerText);
}

// MELD form section
const completeControl = get<HTMLInputElement>('is_complete');
const patientInfos = get<HTMLDivElement>('patient_infos');
const meldSection = get<HTMLDivElement>('meld_section');
const opSection = get<HTMLDivElement>('op_section');
const meldForm = get<HTMLFormElement>('meld_form');

const dynamicControles = ['radiology', 'procedure', 'histology'];

listen(meldForm, 'submit', onFormSubmit);
listen(meldForm, 'change', onFormChange);

function onFormSubmit(e: SubmitEvent): void {
  e.preventDefault();

  const values = getFormValues(meldForm);
  console.log(values);
}

function populateForm(meldCase: MeldCase): void {
  patientInfos.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = meldCase.patient[input.name as keyof PatientInfos];
      input.value = value.toString();
    });

  meldSection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = meldCase.meld[input.name as keyof MELD];

      if (input.type === 'radio')
        input.checked = input.value === value;
      else
        input.value = value.toString();
    });

  completeControl.checked = meldCase.patient.is_complete === '2';
}

function onFormChange(): void {
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