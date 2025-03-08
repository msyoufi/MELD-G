import { create, formatDate, get, getFormValues, listen } from "./utils.js";

let patientsCahce: PatientInfos[] = [];

const managementForm = get<HTMLFormElement>('management_form');
const patientsList = get<HTMLUListElement>('patients_list');
const patientsCounter = get<HTMLSpanElement>('patients_counter');

listen(managementForm, 'submit', onManagementFormChange);
listen(managementForm, 'change', onManagementFormChange);
listen('reset_button', 'click', resetList);
listen('new_case_button', 'click', () => openMeldForm(null));

window.electron.receive('patient:list', (e: any, allPatients: PatientInfos[]) => {
  patientsCahce = allPatients;
  renderList(allPatients);
  setCasesCount(allPatients.length);
});

window.electron.receive('patient-list:sync', handlePatientListSync);

function onManagementFormChange(e: InputEvent | SubmitEvent): void {
  if (e instanceof SubmitEvent)
    e.preventDefault();

  const filteredList = applyFilters();

  renderList(filteredList);
  setCasesCount(filteredList.length);
}

function applyFilters(): PatientInfos[] {
  const { query, completeStatus, mriStatus } = getFormValues<ManagementForm>(managementForm);

  const foundList = searchPatients(query.toLowerCase());
  const filteredList = filterComplete(foundList, completeStatus);
  return filterMri(filteredList, mriStatus);
}

function searchPatients(query: string): PatientInfos[] {
  if (!query)
    return patientsCahce;

  return patientsCahce.filter(pat => {
    const firstname = pat.firstname.toLowerCase();
    const surename = pat.surename.toLowerCase();

    return surename.startsWith(query)
      || firstname.startsWith(query)
      || pat.kkb_id.startsWith(query);
  });
}

function filterComplete(list: PatientInfos[], status: 'all' | '0' | '2'): PatientInfos[] {
  return status === 'all'
    ? list
    : list.filter(pat => pat.is_complete === status);
}

function filterMri(list: PatientInfos[], status: 'all' | '0' | '1'): PatientInfos[] {
  return status === 'all'
    ? list
    : list.filter(pat => pat.has_lesional_mri === status);
}

function renderList(patients: PatientInfos[]): void {
  patientsList.innerHTML = '';

  if (!patients.length) {
    patientsList.innerHTML = '<li class="empty-bar">Keine Fälle gefunden</li>';
    return;
  }

  for (const pat of patients) {
    const patientBar = createPatientBar(pat);
    patientsList.appendChild(patientBar);
  }
}

function createPatientBar(pat: PatientInfos): HTMLElement {
  const barHtml = `
    <span>${pat.kkb_id}</span>
    <span>${pat.surename}, ${pat.firstname}</span>
    <span>${formatDate(pat.DOB)}</span>
  `;

  const li = create('li', ['patient-bar'], barHtml);
  li.id = `case_${pat.id}`;

  if (pat.is_complete === '2')
    li.classList.add('complete');

  listen(li, 'click', () => openMeldForm(pat));

  return li;
}

function setCasesCount(count: number): void {
  patientsCounter.textContent = count === 1 ? '1 Fall' : count + ' Fälle';
}

function resetList(): void {
  managementForm.reset();
  renderList(patientsCahce);
  setCasesCount(patientsCahce.length);
  scroll(0, 0);
}

function openMeldForm(patient: PatientInfos | null): void {
  window.electron.handle('form:open', patient);
}

function handlePatientListSync(e: any, change: PatientInfos | number | bigint): void {

  if (typeof change === 'number' || typeof change === 'bigint') {
    patientsCahce = patientsCahce.filter(p => p.id !== change);

  } else {
    const index = patientsCahce.findIndex(p => p.id === change.id);

    if (index >= 0)
      patientsCahce.splice(index, 1, change);
    else {
      patientsCahce.push(change);
      patientsCahce.sort((a, b) => a.surename.localeCompare(b.surename));
    }
  }

  const filteredList = applyFilters();

  renderList(filteredList);
  setCasesCount(filteredList.length);
}