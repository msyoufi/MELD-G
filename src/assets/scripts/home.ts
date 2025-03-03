import { get, getFormValues, listen } from "./utils.js";

const managementForm = get<HTMLFormElement>('management_form');
listen(managementForm, 'submit', onManagementFormSubmit);

function onManagementFormSubmit(e: SubmitEvent): void {
  e.preventDefault();

  const values = getFormValues(managementForm);
  console.log(values);
}