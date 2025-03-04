interface Window {
  electron: {
    handle: <T>(channel: MeldChannel, ...args: any) => Promise<T>,
    receive: (channel: MeldChannel, listener: (...args: any) => void) => void
  }
};

const channels = {
  'case:list': '',
  'case:create': '',
  'case:update': '',
  'case:get': '',
  'case:delete': '',

  'form:open': '',
} as const;

type MeldChannel = keyof typeof channels;