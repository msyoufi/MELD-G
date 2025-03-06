export function get<T>(id: string): T {
  return document.getElementById(id) as T;
}

export function create(tag: string, classes?: string[], html?: string): HTMLElement {
  const el = document.createElement(tag);
  if (classes?.length) el.classList.add(...classes);
  if (html) el.innerHTML = html;
  return el;
}


export function listen(element: Element | HTMLElement | string, event: string, callback: (e: any) => void): void {
  if (typeof element === 'string')
    element = get<HTMLElement>(element);

  element?.addEventListener(event, callback);
}

export function getFormValues<T>(form: HTMLFormElement | string): T {
  if (typeof form === 'string')
    form = get<HTMLFormElement>(form);

  const formData = new FormData(form).entries();
  const data: any = {};

  for (const [key, val] of formData)
    data[key] = data[key]
      ? data[key].concat(`, ${val}`)
      : val;

  return data;
}

export function formatDate(date: string): string {
  const D = date.split('-');
  return `${D[2]}.${D[1]}.${D[0]}`;
}