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

  'case:create': '',
  'case:update': '',
  'case:get': '',
  'case:delete': '',

  'form:open': '',
  'form:get': '',
  'form:reset': '',
} as const;

type MeldChannel = keyof typeof channels;