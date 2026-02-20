import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Transaction } from '../types/transaction.types'

interface FinanceFileData {
  transactions: Transaction[]
}

const isTransactionType = (value: unknown): value is 'entrada' | 'saida' => {
  return value === 'entrada' || value === 'saida'
}

const sanitizeTransaction = (transaction: Transaction): Transaction => {
  const safeId = typeof transaction.id === 'string' && transaction.id.trim() ? transaction.id : randomUUID()

  if (!isTransactionType(transaction.type)) {
    throw new Error('Tipo de transacao invalido.')
  }

  if (typeof transaction.amount !== 'number' || !Number.isFinite(transaction.amount)) {
    throw new Error('Valor da transacao invalido.')
  }

  const safeMonthlyCost = transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false

  return {
    ...transaction,
    id: safeId,
    isMonthlyCost: safeMonthlyCost
  }
}

const readFileData = async (filePath: string): Promise<FinanceFileData> => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(fileContent) as Partial<FinanceFileData>

    if (!Array.isArray(parsed.transactions)) {
      return { transactions: [] }
    }

    return { transactions: parsed.transactions }
  } catch {
    return { transactions: [] }
  }
}

const writeFileData = async (filePath: string, data: FinanceFileData): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

interface FinancePathOptions {
  isPackaged?: boolean
  projectRoot?: string
}

export const getFinanceFilePath = (userDataPath: string, options?: FinancePathOptions): string => {
  if (options?.isPackaged === false) {
    const projectRoot = options.projectRoot ?? process.cwd()
    return path.join(projectRoot, 'dev-data', 'finance.json')
  }

  return path.join(userDataPath, 'finance.json')
}

export const saveTransactionToJson = async (filePath: string, transaction: Transaction): Promise<void> => {
  const data = await readFileData(filePath)
  const safeTransaction = sanitizeTransaction(transaction)

  data.transactions.push(safeTransaction)
  await writeFileData(filePath, data)
}

export const getAllTransactionsFromJson = async (filePath: string): Promise<Transaction[]> => {
  const data = await readFileData(filePath)
  return data.transactions.map((item) => ({
    ...item,
    isMonthlyCost: item.type === 'saida' ? Boolean(item.isMonthlyCost) : false
  }))
}

export const deleteTransactionFromJson = async (filePath: string, id: string): Promise<void> => {
  const data = await readFileData(filePath)
  data.transactions = data.transactions.filter((item) => item.id !== id)
  await writeFileData(filePath, data)
}

export const updateTransactionInJson = async (filePath: string, transaction: Transaction): Promise<void> => {
  const data = await readFileData(filePath)
  const safeTransaction = sanitizeTransaction(transaction)
  const index = data.transactions.findIndex((item) => item.id === safeTransaction.id)

  if (index === -1) {
    throw new Error('Transacao nao encontrada para edicao.')
  }

  data.transactions[index] = safeTransaction
  await writeFileData(filePath, data)
}
