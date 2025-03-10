import { create, get, listen } from "./utils.js";
import { onAddAnnotationClick, onDeleteAnnotationClick, onDeleteMriClick, onEditAnnotationClick } from "./form.js";

export function renderMeldForm(e: any, form: FormControl[]): void {
  const mainSection = get<HTMLDivElement>('main_section');
  const opSection = get<HTMLDivElement>('op_section');

  for (const control of form) {
    const div = create('div', ['meld-control-field'], getControlHTML(control));
    div.id = 'field_' + control.name;

    if (control.section === 'main')
      mainSection.appendChild(div);
    else
      opSection.appendChild(div);
  }
}

function getControlHTML(control: FormControl): string {
  switch (control.type) {
    case 'text':
    case 'number':
      return createTextHTML(control);

    case 'select':
      return createSelectHTML(control);;

    case 'radio':
      return createRadioHTML(control);;

    case 'textArea':
      return createTextAreaHTML(control);
  }
}

function createTextHTML(ctrl: FormControl): string {
  return `
    <label for="${ctrl.name}">${ctrl.content}${ctrl.required ? '*' : ''}</label>
    <input type="${ctrl.type}" class="meld-input" id="${ctrl.name}" name="${ctrl.name}" ${ctrl.type === 'number' ? 'min="0"' : ''}>
    <p class="note">${ctrl.note}</p>
  `;
}

function createSelectHTML(ctrl: FormControl): string {
  return `
    <label for="${ctrl.name}">${ctrl.content}${ctrl.required ? '*' : ''}</label>
    <select class="meld-input" id="${ctrl.name}" name="${ctrl.name}">
      <option value="" hidden selected disabled></option>
      ${ctrl.choices.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
    </select>
    <p class="note">${ctrl.note}</p>
  `;
}

function createRadioHTML(ctrl: FormControl): string {
  return `
    <label for="${ctrl.name}">${ctrl.content}${ctrl.required ? '*' : ''}</label>
    <div class="choices-wrapper">
      ${ctrl.choices.map(c => {
    return `
      <div class="choice-box">
        <input type="radio" name="${ctrl.name}" value="${c.value}" id="${ctrl.name}_${c.value}">
        <label for="${ctrl.name}_${c.value}">${c.label}</label>
      </div>
      `}).join('')}
    </div>
    <p class="note">${ctrl.note}</p>
  `;
}

function createTextAreaHTML(ctrl: FormControl): string {
  return `
    <label for="${ctrl.name}">${ctrl.content}${ctrl.required ? '*' : ''}</label>
    <textarea class="meld-input" id="${ctrl.name}" name="${ctrl.name}"></textarea>
    <p class="note">${ctrl.note}</p>
  `;
}

const mrisList = get<HTMLUListElement>('mris_list');

// Event handlers for the MRI section icons
const eventHandlers = [
  { class: '.study-id', handler: onStudyIdClick },
  { class: '.mri-trash', handler: onDeleteMriClick },
  { class: '.bi-node-plus', handler: onAddAnnotationClick },
  { class: '.bi-pencil-square', handler: onEditAnnotationClick },
  { class: '.ann-trash', handler: onDeleteAnnotationClick }
];

export function renderMRIs(MRIs: Map<string, MRI>, annotations: Map<string, Annotation>): void {
  mrisList.innerHTML = '';

  if (!MRIs.size) {
    mrisList.innerHTML = '<li class="empty-mris">Keine MRTs für diesen Fall gespeichert</li>';
    return;
  }

  for (const mri of MRIs.values()) {
    const mriAnnotations: Annotation[] = Array.from(
      annotations.values().filter(ann => ann.mri_id === mri.id)
    );

    const li = create('li', [], createMriHTML(mri, mriAnnotations));
    mrisList.appendChild(li);
  }

  addEventHandlers();
}

function createMriHTML(mri: MRI, annotations: Annotation[]): string {
  return `
    <li class="mri-field" data-mri-id=${mri.id}>
      <p class="mri-data">
        Studien-UID:
        <span class="study-id">${mri.study_id}</span>
        <i class="bi bi-copy"></i>
        <div class="action-icons">
          <i class="bi bi-node-plus"></i>
          <i class="bi bi-trash mri-trash"></i>
        </div>
      </p>
      <ul class="annotations-list">
     ${createAnnotationsHTML(annotations)}
      </ul>
    </li>
  `;
}

function createAnnotationsHTML(annotations: Annotation[]): string {
  if (!annotations.length)
    return '<li class="non-lesional">MRT ist non-läsionell</li>';

  let html = `
    <li class="annotation">
      <span>Pfile-Nr.</span>
      <span>Entität</span>
      <span>Epileptogenizität</span>
      <span>Therapie</span>
      <span>Verlaufskontrolle</span>
      <span></span>
    </li>
  `;

  html += annotations.map(ann => `
    <li class="annotation" data-ann-id=${ann.ann_id}>
      <span>${ann.arrow_num ? ann.arrow_num : 'N/A'}</span>
      <span>${ann.entity_name}</span>
      <span>${decodeYesNo(ann.epileptogenic)}</span>
      <span>${decodeYesNo(ann.therapy)}</span>
      <span>${decodeYesNo(ann.follow_up)}</span>
      <div class="action-icons">
        <i class="bi bi-pencil-square"></i>
        <i class="bi bi-trash ann-trash"></i>
      </div>
    </li>
  `).join('\n');

  return html;
}

function decodeYesNo(code: '' | '0' | '1'): string {
  if (!code) return 'N/A';
  return code === '0' ? 'nein' : 'ja';
}

function addEventHandlers(): void {
  eventHandlers.forEach(eh => {
    mrisList.querySelectorAll(eh.class).forEach(el => {
      listen(el, 'click', eh.handler);
    });
  });
}

function onStudyIdClick(e: any): void {
  navigator.clipboard.writeText(e.target.innerText);
}