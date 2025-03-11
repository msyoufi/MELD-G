const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  handle: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  receive: (channel, listener) => ipcRenderer.on(channel, listener)
} satisfies Window['electron']);