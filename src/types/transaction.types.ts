export type TransactionType = 'entrada' | 'saida'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string
  date: string
  isMonthlyCost: boolean
}
