import { populatePathosSelect, renderForm, renderMRIs } from "./form-renderer.js";
import { formatDate, get, getFormValues, listen, promptUser } from "./utils.js";

let patientId: number | bigint = 0;
let MRIs: Map<string, MRI> = new Map();
let annotations: Map<string, Annotation> = new Map();

window.electron.receive('form:get', renderForm);
window.electron.receive('pathos:list', populatePathosSelect);
window.electron.receive('case-data:get', onCaseDataRecieve);
window.electron.receive('case-MRIs:get', onCaseMRIsRecieve);
window.electron.receive('form:reset', onFormReset);

function onCaseDataRecieve(e: any, caseData: CaseData): void {
  patientId = caseData.patient.id;

  setupWindow(caseData.patient);
  populateMeldForm(caseData);
  onMeldFormChange();
}

function onCaseMRIsRecieve(e: any, caseMRIs: CaseMRIs): void {
  MRIs = caseMRIs.MRIs;
  annotations = caseMRIs.annotations;

  renderMRIs(caseMRIs);
}

function setupWindow(patient: PatientInfos): void {
  scroll(0, 0);

  document.title = `
    ${patient.surename}, ${patient.firstname} - 
    ${formatDate(patient.DOB)} -
    ${patient.kkb_id}
  `;
}

function onFormReset(e: any): void {
  // TODO
  console.log('reset');
}

// MRI logic
const mriFormOverlay = get<HTMLDivElement>('mri_form_overaly');
const mriForm = get<HTMLFormElement>('mri_form');
const mriSubmit = get<HTMLButtonElement>('mri_submit');

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

    renderMRIs({ MRIs, annotations });
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
  const answer = await promptUser(`Das MRT (${studyId}) samt Annotationen sicher löschen`, 'Löschen');

  if (answer === 'confirm')
    deleteMRI(mriId);
}

async function deleteMRI(mriId: string): Promise<void> {
  try {
    const result = await window.electron.handle<number>('MRI:delete', mriId);

    if (!result)
      throw new Error('Fehler bei der Löschung des MRT!');

    MRIs.delete(mriId);
    // Remaind annotations of the deleted MRI are ignored
    renderMRIs({ MRIs, annotations });

  } catch (err: unknown) {
    console.log(err);
  }
}

// Annotaion logic
const annFormOverlay = get<HTMLDivElement>('ann_form_overaly');
const annotationForm = get<HTMLFormElement>('annotation_form');
const entityCodeSelect = get<HTMLSelectElement>('entity_code');
const entityNameInput = get<HTMLInputElement>('entity_name');
const annotationSubmit = get<HTMLButtonElement>('annotation_submit');

listen(annotationForm, 'submit', onAnnotationFormSubmit);
listen(annotationForm, 'change', toggleAnnotationSubmit);
listen(annotationForm, 'input', toggleAnnotationSubmit);
listen(annotationForm, 'reset', closeAnnotationForm);
listen(entityCodeSelect, 'change', togglePathoSelect);

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

    renderMRIs({ MRIs, annotations });
    closeAnnotationForm();

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

function togglePathoSelect(): void {
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
    renderMRIs({ MRIs, annotations });

  } catch (err: unknown) {
    console.log(err);
  }
}

// MELD form section
const completeControl = get<HTMLInputElement>('is_complete');
const patientInfos = get<HTMLDivElement>('patient_infos');
const meldSection = get<HTMLDivElement>('meld_section');
const opSection = get<HTMLDivElement>('op_section');
const meldForm = get<HTMLFormElement>('meld_form');

const dynamicControles = ['radiology', 'procedure', 'histology'];

listen(meldForm, 'submit', onFormSubmit);
listen(meldForm, 'change', onMeldFormChange);

function onFormSubmit(e: SubmitEvent): void {
  e.preventDefault();

  const values = getFormValues(meldForm);
  // TODO
  console.log(values);
}

function populateMeldForm(caseData: CaseData): void {
  patientInfos.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = caseData.patient[input.name as keyof PatientInfos];
      input.value = value.toString();
    });

  meldSection.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    .forEach(input => {
      const value = caseData.meld[input.name as keyof MELD];

      if (input.type === 'radio')
        input.checked = input.value === value;
      else
        input.value = value.toString();
    });

  completeControl.checked = caseData.patient.is_complete === '2';
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