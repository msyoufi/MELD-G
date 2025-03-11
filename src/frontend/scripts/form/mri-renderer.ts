import { create, get, listen } from "../shared/utils.js";
import { onAddAnnotationClick, onDeleteAnnotationClick, onDeleteMriClick, onEditAnnotationClick } from "./mri.js";

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