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
  'patient:list': '',
  'pathos:list': '',

  'case-data:get': '',
  'case-MRIs:get': '',

  'MRI:create': '',
  'MRI:delete': '',

  'annotation:create': '',
  'annotation:update': '',
  'annotation:delete': '',

  'form:open': '',
  'form:get': '',
  'form:reset': '',
} as const;

type MeldChannel = keyof typeof channels;