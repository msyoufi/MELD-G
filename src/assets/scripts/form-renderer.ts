import { get } from "./utils.js";

export function renderForm(e: any, form: FormControl[]): void {
  const mainSection = get<HTMLDivElement>('main_section');
  const opSection = get<HTMLDivElement>('op_section');

  for (const control of form) {
    const div = document.createElement('div');

    div.id = 'field_' + control.name;
    div.className = 'meld-control';
    div.innerHTML = getControlHTML(control);

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

export function renderMRIs(mris: MRI[]): void {
  const mrisList = get<HTMLUListElement>('mris_list');
  mrisList.innerHTML = '';

  if (!mris.length) {
    mrisList.innerHTML = '<li class="empty-mris">Keine MRTs für diesen Fall vorhanden</li>';
    return;
  }

  for (const mri of mris) {
    const li = document.createElement('li');
    li.innerHTML = getMriHTML(mri);
    mrisList.appendChild(li);
  }
}

function getMriHTML(mri: MRI): string {
  return `
    <li class="mri-field" id="${mri.id}">
      <p>Studien-UID: ${mri.study_id}</p>
      <ul>
      ${mri.annotations.length
      ? mri.annotations.map(ann => getAnnotationHTML(ann)).join('')
      : '<li class="mri-annotation">MRT is non-läsionell</li>'}
      </ul>
    </li>
  `;
}

function getAnnotationHTML(ann: Annotation): string {
  return `
    <li class="annotation">
      <span>${ann.entity_code}</span>
      <span>${ann.epileptogenic}</span>
      <span>${ann.therapy}</span>
      <span>${ann.follow_up}</span>
    </li>
  `;
}