import type { ExportReportPdfPayload, ExportReportPdfResult } from '../types/report-export.types'
import type { PaymentMethod, Transaction, TransactionType } from '../types/transaction.types'
import { supabase } from '../lib/supabase'

interface FinanceService {
  saveTransaction: (transaction: Transaction) => Promise<void>
  saveTransactions: (transactions: Transaction[]) => Promise<void>
  getTransactions: () => Promise<Transaction[]>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  getCategoryItems: (type?: TransactionType) => Promise<CategoryItem[]>
  getCategories: (type?: TransactionType) => Promise<string[]>
  saveCategory: (name: string, type: TransactionType) => Promise<void>
  updateCategory: (id: string, name: string, type: TransactionType) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
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
  payment_method: PaymentMethod | null
  installment_group_id: string | null
  installment_number: number | null
  installment_count: number | null
  total_amount: number | null
  is_installment: boolean | null
}

interface CategoryRow {
  id: string
  name: string
  type: TransactionType
}

export interface CategoryItem {
  id: string
  name: string
  type: TransactionType
}

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type,
  category: row.category,
  amount: Number(row.amount),
  description: row.description,
  date: row.date,
  isMonthlyCost: Boolean(row.is_monthly_cost),
  paymentMethod: row.payment_method ?? 'pix',
  installmentGroupId: row.installment_group_id,
  installmentNumber: row.installment_number ?? 1,
  installmentCount: row.installment_count ?? 1,
  totalAmount: Number(row.total_amount ?? row.amount),
  isInstallment: Boolean(row.is_installment ?? (row.installment_count ?? 1) > 1)
})

const normalizeDateValue = (value: string): string => {
  const normalized = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  return normalized ?? value
}

const normalizeCategoryName = (value: string): string => value.trim().replace(/\s+/g, ' ')

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
      is_monthly_cost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false,
      payment_method: transaction.paymentMethod,
      installment_group_id: transaction.installmentGroupId,
      installment_number: transaction.installmentNumber,
      installment_count: transaction.installmentCount,
      total_amount: transaction.totalAmount,
      is_installment: transaction.isInstallment
    })

    if (error) {
      throw error
    }
  },
  saveTransactions: async (transactions: Transaction[]): Promise<void> => {
    if (transactions.length === 0) return
    const userId = await getAuthenticatedUserId()

    const rows = transactions.map((transaction) => ({
      id: transaction.id,
      user_id: userId,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: normalizeDateValue(transaction.date),
      is_monthly_cost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false,
      payment_method: transaction.paymentMethod,
      installment_group_id: transaction.installmentGroupId,
      installment_number: transaction.installmentNumber,
      installment_count: transaction.installmentCount,
      total_amount: transaction.totalAmount,
      is_installment: transaction.isInstallment
    }))

    const { error } = await supabase.from('transactions').insert(rows)
    if (error) throw error
  },
  getTransactions: async (): Promise<Transaction[]> => {
    await getAuthenticatedUserId()

    const { data, error } = await supabase
      .from('transactions')
      .select(
        'id, user_id, type, category, amount, description, date, is_monthly_cost, payment_method, installment_group_id, installment_number, installment_count, total_amount, is_installment'
      )
      .order('date', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((item) => toTransaction(item as TransactionRow))
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await getAuthenticatedUserId()

    const { data, error: fetchError } = await supabase.from('transactions').select('installment_group_id').eq('id', id).maybeSingle()
    if (fetchError) {
      throw fetchError
    }

    const groupId = data?.installment_group_id ?? null
    const query = groupId ? supabase.from('transactions').delete().eq('installment_group_id', groupId) : supabase.from('transactions').delete().eq('id', id)
    const { error } = await query
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
        is_monthly_cost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false,
        payment_method: transaction.paymentMethod,
        installment_group_id: transaction.installmentGroupId,
        installment_number: transaction.installmentNumber,
        installment_count: transaction.installmentCount,
        total_amount: transaction.totalAmount,
        is_installment: transaction.isInstallment
      })
      .eq('id', transaction.id)

    if (error) {
      throw error
    }
  },
  getCategoryItems: async (type?: TransactionType): Promise<CategoryItem[]> => {
    await getAuthenticatedUserId()

    let query = supabase.from('transaction_categories').select('id, name, type').order('name', { ascending: true })
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) {
      if (error.code === '42P01') {
        return []
      }

      throw error
    }

    const rows = (data ?? []) as CategoryRow[]
    return rows
      .map((item) => ({
        id: item.id,
        name: normalizeCategoryName(item.name),
        type: item.type
      }))
      .filter((item) => Boolean(item.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  },
  getCategories: async (type?: TransactionType): Promise<string[]> => {
    const items = await financeService.getCategoryItems(type)
    return items.map((item) => item.name)
  },
  saveCategory: async (name: string, type: TransactionType): Promise<void> => {
    const normalizedName = normalizeCategoryName(name)
    if (!normalizedName) {
      throw new Error('Informe uma categoria valida.')
    }

    await getAuthenticatedUserId()

    const { error: rpcError } = await supabase.rpc('ensure_transaction_category', {
      p_name: normalizedName,
      p_type: type
    })

    if (!rpcError) {
      return
    }

    if (rpcError.code !== 'PGRST202' && rpcError.code !== '42883') {
      throw rpcError
    }

    const { error } = await supabase.from('transaction_categories').upsert(
      {
        name: normalizedName,
        type
      },
      {
        onConflict: 'user_id,type,name_normalized',
        ignoreDuplicates: true
      }
    )

    if (error && error.code !== '42P01') {
      throw error
    }
  },
  updateCategory: async (id: string, name: string, type: TransactionType): Promise<void> => {
    const normalizedName = normalizeCategoryName(name)
    if (!normalizedName) {
      throw new Error('Informe uma categoria valida.')
    }

    await getAuthenticatedUserId()

    const { error } = await supabase
      .from('transaction_categories')
      .update({
        name: normalizedName,
        type
      })
      .eq('id', id)

    if (error) {
      throw error
    }
  },
  deleteCategory: async (id: string): Promise<void> => {
    await getAuthenticatedUserId()

    const { error } = await supabase.from('transaction_categories').delete().eq('id', id)
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
