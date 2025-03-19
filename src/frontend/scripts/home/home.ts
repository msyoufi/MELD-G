import { create, formatDate, get, getFormValues, listen, populateEntitySelect } from "../shared/utils.js";

let patientsCache: PatientInfos[] = [];

const searchForm = get<HTMLFormElement>('search_form');
const advSearchForm = get<HTMLFormElement>('advanced_search_form');
const advFormOverlay = get<HTMLDivElement>('advanced_form_overlay');
const patientsList = get<HTMLUListElement>('patients_list');
const patientsCounter = get<HTMLSpanElement>('patients_counter');
const selectedEntity = get<HTMLSpanElement>('selected_entity');
const queryContent = get<HTMLSpanElement>('query_content');
const entitySelect = get<HTMLSelectElement>('entity_filter_select');
const toTopBtn = get<HTMLElement>('to_top_btn');


window.electron.receive('patient:all', onPatientListRecieve);
window.electron.receive('patient-list:sync', handlePatientListSync);
window.electron.receive('entity:all', onEntityGroupsRecieve);


listen(searchForm, 'submit', e => e.preventDefault());
listen(searchForm, 'change', onSearchFormChange);

listen(advSearchForm, 'submit', onAdvSearchFormSubmit);
listen(advSearchForm, 'reset', closeAdvSearchForm);

listen('reset_button', 'click', resetList);
listen('advanced_search_btn', 'click', openAdvSearchForm);


function onEntityGroupsRecieve(e: any, entityGroups: EntityGroup[]): void {
  populateEntitySelect('entity_filter_select', entityGroups);
}

function onPatientListRecieve(e: any, allPatients: PatientInfos[]): void {
  patientsCache = allPatients;
  renderList(allPatients);
  setCasesCount(allPatients.length);
}

async function getAllPatients(): Promise<PatientInfos[]> {
  try {
    return await window.electron.handle<PatientInfos[]>('patient:all');

  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
}

// Standard Search Form logic

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

  setQueryContent(query ? `"${query}"` : '');

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

// Advanced Search Form logic

async function onAdvSearchFormSubmit(e: SubmitEvent): Promise<void> {
  try {
    e.preventDefault();

    const filters = getFormValues<AdvancedSearchForm>(advSearchForm);

    if (!filters.studyId && !filters.entityCode)
      return console.log('Invalid search query');

    patientsCache = await window.electron.handle<PatientInfos[]>('search:advanced', filters);

    const selectedFilter = filters.studyId ? filters.studyId : filters.entityCode;

    renderList(patientsCache);
    resetSearchForm();
    setCasesCount(patientsCache.length);
    setSelectedEntity(selectedFilter);
    closeAdvSearchForm();
    scroll(0, 0);

  } catch (err: unknown) {
    console.log(err);
  }
}

function openAdvSearchForm(): void {
  advFormOverlay.style.display = 'flex';
  get<HTMLInputElement>('study_id_input').focus();
}

function closeAdvSearchForm(): void {
  advFormOverlay.style.display = 'none';
  advSearchForm.reset();
}

// Rendering

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

  listen(li, 'click', () => showFormWindow(pat));

  return li;
}

function setCasesCount(count: number): void {
  patientsCounter.textContent = count === 1 ? '1 Fall' : count + ' Fälle';
}

function setSelectedEntity(code: string): void {
  if (!code) {
    selectedEntity.textContent = '';
    return;
  }

  const content = entitySelect.querySelector(`option[value="${code}"]`)?.textContent;
  selectedEntity.textContent = content ? content : code;
}

function setQueryContent(content: string): void {
  queryContent.textContent = content;
}

async function resetList(): Promise<void> {
  // Request all patients again only if currently in advanced search mode
  if (selectedEntity.innerText)
    patientsCache = await getAllPatients();

  resetSearchForm();
  renderList(patientsCache);
  setCasesCount(patientsCache.length);
  scroll(0, 0);
}

function resetSearchForm(): void {
  searchForm.reset();
  setSelectedEntity('');
  setQueryContent('');
}

function showFormWindow(patient: PatientInfos | null): void {
  window.electron.handle('form-window:show', patient);
}

function handlePatientListSync(e: any, change: PatientInfos | number | bigint): void {
  if (typeof change === 'number' || typeof change === 'bigint') {
    patientsCache = patientsCache.filter(p => p.id !== change);

  } else {
    const cacheIndex = patientsCache.findIndex(p => p.id === change.id);

    if (cacheIndex >= 0) {
      patientsCache.splice(cacheIndex, 1, change);

    } else {
      patientsCache.push(change);
      patientsCache.sort((a, b) => a.surename.localeCompare(b.surename));
    }
  }

  const filteredList = applyFilters();

  renderList(filteredList);
  setCasesCount(filteredList.length);
}

// Scroll to top
window.addEventListener('scroll', onWindowScroll);

listen(toTopBtn, 'click', () => scroll(0, 0));

function onWindowScroll(): void {
  toTopBtn.style.display = scrollY > 500 ? 'block' : 'none';
}