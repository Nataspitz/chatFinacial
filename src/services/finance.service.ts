import type { ExportReportPdfPayload, ExportReportPdfResult } from '../types/report-export.types'
import type { Transaction } from '../types/transaction.types'

interface FinanceService {
  saveTransaction: (transaction: Transaction) => Promise<void>
  getTransactions: () => Promise<Transaction[]>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  exportReportPdf: (payload: ExportReportPdfPayload) => Promise<ExportReportPdfResult>
}

const WEB_STORAGE_KEY = 'chatfinacial:transactions'

const readWebTransactions = (): Transaction[] => {
  const raw = window.localStorage.getItem(WEB_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is Transaction => {
      const candidate = item as Partial<Transaction>
      return (
        typeof candidate.id === 'string' &&
        (candidate.type === 'entrada' || candidate.type === 'saida') &&
        typeof candidate.category === 'string' &&
        typeof candidate.amount === 'number' &&
        Number.isFinite(candidate.amount) &&
        typeof candidate.description === 'string' &&
        typeof candidate.date === 'string' &&
        typeof candidate.isMonthlyCost === 'boolean'
      )
    })
  } catch {
    return []
  }
}

const writeWebTransactions = (transactions: Transaction[]): void => {
  window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(transactions))
}

export const financeService: FinanceService = {
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    if (window.api?.saveTransaction) {
      await window.api.saveTransaction(transaction)
      return
    }

    const transactions = readWebTransactions()
    transactions.push(transaction)
    writeWebTransactions(transactions)
  },
  getTransactions: async (): Promise<Transaction[]> => {
    if (window.api?.getTransactions) {
      return window.api.getTransactions()
    }

    return readWebTransactions()
  },
  deleteTransaction: async (id: string): Promise<void> => {
    if (window.api?.deleteTransaction) {
      await window.api.deleteTransaction(id)
      return
    }

    const transactions = readWebTransactions().filter((transaction) => transaction.id !== id)
    writeWebTransactions(transactions)
  },
  updateTransaction: async (transaction: Transaction): Promise<void> => {
    if (window.api?.updateTransaction) {
      await window.api.updateTransaction(transaction)
      return
    }

    const transactions = readWebTransactions()
    const index = transactions.findIndex((item) => item.id === transaction.id)

    if (index === -1) {
      throw new Error('Transacao nao encontrada para edicao.')
    }

    transactions[index] = transaction
    writeWebTransactions(transactions)
  },
  exportReportPdf: async (payload: ExportReportPdfPayload): Promise<ExportReportPdfResult> => {
    if (window.api?.exportReportPdf) {
      return window.api.exportReportPdf(payload)
    }

    throw new Error('Exportacao em PDF disponivel apenas no app desktop.')
  }
}
