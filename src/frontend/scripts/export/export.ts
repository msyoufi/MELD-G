import { get, getFormValues, listen, populateEntitySelect } from "../shared/utils.js";

window.electron.receive('entity:all', onEntityGroupsRecieve);

function onEntityGroupsRecieve(e: any, entityGroups: EntityGroup[]): void {
  populateEntitySelect('entity_filter_select', entityGroups);
}

const exportFrom = get<HTMLFormElement>('export_form');
const submitBtn = get<HTMLButtonElement>('export_submit');

listen(exportFrom, 'submit', onSubmit);
listen(exportFrom, 'input', toggleSubmit);
listen(exportFrom, 'reset', closeModal);

async function onSubmit(e: SubmitEvent): Promise<void> {
  try {
    e.preventDefault();

    const configsValues = getFormValues<ExportConfigsForm>(exportFrom);
    const { anonymous, ...configs } = configsValues;

    if (!anonymous)
      configs.dataScope += ', patients';

    const isExported = await window.electron.handle<boolean>('data:export', configs);

    if (!isExported)
      return console.log('Fehler beim Exportierten!');

    closeModal();

  } catch (err: unknown) {
    console.log(err);
  }
}

function toggleSubmit(): void {
  submitBtn.disabled = exportFrom.checkValidity() ? false : true;
}

function closeModal(): void {
  window.electron.handle<MRI>('window:close');
}