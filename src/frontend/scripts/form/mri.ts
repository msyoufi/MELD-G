import { get, listen, promptUser, getFormValues, showMessage } from "../shared/utils.js";
import { renderMRIs } from "./mri-renderer.js";
import { patientId, updatePatientInfos } from "./case.js";

let MRIs: Map<string, MRI> = new Map();
let annotations: Map<string, Annotation> = new Map();
let hasLesionalMri_initial = '0';

export function cacheInitialMriState(caseData: MELDCase): void {
  MRIs = caseData.MRIs;
  annotations = caseData.annotations;
  hasLesionalMri_initial = caseData.patient.has_lesional_mri;
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
  e.preventDefault();

  const mriValues = getFormValues<Omit<MRI, 'id'>>(mriForm);

  const newMri = await window.electron.handle<MRI | null>('MRI:create', mriValues);

  if (!newMri)
    return;

  MRIs.set(newMri.id.toString(), newMri);

  renderMRIs(MRIs, annotations);
  closeMriForm();
  showMessage('Neues MRT gespeichert');
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
  const result = await window.electron.handle<number>('MRI:delete', mriId);

  if (!result)
    return showMessage('MRT konnte nicht gelöscht werden', 'red', 4000);

  MRIs.delete(mriId);
  const remaindAnnotations = annotations.entries().filter(ann => ann[1].mri_id.toString() !== mriId);
  annotations = new Map(remaindAnnotations);

  renderMRIs(MRIs, annotations);
  showMessage('MRT gelöscht');
  updateHasLesionalMRI();
}

// Annotation logic
const annFormOverlay = get<HTMLDivElement>('ann_form_overaly');
const annotationForm = get<HTMLFormElement>('annotation_form');
const entityCodeSelect = get<HTMLSelectElement>('entity_code_select');
const entityNameInput = get<HTMLInputElement>('entity_name');
const annotationSubmit = get<HTMLButtonElement>('annotation_submit');

listen(annotationForm, 'submit', onAnnotationFormSubmit);
listen(annotationForm, 'change', toggleAnnotationSubmit);
listen(annotationForm, 'input', toggleAnnotationSubmit);
listen(annotationForm, 'reset', closeAnnotationForm);
listen(entityCodeSelect, 'change', toggleEntitySelect);

async function onAnnotationFormSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();

  const annValues = getFormValues<AnnotationForm>(annotationForm);
  const operation = annValues.ann_id ? 'update' : 'create';

  const annotation =
    await window.electron.handle<Annotation | null>(`annotation:${operation}`, annValues);

  if (!annotation)
    return showMessage('Annotation konnte nicht gespeichert werden', 'red', 4000);

  annotations.set(annotation.ann_id.toString(), annotation);

  renderMRIs(MRIs, annotations);
  closeAnnotationForm();
  showMessage(`Annotation "${annotation.entity_name}" gespeichert`);
  updateHasLesionalMRI();
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
  const result = await window.electron.handle<number>('annotation:delete', annId);

  if (!result)
    return showMessage('Annotation konnte nicht gelöscht werden', 'red', 4000);

  const annotationName = annotations.get(annId)?.entity_name;

  annotations.delete(annId);
  renderMRIs(MRIs, annotations);
  showMessage(`Annotation "${annotationName}" gelöscht`);
  updateHasLesionalMRI();
}

function updateHasLesionalMRI(): void {
  const newValue = annotations.size ? '1' : '0'
  hasLesionalMriInput.value = newValue;

  if (hasLesionalMri_initial === newValue)
    return;

  hasLesionalMri_initial = newValue;
  updatePatientInfos('silent');
}