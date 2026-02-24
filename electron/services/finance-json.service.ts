import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Transaction } from '../types/transaction.types'

interface FinanceFileData {
  transactions: Transaction[]
}

const FINANCE_DIR_NAME = 'chatfinacial'
const FINANCE_DB_FILE_NAME = 'finance.db'
const FINANCE_LEGACY_FILE_NAME = 'finance.json'

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

const readLegacyFileData = async (filePath: string): Promise<FinanceFileData> => {
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

export const getFinanceDirectoryPath = (desktopPath: string): string => {
  return path.join(desktopPath, FINANCE_DIR_NAME)
}

export const getFinanceDbPath = (desktopPath: string): string => {
  return path.join(getFinanceDirectoryPath(desktopPath), FINANCE_DB_FILE_NAME)
}

export const getFinanceReportsDirectoryPath = (desktopPath: string): string => {
  return path.join(getFinanceDirectoryPath(desktopPath), 'reports')
}

const getLegacyJsonPathFromDbPath = (dbPath: string): string => {
  return path.join(path.dirname(dbPath), FINANCE_LEGACY_FILE_NAME)
}

const ensureDatabase = async (dbPath: string): Promise<DatabaseSync> => {
  await fs.mkdir(path.dirname(dbPath), { recursive: true })

  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('entrada', 'saida')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      is_monthly_cost INTEGER NOT NULL DEFAULT 0
    );
  `)

  return db
}

const migrateLegacyJsonIfNeeded = async (db: DatabaseSync, dbPath: string): Promise<void> => {
  const countResult = db.prepare('SELECT COUNT(*) as total FROM transactions').get() as { total: number }
  if (countResult.total > 0) {
    return
  }

  const legacyFilePath = getLegacyJsonPathFromDbPath(dbPath)
  const legacyData = await readLegacyFileData(legacyFilePath)
  if (legacyData.transactions.length === 0) {
    return
  }

  const insertStatement = db.prepare(`
    INSERT OR REPLACE INTO transactions (
      id,
      type,
      category,
      amount,
      description,
      date,
      is_monthly_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const safeTransactions = legacyData.transactions.map((transaction) => sanitizeTransaction(transaction))
  db.exec('BEGIN TRANSACTION;')
  try {
    for (const transaction of safeTransactions) {
      insertStatement.run(
        transaction.id,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.description,
        transaction.date,
        transaction.type === 'saida' && transaction.isMonthlyCost ? 1 : 0
      )
    }
    db.exec('COMMIT;')
  } catch (error) {
    db.exec('ROLLBACK;')
    throw error
  }
}

export const saveTransactionToDb = async (dbPath: string, transaction: Transaction): Promise<void> => {
  const db = await ensureDatabase(dbPath)
  try {
    await migrateLegacyJsonIfNeeded(db, dbPath)
    const safeTransaction = sanitizeTransaction(transaction)

    db.prepare(
      `
      INSERT OR REPLACE INTO transactions (
        id,
        type,
        category,
        amount,
        description,
        date,
        is_monthly_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      safeTransaction.id,
      safeTransaction.type,
      safeTransaction.category,
      safeTransaction.amount,
      safeTransaction.description,
      safeTransaction.date,
      safeTransaction.type === 'saida' && safeTransaction.isMonthlyCost ? 1 : 0
    )
  } finally {
    db.close()
  }
}

export const getAllTransactionsFromDb = async (dbPath: string): Promise<Transaction[]> => {
  const db = await ensureDatabase(dbPath)
  try {
    await migrateLegacyJsonIfNeeded(db, dbPath)

    const rows = db
      .prepare(
        `
        SELECT id, type, category, amount, description, date, is_monthly_cost
        FROM transactions
        ORDER BY rowid ASC
      `
      )
      .all() as Array<{
      id: string
      type: Transaction['type']
      category: string
      amount: number
      description: string
      date: string
      is_monthly_cost: number
    }>

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      amount: row.amount,
      description: row.description,
      date: row.date,
      isMonthlyCost: row.type === 'saida' ? Boolean(row.is_monthly_cost) : false
    }))
  } finally {
    db.close()
  }
}

export const deleteTransactionFromDb = async (dbPath: string, id: string): Promise<void> => {
  const db = await ensureDatabase(dbPath)
  try {
    await migrateLegacyJsonIfNeeded(db, dbPath)
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  } finally {
    db.close()
  }
}

export const updateTransactionInDb = async (dbPath: string, transaction: Transaction): Promise<void> => {
  const db = await ensureDatabase(dbPath)
  try {
    await migrateLegacyJsonIfNeeded(db, dbPath)
    const safeTransaction = sanitizeTransaction(transaction)

    const result = db
      .prepare(
        `
        UPDATE transactions
        SET type = ?, category = ?, amount = ?, description = ?, date = ?, is_monthly_cost = ?
        WHERE id = ?
      `
      )
      .run(
        safeTransaction.type,
        safeTransaction.category,
        safeTransaction.amount,
        safeTransaction.description,
        safeTransaction.date,
        safeTransaction.type === 'saida' && safeTransaction.isMonthlyCost ? 1 : 0,
        safeTransaction.id
      )

    if (result.changes === 0) {
      throw new Error('Transacao nao encontrada para edicao.')
    }
  } finally {
    db.close()
  }
}
