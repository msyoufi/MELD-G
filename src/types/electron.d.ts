interface Window {
  electron: {
    handle: <T>(channel: MeldChannel, ...args: any) => Promise<T>,
    receive: (channel: MeldChannel, listener: (...args: any) => void) => void
  }
};

interface AppWindows {
  main: BrowserWindow | null,
  form: BrowserWindow | null
};

const channels = {
  'window:close': '',
  'form-window:show': '',

  'case:create': '',
  'case:get': '',
  'case:delete': '',

  'patient:list': '',
  'patient-list:sync': '',
  'patient:update': '',

  'meld:update': '',

  'MRI:create': '',
  'MRI:delete': '',

  'annotation:create': '',
  'annotation:update': '',
  'annotation:delete': '',

  'form:get': '',

  'entity:list': '',
} as const;

type MeldChannel = keyof typeof channels;