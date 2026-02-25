import type { ExportReportPdfPayload, ExportReportPdfResult } from '../types/report-export.types'
import type { Transaction } from '../types/transaction.types'
import { supabase } from '../lib/supabase'

interface FinanceService {
  saveTransaction: (transaction: Transaction) => Promise<void>
  getTransactions: () => Promise<Transaction[]>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  exportReportPdf: (payload: ExportReportPdfPayload) => Promise<ExportReportPdfResult>
}

interface TransactionRow {
  id: string
  user_id: string
  type: Transaction['type']
  category: string
  amount: number
  description: string
  date: string
  is_monthly_cost: boolean
}

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type,
  category: row.category,
  amount: Number(row.amount),
  description: row.description,
  date: row.date,
  isMonthlyCost: Boolean(row.is_monthly_cost)
})

const normalizeDateValue = (value: string): string => {
  const normalized = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  return normalized ?? value
}

const getAuthenticatedUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    throw error
  }

  const userId = data.user?.id
  if (!userId) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  return userId
}

export const financeService: FinanceService = {
  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const userId = await getAuthenticatedUserId()

    const { error } = await supabase.from('transactions').insert({
      id: transaction.id,
      user_id: userId,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: normalizeDateValue(transaction.date),
      is_monthly_cost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false
    })

    if (error) {
      throw error
    }
  },
  getTransactions: async (): Promise<Transaction[]> => {
    await getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, type, category, amount, description, date, is_monthly_cost')
      .order('date', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((item) => toTransaction(item as TransactionRow))
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await getAuthenticatedUserId()

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      throw error
    }
  },
  updateTransaction: async (transaction: Transaction): Promise<void> => {
    await getAuthenticatedUserId()

    const { error } = await supabase
      .from('transactions')
      .update({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        date: normalizeDateValue(transaction.date),
        is_monthly_cost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false
      })
      .eq('id', transaction.id)

    if (error) {
      throw error
    }
  },
  exportReportPdf: async (payload: ExportReportPdfPayload): Promise<ExportReportPdfResult> => {
    if (window.api?.exportReportPdf) {
      return window.api.exportReportPdf(payload)
    }

    throw new Error('Exportacao em PDF disponivel apenas no app desktop.')
  }
}
