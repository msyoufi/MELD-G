import { create, formatDate, get, getFormValues, listen } from "./utils.js";

let patientsCache: PatientInfos[] = [];

const searchForm = get<HTMLFormElement>('search_form');
const patientsList = get<HTMLUListElement>('patients_list');
const patientsCounter = get<HTMLSpanElement>('patients_counter');

listen(searchForm, 'submit', onSearchFormChange);
listen(searchForm, 'change', onSearchFormChange);
listen('reset_button', 'click', resetList);
listen('new_case_button', 'click', () => openMeldForm(null));

window.electron.receive('patient:list', onPatientListRecieve);
window.electron.receive('patient-list:sync', handlePatientListSync);

function onPatientListRecieve(e: any, allPatients: PatientInfos[]): void {
  patientsCache = allPatients;
  renderList(allPatients);
  setCasesCount(allPatients.length);
}

function onSearchFormChange(e: InputEvent | SubmitEvent): void {
  if (e instanceof SubmitEvent)
    e.preventDefault();

  const filteredList = applyFilters();

  renderList(filteredList);
  setCasesCount(filteredList.length);
}

function applyFilters(): PatientInfos[] {
  const { query, completeStatus, mriStatus } = getFormValues<SearchForm>(searchForm);

  const foundList = searchPatients(query.toLowerCase());
  const filteredList = filterComplete(foundList, completeStatus);
  return filterMri(filteredList, mriStatus);
}

function searchPatients(query: string): PatientInfos[] {
  if (!query)
    return patientsCache;

  return patientsCache.filter(pat => {
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
  searchForm.reset();
  renderList(patientsCache);
  setCasesCount(patientsCache.length);
  scroll(0, 0);
}

function openMeldForm(patient: PatientInfos | null): void {
  window.electron.handle('form:open', patient);
}

function handlePatientListSync(e: any, change: PatientInfos | number | bigint): void {

  if (typeof change === 'number' || typeof change === 'bigint') {
    patientsCache = patientsCache.filter(p => p.id !== change);

  } else {
    const index = patientsCache.findIndex(p => p.id === change.id);

    if (index >= 0)
      patientsCache.splice(index, 1, change);

    else {
      patientsCache.push(change);
      patientsCache.sort((a, b) => a.surename.localeCompare(b.surename));
    }
  }

  const filteredList = applyFilters();

  renderList(filteredList);
  setCasesCount(filteredList.length);
}