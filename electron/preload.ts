import { contextBridge, ipcRenderer } from 'electron'
import type { FinanceExportReportPdfRequest, FinanceExportReportPdfResponse } from './types/finance-ipc.types'

contextBridge.exposeInMainWorld('api', {
  exportReportPdf: async (
    payload: FinanceExportReportPdfRequest
  ): Promise<{ canceled: boolean; filePath?: string }> => {
    const response = (await ipcRenderer.invoke('finance:exportReportPdf', payload)) as FinanceExportReportPdfResponse

    if (response.ok === false) {
      throw new Error(response.error.message)
    }

    return {
      canceled: response.canceled,
      filePath: response.filePath
    }
  },
  windowControls: {
    minimize: async (): Promise<void> => {
      await ipcRenderer.invoke('window:minimize')
    },
    maximizeToggle: async (): Promise<boolean> => {
      return (await ipcRenderer.invoke('window:maximizeToggle')) as boolean
    },
    close: async (): Promise<void> => {
      await ipcRenderer.invoke('window:close')
    },
    isMaximized: async (): Promise<boolean> => {
      return (await ipcRenderer.invoke('window:isMaximized')) as boolean
    },
    onMaximizedStateChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean): void => callback(isMaximized)
      ipcRenderer.on('window:maximized-state', listener)
      return () => ipcRenderer.removeListener('window:maximized-state', listener)
    }
  }
})
