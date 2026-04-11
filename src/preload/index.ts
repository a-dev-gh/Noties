import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Storage
  loadData: (): Promise<unknown> => ipcRenderer.invoke('storage:load'),
  saveData: (data: unknown): Promise<void> => ipcRenderer.invoke('storage:save', data),

  // AI operations (API key stays in main process)
  fixWithAI: (content: string): Promise<string> => ipcRenderer.invoke('ai:fix', content),
  searchWithAI: (content: string): Promise<string> => ipcRenderer.invoke('ai:search', content),

  // Settings — API key management
  saveApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:save-api-key', key),
  loadApiKey: (): Promise<string | null> => ipcRenderer.invoke('settings:load-api-key'),
  deleteApiKey: (): Promise<void> => ipcRenderer.invoke('settings:delete-api-key'),

  // Window controls
  minimize: (): void => { ipcRenderer.send('window:minimize') },
  maximize: (): void => { ipcRenderer.send('window:maximize') },
  close: (): void => { ipcRenderer.send('window:close') }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', api)
} else {
  // @ts-expect-error fallback for non-isolated context
  window.electronAPI = api
}

export type ElectronAPI = typeof api
