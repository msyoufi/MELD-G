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

export let isAwaitingAnswer = false;

export function promptUser(msg: string, action: string): Promise<'confirm' | 'cancel'> {
  const overlay = create('div', ['overlay']);
  const container = create('div', ['dialog-container']);
  const message = create('p', [], msg);
  const confirmBtn = create('button', ['meld-button', 'red'], action);
  const cancelBtn = create('button', ['meld-button'], 'Abbrechen');

  overlay.style.display = 'flex';

  container.append(message, confirmBtn, cancelBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  isAwaitingAnswer = true;

  return new Promise(resolve => {
    function resolveAnswer(answer: 'confirm' | 'cancel') {
      resolve(answer);
      document.body.removeChild(overlay);
      isAwaitingAnswer = false;
    }

    listen(confirmBtn, 'click', () => resolveAnswer('confirm'));
    listen(cancelBtn, 'click', () => resolveAnswer('cancel'));
  });
}