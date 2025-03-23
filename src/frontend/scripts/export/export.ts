import { get, getFormValues, listen, handleKeyup, populateEntitySelect } from "../shared/utils.js";

window.electron.receive('entity:all', onEntityGroupsRecieve);

function onEntityGroupsRecieve(e: any, entityGroups: EntityGroup[]): void {
  populateEntitySelect('entity_filter_select', entityGroups);
}

const exportFrom = get<HTMLFormElement>('export_form');
const submitBtn = get<HTMLButtonElement>('export_submit');

exportFrom.querySelector<HTMLSelectElement>('select[name="dataScope"]')?.focus();

listen(exportFrom, 'submit', onSubmit);
listen(exportFrom, 'input', toggleSubmit);
listen(exportFrom, 'reset', closeModal);

handleKeyup({ Escape: closeModal });

async function onSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();

  const configsValues = getFormValues<ExportConfigsForm>(exportFrom);
  const { anonymous, ...configs } = configsValues;

  if (!anonymous)
    configs.dataScope += ', patients';

  const result = await window.electron.handle<boolean>('data:export', configs);

  if (!result)
    return;

  closeModal();
}

function toggleSubmit(): void {
  submitBtn.disabled = exportFrom.checkValidity() ? false : true;
}

function closeModal(): void {
  window.electron.handle<MRI>('window:close');
}