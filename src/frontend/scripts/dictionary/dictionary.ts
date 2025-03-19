import { get, getFormValues, listen, showMessage } from "../shared/utils.js";

window.electron.receive('form:get', renderMeldTable);
window.electron.receive('entity:all', renderEntitiesTable);


// Rendering

const meldTable = get<HTMLTableElement>('meld_table');
const entitiesTable = get<HTMLTableElement>('entities_table');

function renderMeldTable(e: any, meldForm: FormControl[]): void {
  for (const control of meldForm) {
    let { name, content, choices } = control;
    if (name === 'radiology_other')
      name = 'radiology_report';

    const choicesStr = choices.map(c => `${c.value}, ${c.label} `).join('| ');
    const rowHtml = getRowHTML(name, content, choicesStr);
    meldTable.insertAdjacentHTML('beforeend', rowHtml);
  }
}

function getRowHTML(name: string, content: string, choices: string): string {
  return `
    <tr>
      <td>${name}</td>
      <td>${content}</td>
      <td>${choices}</td>
    </tr>
  `;
}

function renderEntitiesTable(e: any, entitiesGroups: EntityGroup[]): void {
  for (const group of entitiesGroups) {
    const { group_name, group_code, entities } = group;
    const groupRow = getGroupRowHTML(group_name, group_code);

    entitiesTable.insertAdjacentHTML('beforeend', groupRow);

    for (const entity of entities) {
      const { name, code } = entity;
      const entityRow = getEntityRowHTML(name, code);

      entitiesTable.insertAdjacentHTML('beforeend', entityRow);
    }
  }
}

function getGroupRowHTML(name: string, code: string): string {
  return `
    <tr class="entities-group-row">
      <td colspan="2">${name}</td>
      <td>${code}</td>
    </tr>
  `;
}

function getEntityRowHTML(name: string, code: string): string {
  return `
    <tr>
      <td></td>
      <td>${name}</td>
      <td>${code}</td>
    </tr>
  `;
}


// Navigation

const allTables = document.querySelectorAll('table');
const navAnchors = get<HTMLDivElement>('table_nav').querySelectorAll('a');

navAnchors.forEach(a => {
  listen(a, 'click', onTableNavigation);
});

function onTableNavigation(e: MouseEvent): void {
  const tableId = (e.currentTarget as HTMLAnchorElement).dataset.table;

  navAnchors.forEach(a => {
    a.className = a.dataset.table === tableId ? 'selected' : '';
  });

  if (tableId === 'all') {
    allTables.forEach(table => table.style.display = 'table');

  } else {
    for (const table of allTables) {
      table.style.display = table.id === tableId ? 'table' : 'none';
    }
  }

  scroll(0, 0);
}


// Export

const exportFormOverlay = get<HTMLDivElement>('table_export_form_overlay');
const exportForm = get<HTMLFormElement>('table_export_form');

listen('export_icon', 'click', opneExportForm);
listen(exportForm, 'submit', onExportFromSubmit);
listen(exportForm, 'reset', closeExportForm);

async function onExportFromSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();

  const sheetHTMLs = extractTablesHTML();

  if (!sheetHTMLs.length)
    return showMessage('Mindestens eine Tabelle auswählen', 'red');

  const results = await window.electron.handle<boolean>('table:export', sheetHTMLs);

  if (!results)
    return;

  closeExportForm();
  showMessage('Tabelle(n) erfolgreich exportiert', 'green', 4000);
}

function extractTablesHTML(): SheetHTML[] {
  const tablesIds = getFormValues<any>(exportForm);

  return Object.keys(tablesIds).map(id => ({
    name: id.split('_')[0],
    html: get<HTMLTableElement>(id).outerHTML
  }));
}

function opneExportForm(): void {
  exportFormOverlay.style.display = 'flex';
}

function closeExportForm(): void {
  exportFormOverlay.style.display = 'none';
}