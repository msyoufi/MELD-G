import { get, getFormValues, listen } from "./utils.js";

const cases: { [key: string]: MeldCase[] } = { ALL: [], found: [], current: [] };

window.electron.receive('case:list', (e: any, casesData: MeldCase[]) => {
  cases.ALL = casesData;
  updateCasesList();
});

function updateCasesList(event?: any): void {
  if (event instanceof SubmitEvent)
    event.preventDefault();

  cases.found = cases.ALL;

  const posY = scrollY;
  const { query, completeStatus, mriStatus } = getFormValues<ManagementForm>(managementForm);

  searchCases(query.toLowerCase());
  filterComplete(completeStatus);
  filterMri(mriStatus);
  renderList();
  scroll(0, posY);
}

const managementForm = get<HTMLFormElement>('management_form');
const casesList = get<HTMLUListElement>('cases_list');
const casesCounter = get<HTMLSpanElement>('cases_counter');

listen(managementForm, 'submit', updateCasesList);
listen(managementForm, 'change', updateCasesList);
listen('reset_button', 'click', resetCasesList);
listen('new_case_button', 'click', () => openMeldForm());

function searchCases(query: string): void {
  if (!query) return;

  cases.found = cases.ALL.filter(c => {
    const firstname = c.patient.firstname.toLowerCase();
    const surename = c.patient.surename.toLowerCase();

    return surename.startsWith(query)
      || firstname.startsWith(query)
      || c.patient.kkb_id.startsWith(query)
  });
}

function filterComplete(status: 'all' | '0' | '2'): void {
  cases.current = status === 'all'
    ? cases.found
    : cases.found.filter(c => c.meld.participant_information_complete === status);
}

function filterMri(status: 'all' | '0' | '1'): void {
  cases.current = status === 'all'
    ? cases.current
    : cases.current.filter(c => c.patient.has_lesional_mri === status);
}

function renderList(): void {
  casesList.innerHTML = '';

  casesCounter.textContent = `
    ${cases.current.length === 1 ? '1 Fall' : cases.current.length + ' Fälle'}
  `;

  if (!cases.current.length) {
    casesList.innerHTML = '<li class="empty-bar">Keine Fälle gefunden</li>';
    return;
  }

  for (const meldCase of cases.current) {
    const li = document.createElement('li');
    li.className = 'case-bar';

    if (meldCase.meld.participant_information_complete === '2')
      li.classList.add('complete');

    li.innerHTML = `
      <span>${meldCase.patient.kkb_id}</span>
      <span>${meldCase.patient.surename}, ${meldCase.patient.firstname}</span>
      <span>${meldCase.patient.DOB}</span>
    `;

    listen(li, 'click', () => openMeldForm(meldCase.patient.kkb_id));

    casesList.appendChild(li);
  }
}

function resetCasesList(): void {
  managementForm.reset();
  updateCasesList();
  scroll(0, 0);
}

function openMeldForm(patientId?: string): void {
  window.electron.handle('form:open', patientId);
}