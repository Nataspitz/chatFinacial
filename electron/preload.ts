import { contextBridge, ipcRenderer } from 'electron'
import type {
  FinanceDeleteRequest,
  FinanceDeleteResponse,
  FinanceExportReportPdfRequest,
  FinanceExportReportPdfResponse,
  FinanceGetAllResponse,
  FinanceSaveRequest,
  FinanceSaveResponse,
  FinanceUpdateRequest,
  FinanceUpdateResponse
} from './types/finance-ipc.types'
import type { Transaction } from './types/transaction.types'

contextBridge.exposeInMainWorld('api', {
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const payload: FinanceSaveRequest = { transaction }
    const response = (await ipcRenderer.invoke('finance:save', payload)) as FinanceSaveResponse

    if (response.ok === false) {
      throw new Error(response.error.message)
    }
  },
  getTransactions: async (): Promise<Transaction[]> => {
    const response = (await ipcRenderer.invoke('finance:getAll')) as FinanceGetAllResponse

    if (response.ok === false) {
      throw new Error(response.error.message)
    }

    return response.data
  },
  deleteTransaction: async (id: string): Promise<void> => {
    const payload: FinanceDeleteRequest = { id }
    const response = (await ipcRenderer.invoke('finance:delete', payload)) as FinanceDeleteResponse

    if (response.ok === false) {
      throw new Error(response.error.message)
    }
  },
  updateTransaction: async (transaction: Transaction): Promise<void> => {
    const payload: FinanceUpdateRequest = { transaction }
    const response = (await ipcRenderer.invoke('finance:update', payload)) as FinanceUpdateResponse

    if (response.ok === false) {
      throw new Error(response.error.message)
    }
  },
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
