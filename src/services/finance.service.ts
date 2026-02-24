import type { ExportReportPdfPayload, ExportReportPdfResult } from '../types/report-export.types'
import type { Transaction } from '../types/transaction.types'

interface FinanceService {
  saveTransaction: (transaction: Transaction) => Promise<void>
  getTransactions: () => Promise<Transaction[]>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  exportReportPdf: (payload: ExportReportPdfPayload) => Promise<ExportReportPdfResult>
}

export const financeService: FinanceService = {
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    if (!window.api?.saveTransaction) {
      throw new Error('Canal IPC de persistencia indisponivel.')
    }

    await window.api.saveTransaction(transaction)
  },
  getTransactions: async (): Promise<Transaction[]> => {
    if (!window.api?.getTransactions) {
      throw new Error('Canal IPC de leitura indisponivel.')
    }

    return window.api.getTransactions()
  },
  deleteTransaction: async (id: string): Promise<void> => {
    if (!window.api?.deleteTransaction) {
      throw new Error('Canal IPC de exclusao indisponivel.')
    }

    await window.api.deleteTransaction(id)
  },
  updateTransaction: async (transaction: Transaction): Promise<void> => {
    if (!window.api?.updateTransaction) {
      throw new Error('Canal IPC de edicao indisponivel.')
    }

    await window.api.updateTransaction(transaction)
  },
  exportReportPdf: async (payload: ExportReportPdfPayload): Promise<ExportReportPdfResult> => {
    if (!window.api?.exportReportPdf) {
      throw new Error('Canal IPC de exportacao indisponivel.')
    }

    return window.api.exportReportPdf(payload)
  }
}
