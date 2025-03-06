import { create, get, listen } from "./utils.js";
import { onAddAnnotationClick, onDeleteAnnotationClick, onDeleteMriClick, onEditAnnotationClick, onStudyIdClick } from "./form.js";

export function renderForm(e: any, form: FormControl[]): void {
  const mainSection = get<HTMLDivElement>('main_section');
  const opSection = get<HTMLDivElement>('op_section');

  for (const control of form) {
    const div = create('div', ['meld-control'], getControlHTML(control));
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

export function renderMRIs(mris: MRI[]): void {
  mrisList.innerHTML = '';

  if (!mris.length) {
    mrisList.innerHTML = '<li class="empty-mris">Keine MRTs für diesen Fall vorhanden</li>';
    return;
  }

  for (const mri of mris) {
    const li = create('li', [], createMriHTML(mri))
    mrisList.appendChild(li);
  }

  addListeners();
}

function createMriHTML(mri: MRI): string {
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
     ${createAnnotationsHTML(mri.annotations)}
      </ul>
    </li>
  `;
}

function createAnnotationsHTML(annotations: Annotation[]): string {
  if (!annotations.length)
    return '<li class="non-lesional">MRT is non-läsionell</li>';

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

function addListeners(): void {
  mrisList.querySelectorAll('.study-id').forEach(el => {
    listen(el, 'click', onStudyIdClick);
  });

  mrisList.querySelectorAll('.bi-node-plus').forEach(el => {
    listen(el, 'click', onAddAnnotationClick);
  });

  mrisList.querySelectorAll('.bi-pencil-square').forEach(el => {
    listen(el, 'click', onEditAnnotationClick);
  });

  mrisList.querySelectorAll('.mri-trash').forEach(el => {
    listen(el, 'click', onDeleteMriClick);
  });

  mrisList.querySelectorAll('.ann-trash').forEach(el => {
    listen(el, 'click', onDeleteAnnotationClick);
  });
}