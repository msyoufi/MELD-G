import { formatDate, get, getFormValues, listen } from "./utils.js";

const patients: { [key: string]: PatientInfos[] } = { ALL: [], found: [], current: [] };

const managementForm = get<HTMLFormElement>('management_form');
const patientsList = get<HTMLUListElement>('patients_list');
const patientsCounter = get<HTMLSpanElement>('patients_counter');

listen(managementForm, 'submit', updateList);
listen(managementForm, 'change', updateList);
listen('reset_button', 'click', resetList);
listen('new_case_button', 'click', () => openMeldForm());

window.electron.receive('patient:list', (e: any, allPatients: PatientInfos[]) => {
  patients.ALL = allPatients;
  updateList();
});

function updateList(event?: any): void {
  if (event instanceof SubmitEvent)
    event.preventDefault();

  patients.found = patients.ALL;

  const posY = scrollY;
  const { query, completeStatus, mriStatus } = getFormValues<ManagementForm>(managementForm);

  searchPatients(query.toLowerCase());
  filterComplete(completeStatus);
  filterMri(mriStatus);
  renderList();
  scroll(0, posY);
}

function searchPatients(query: string): void {
  if (!query) return;

  patients.found = patients.ALL.filter(pat => {
    const firstname = pat.firstname.toLowerCase();
    const surename = pat.surename.toLowerCase();

    return surename.startsWith(query)
      || firstname.startsWith(query)
      || pat.kkb_id.startsWith(query);
  });
}

function filterComplete(status: 'all' | '0' | '2'): void {
  patients.current = status === 'all'
    ? patients.found
    : patients.found.filter(pat => pat.is_complete === status);
}

function filterMri(status: 'all' | '0' | '1'): void {
  patients.current = status === 'all'
    ? patients.current
    : patients.current.filter(pat => pat.has_lesional_mri === status);
}

function renderList(): void {
  patientsList.innerHTML = '';

  patientsCounter.textContent = `
    ${patients.current.length === 1 ? '1 Fall' : patients.current.length + ' Fälle'}
  `;

  if (!patients.current.length) {
    patientsList.innerHTML = '<li class="empty-bar">Keine Fälle gefunden</li>';
    return;
  }

  for (const pat of patients.current) {
    const li = document.createElement('li');
    li.className = 'patient-bar';

    if (pat.is_complete === '2')
      li.classList.add('complete');

    li.innerHTML = `
      <span>${pat.kkb_id}</span>
      <span>${pat.surename}, ${pat.firstname}</span>
      <span>${formatDate(pat.DOB)}</span>
    `;

    listen(li, 'click', () => openMeldForm(pat.id));

    patientsList.appendChild(li);
  }
}

function resetList(): void {
  managementForm.reset();
  patients.current = patients.ALL;
  renderList();
  scroll(0, 0);
}

function openMeldForm(patientId?: number | bigint): void {
  window.electron.handle('form:open', patientId);
}