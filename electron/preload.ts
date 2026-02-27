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
  }
})
