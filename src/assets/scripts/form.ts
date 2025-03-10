import { populateEntitySelect, renderMeldForm, renderMRIs } from "./form-renderer.js";
import { formatDate, get, getFormValues, listen, promptUser, isAwaitingAnswer } from "./utils.js";

let patientId: number | bigint = 0;
let hasLesionalMri_initial = '0';
let MRIs: Map<string, MRI> = new Map();
let annotations: Map<string, Annotation> = new Map();

let patientFormChanged = false;
let meldFormChanged = false;

const hiddenElementIds = ['main', 'case_delete_btn'];

window.electron.receive('form:get', renderMeldForm);
window.electron.receive('entity:list', populateEntitySelect);
window.electron.receive('case:get', onCaseRecieve);

async function onCaseRecieve(e: any, caseData: MELDCase): Promise<void> {
  if (isAwaitingAnswer || !await confirmNewCaseLoad())
    return;

  cacheInitialState(caseData);
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

function cacheInitialState(caseData: MELDCase): void {
  patientId = caseData.patient.id;
  hasLesionalMri_initial = caseData.patient.has_lesional_mri;
  MRIs = caseData.MRIs;
  annotations = caseData.annotations;
  patientFormChanged = false;
  meldFormChanged = false;
}

function setupWindow(patient: PatientInfos): void {
  scroll(0, 0);

  document.title = `
    ${patient.surename}, ${patient.firstname} - 
    ${formatDate(patient.DOB)} -
    ${patient.kkb_id}
  `;
}

function showHiddenElements(): void {
  hiddenElementIds.forEach(id => get<HTMLElement>(id).classList.remove('hidden'));
}

// MRI logic
const mriFormOverlay = get<HTMLDivElement>('mri_form_overaly');
const mriForm = get<HTMLFormElement>('mri_form');
const mriSubmit = get<HTMLButtonElement>('mri_submit');
const hasLesionalMriInput = get<HTMLInputElement>('has_lesional_mri');

listen('add_mri', 'click', openMriForm);
listen(mriForm, 'submit', onMriFormSubmit);
listen(mriForm, 'input', toggleMriSubmit);
listen(mriForm, 'reset', closeMriForm);

async function onMriFormSubmit(e: SubmitEvent): Promise<void> {
  try {
    e.preventDefault();

    const mriValues = getFormValues<Omit<MRI, 'id'>>(mriForm);

    const newMri = await window.electron.handle<MRI>('MRI:create', mriValues);

    MRIs.set(newMri.id.toString(), newMri);

    renderMRIs(MRIs, annotations);
    closeMriForm();

  } catch (err: unknown) {
    console.log(err);
  }
}

function toggleMriSubmit(): void {
  mriSubmit.disabled = mriForm.checkValidity() ? false : true;
}

function openMriForm(): void {
  get<HTMLInputElement>('mri_patient_id').value = patientId.toString();
  mriFormOverlay.style.display = 'flex';
  get<HTMLInputElement>('mri_study_id').focus();
}

function closeMriForm(): void {
  mriFormOverlay.style.display = 'none';
  mriForm.reset();
  get<HTMLInputElement>('mri_patient_id').value = '';
}

export async function onDeleteMriClick(e: any): Promise<void> {
  const mriId = e.target.closest('li').dataset.mriId as string;
  const studyId = MRIs.get(mriId)!.study_id;

  const answer = await promptUser(`Das MRT (${studyId}) samt Annotationen sicher löschen?`, 'Löschen');

  if (answer === 'confirm')
    deleteMRI(mriId);
}

async function deleteMRI(mriId: string): Promise<void> {
  try {
    const result = await window.electron.handle<number>('MRI:delete', mriId);

    if (!result)
      throw new Error('Fehler bei der Löschung des MRT!');

    MRIs.delete(mriId);
    const remaindAnnotations = annotations.entries().filter(ann => ann[1].mri_id.toString() !== mriId);
    annotations = new Map(remaindAnnotations);

    renderMRIs(MRIs, annotations);
    updateHasLesionalMRI();

  } catch (err: unknown) {
    console.log(err);
  }
}

// Annotation logic
const annFormOverlay = get<HTMLDivElement>('ann_form_overaly');
const annotationForm = get<HTMLFormElement>('annotation_form');
const entityCodeSelect = get<HTMLSelectElement>('entity_code');
const entityNameInput = get<HTMLInputElement>('entity_name');
const annotationSubmit = get<HTMLButtonElement>('annotation_submit');

listen(annotationForm, 'submit', onAnnotationFormSubmit);
listen(annotationForm, 'change', toggleAnnotationSubmit);
listen(annotationForm, 'input', toggleAnnotationSubmit);
listen(annotationForm, 'reset', closeAnnotationForm);
listen(entityCodeSelect, 'change', toggleEntitySelect);

async function onAnnotationFormSubmit(e: SubmitEvent): Promise<void> {
  try {
    e.preventDefault();

    const annValues = getFormValues<AnnotationForm>(annotationForm);
    const operation = annValues.ann_id ? 'update' : 'create';

    const annotation =
      await window.electron.handle<Annotation>(`annotation:${operation}`, annValues);

    if (!annotation)
      throw new Error('Fehler bei der Speicherung der Annotation');

    annotations.set(annotation.ann_id.toString(), annotation);

    renderMRIs(MRIs, annotations);
    closeAnnotationForm();
    updateHasLesionalMRI();

  } catch (err: unknown) {
    console.log(err);
  }
}

function toggleAnnotationSubmit(): void {
  annotationSubmit.disabled = annotationForm.checkValidity() ? false : true;
}

export function onAddAnnotationClick(e: any): void {
  const mriId = e.target.closest('li').dataset.mriId as string;

  openAnnotationForm();
  get<HTMLInputElement>('ann_mri_id').value = mriId;
}

export function onEditAnnotationClick(e: any): void {
  const annId = e.target.closest('li').dataset.annId as string;
  const annotation = annotations.get(annId)!;

  populateAnnotationForm(annotation);
  openAnnotationForm();
}

function populateAnnotationForm(annotation: Annotation): void {
  annotationForm.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(input => {
    const value = annotation[input.name as keyof Annotation];

    if (input.type === 'radio')
      input.checked = input.value === value;
    else
      input.value = value.toString();
  });

  if (entityCodeSelect.value === '0_1')
    entityNameInput.style.display = 'block';
}

function openAnnotationForm(): void {
  annFormOverlay.style.display = 'flex';
}

function closeAnnotationForm(): void {
  annFormOverlay.style.display = 'none';
  resetAnnotationForm();
}

function toggleEntitySelect(): void {
  const isOtherSelected = entityCodeSelect.value === '0_1';
  const entityName =
    entityCodeSelect.querySelector(`option[value="${entityCodeSelect.value}"]`)!.textContent!;

  entityNameInput.style.display = isOtherSelected ? 'block' : 'none';
  entityNameInput.value = isOtherSelected ? '' : entityName;
}

function resetAnnotationForm(): void {
  annotationForm.reset();

  get<HTMLInputElement>('ann_mri_id').value = '';
  get<HTMLInputElement>('ann_id').value = '';
  entityNameInput.style.display = 'none';
  annotationSubmit.disabled = true;
}

export async function onDeleteAnnotationClick(e: any): Promise<void> {
  const annId = e.target.closest('li').dataset.annId as string;
  const ann = annotations.get(annId)!;
  const answer = await promptUser(`Die Annotation (${ann.entity_name}) sicher löschen?`, 'Löschen');

  if (answer === 'confirm')
    deleteAnnotation(annId);
}

async function deleteAnnotation(annId: string): Promise<void> {
  try {
    const result = await window.electron.handle<number>('annotation:delete', annId);

    if (!result)
      throw new Error('Fehler bei der Löschung der Annotation');

    annotations.delete(annId);
    renderMRIs(MRIs, annotations);
    updateHasLesionalMRI();

  } catch (err: unknown) {
    console.log(err);
  }
}

function updateHasLesionalMRI(): void {
  const newValue = annotations.size ? '1' : '0'
  hasLesionalMriInput.value = newValue;

  if (hasLesionalMri_initial === newValue)
    return;

  hasLesionalMri_initial = newValue;
  updatePatientInfos();
}

// Patient and MELD forms logic
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
  renderMRIs(MRIs, annotations);
}

function updateCase(): void {
  if (!patientFormChanged && !meldFormChanged)
    return console.log('no changes to save');

  if (patientFormChanged)
    updatePatientInfos();

  if (meldFormChanged)
    updateMeldData();
}

async function updatePatientInfos(): Promise<void> {
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

function populatePatientForm(patient: PatientInfos): void {
  patientForm.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = patient[input.name as keyof PatientInfos];
      input.value = value.toString();
    });

  isCompleteInput.checked = patient.is_complete === '2';
}

function populateMeldForm(meld: MELD): void {
  meldForm.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = meld[input.name as keyof MELD];

      if (input.type === 'radio')
        input.checked = input.value === value;
      else
        input.value = value.toString();
    });
}

function onMeldFormChange(): void {
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

function closeWindow(): void {
  window.electron.handle('window:close');
}