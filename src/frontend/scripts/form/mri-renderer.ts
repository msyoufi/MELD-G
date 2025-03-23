import { create, get, listen } from "../shared/utils.js";
import { onAddAnnotationClick, onDeleteAnnotationClick, onDeleteMriClick, onEditAnnotationClick } from "./mri.js";

const mrisList = get<HTMLUListElement>('mris_list');

// Event handlers for the MRI section icons
const eventHandlers = [
  { class: '.study-id', handler: onStudyIdClick },
  { class: '.mri-delete', handler: onDeleteMriClick },
  { class: '.ann-add', handler: onAddAnnotationClick },
  { class: '.ann-edit', handler: onEditAnnotationClick },
  { class: '.ann-delete', handler: onDeleteAnnotationClick }
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
        <span class="study-id" data-tooltip="&#10003; kopiert">${mri.study_id}</span>
        <i class="bi bi-copy"></i>
        <div class="action-icons">
          <button class="icon-button ann-add tooltip" data-tooltip="Annotation Hinzufügen">
            <i class="bi bi-node-plus"></i>
          </button>
          <button class="icon-button mri-delete tooltip" data-tooltip="MRT Löschen">
            <i class="bi bi-trash"></i>
          </button>
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
        <button class="icon-button ann-edit tooltip" data-tooltip="Annotation Bearbeiten">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="icon-button ann-delete tooltip" data-tooltip="Annotation Löschen">
          <i class="bi bi-trash"></i>
        </button>
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

function onStudyIdClick(e: MouseEvent): void {
  const span = e.target as HTMLSpanElement;
  navigator.clipboard.writeText(span.innerText);
  showCopiedTooltip(span);
}

function showCopiedTooltip(span: HTMLSpanElement): void {
  span.classList.add('tooltip');
  timer(() => span.classList.remove('tooltip'), 1000)();
}

function timer(fn: () => any, delay: number): () => void {
  let timeoutId: any;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(), delay);
  }
}