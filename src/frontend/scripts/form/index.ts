import { renderMeldForm } from "./form-renderer.js";
import { renderMRIs } from "./mri-renderer.js";
import { cacheInitialMriState } from "./mri.js";
import { populateEntitySelect, formatDate, get, listen, promptUser, isAwaitingAnswer } from "../shared/utils.js";
import { setInitialCaseState, patientFormChanged, meldFormChanged, populatePatientForm, populateMeldForm, onMeldFormChange } from "./case.js";

const hiddenElementIds = ['main', 'case_delete_btn'];

window.electron.receive('form:get', renderMeldForm);
window.electron.receive('entity:all', onEntityGroupsRecieve);
window.electron.receive('case:get', onCaseRecieve);

function onEntityGroupsRecieve(e: any, entityGroups: EntityGroup[]): void {
  populateEntitySelect('entity_code_select', entityGroups);
}

async function onCaseRecieve(e: any, caseData: MELDCase): Promise<void> {
  if (isAwaitingAnswer || !await confirmNewCaseLoad())
    return;

  setInitialCaseState(caseData.patient.id);
  cacheInitialMriState(caseData);
  setupWindow(caseData.patient);
  showHiddenElements();
  renderMRIs(caseData.MRIs, caseData.annotations);
  populatePatientForm(caseData.patient);
  populateMeldForm(caseData.meld);
  onMeldFormChange();

  console.log(caseData)
}

async function confirmNewCaseLoad(): Promise<boolean> {
  if (patientFormChanged || meldFormChanged) {
    const answer = await promptUser('Sie haben die Änderungen nicht gespeichert!\ntrotzdem einen anderen Fall laden?', 'Anderen Fall laden');

    if (answer === 'cancel')
      return false;
  }

  return true;
}

function setupWindow(patient: PatientInfos): void {
  scroll(0, 0);

  document.title = `
    ${patient.surename}, ${patient.firstname} - 
    ${formatDate(patient.DOB)} -
    ${patient.kkb_id}
  `;
}

export function showHiddenElements(): void {
  hiddenElementIds.forEach(id => get<HTMLElement>(id).classList.remove('hidden'));
}

window.addEventListener('beforeunload', onBeforUnload)
listen('close_button', 'click', onBeforUnload);

async function onBeforUnload(e: any): Promise<void> {
  e.preventDefault();

  if (isAwaitingAnswer)
    return;

  if (patientFormChanged || meldFormChanged) {
    const answer = await promptUser('Sie haben die Änderungen nicht gespeichert!\ntrotzdem schleißen?', 'Schließen');

    if (answer === 'cancel')
      return;
  }

  closeWindow();
}

export function closeWindow(): void {
  window.electron.handle('window:close');
}