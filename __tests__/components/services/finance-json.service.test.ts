/** @jest-environment node */

import { access, mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  deleteTransactionFromDb,
  getAllTransactionsFromDb,
  getFinanceDbPath,
  getFinanceDirectoryPath,
  getFinanceReportsDirectoryPath,
  saveTransactionToDb,
  updateTransactionInDb
} from '../../../electron/services/finance-json.service'
import type { Transaction } from '../../../electron/types/transaction.types'

describe('finance-json.service', () => {
  it('deve usar Desktop/chatfinacial como pasta base', () => {
    const dirPath = getFinanceDirectoryPath('C:\\Users\\Nata\\Desktop')
    expect(dirPath).toBe(path.join('C:\\Users\\Nata\\Desktop', 'chatfinacial'))
  })

  it('deve usar Desktop/chatfinacial/finance.db', () => {
    const dbPath = getFinanceDbPath('C:\\Users\\Nata\\Desktop')
    expect(dbPath).toBe(path.join('C:\\Users\\Nata\\Desktop', 'chatfinacial', 'finance.db'))
  })

  it('deve usar Desktop/chatfinacial/reports para PDFs', () => {
    const reportsPath = getFinanceReportsDirectoryPath('C:\\Users\\Nata\\Desktop')
    expect(reportsPath).toBe(path.join('C:\\Users\\Nata\\Desktop', 'chatfinacial', 'reports'))
  })

  it('deve salvar e listar transacoes no finance.db', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-'))
    const dbPath = getFinanceDbPath(baseDir)

    const transaction: Transaction = {
      id: 'abc-123',
      type: 'entrada',
      amount: 500,
      category: 'Salario',
      description: 'Recebimento',
      date: '2026-02-20',
      isMonthlyCost: false
    }

    await saveTransactionToDb(dbPath, transaction)
    const all = await getAllTransactionsFromDb(dbPath)

    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(transaction)

    await expect(access(dbPath)).resolves.toBeUndefined()
  })

  it('deve retornar lista vazia quando banco nao existir', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-empty-'))
    const dbPath = getFinanceDbPath(baseDir)

    const all = await getAllTransactionsFromDb(dbPath)

    expect(all).toEqual([])
  })

  it('deve falhar ao salvar transacao com amount invalido', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-invalid-'))
    const dbPath = getFinanceDbPath(baseDir)

    const invalid = {
      id: 'x',
      type: 'entrada',
      amount: Number.NaN,
      category: 'Teste',
      description: 'Teste',
      date: '2026-02-20'
    } as unknown as Transaction

    await expect(saveTransactionToDb(dbPath, invalid)).rejects.toThrow('Valor da transacao invalido.')
  })

  it('deve apagar transacao por id', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-delete-'))
    const dbPath = getFinanceDbPath(baseDir)

    const t1: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      category: 'Salario',
      description: 'A',
      date: '2026-02-20',
      isMonthlyCost: false
    }

    const t2: Transaction = {
      id: '2',
      type: 'saida',
      amount: 20,
      category: 'Mercado',
      description: 'B',
      date: '2026-02-21',
      isMonthlyCost: true
    }

    await saveTransactionToDb(dbPath, t1)
    await saveTransactionToDb(dbPath, t2)

    await deleteTransactionFromDb(dbPath, '1')

    const all = await getAllTransactionsFromDb(dbPath)
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('2')
  })

  it('deve atualizar transacao por id', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-update-'))
    const dbPath = getFinanceDbPath(baseDir)

    const original: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      category: 'Salario',
      description: 'Original',
      date: '2026-02-20',
      isMonthlyCost: false
    }

    await saveTransactionToDb(dbPath, original)

    await updateTransactionInDb(dbPath, {
      ...original,
      amount: 150,
      category: 'Bonus',
      description: 'Atualizada'
    })

    const all = await getAllTransactionsFromDb(dbPath)
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(
      expect.objectContaining({
        id: '1',
        amount: 150,
        category: 'Bonus',
        description: 'Atualizada'
      })
    )
  })

  it('deve migrar dados legados do finance.json para o banco', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-migrate-'))
    const financeDir = getFinanceDirectoryPath(baseDir)
    const legacyPath = path.join(financeDir, 'finance.json')
    const dbPath = getFinanceDbPath(baseDir)

    const legacyTransaction: Transaction = {
      id: 'legacy-1',
      type: 'saida',
      amount: 55.4,
      category: 'Internet',
      description: 'Plano',
      date: '2026-02-10',
      isMonthlyCost: true
    }

    await mkdir(financeDir, { recursive: true })
    await writeFile(legacyPath, JSON.stringify({ transactions: [legacyTransaction] }), 'utf-8')

    const all = await getAllTransactionsFromDb(dbPath)

    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(legacyTransaction)
  })
})
