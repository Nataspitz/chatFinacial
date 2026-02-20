/** @jest-environment node */

import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  deleteTransactionFromJson,
  getAllTransactionsFromJson,
  getFinanceFilePath,
  saveTransactionToJson,
  updateTransactionInJson
} from './finance-json.service'
import type { Transaction } from '../types/transaction.types'

describe('finance-json.service', () => {
  it('deve usar dev-data/finance.json em desenvolvimento', () => {
    const filePath = getFinanceFilePath('C:\\UserData', {
      isPackaged: false,
      projectRoot: 'C:\\Projeto'
    })

    expect(filePath).toContain(path.join('C:\\Projeto', 'dev-data', 'finance.json'))
  })

  it('deve usar userData/finance.json em producao', () => {
    const filePath = getFinanceFilePath('C:\\UserData', {
      isPackaged: true,
      projectRoot: 'C:\\Projeto'
    })

    expect(filePath).toBe(path.join('C:\\UserData', 'finance.json'))
  })

  it('deve salvar e listar transacoes no finance.json', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-'))
    const filePath = getFinanceFilePath(baseDir)

    const transaction: Transaction = {
      id: 'abc-123',
      type: 'entrada',
      amount: 500,
      category: 'Salario',
      description: 'Recebimento',
      date: '2026-02-20',
      isMonthlyCost: false
    }

    await saveTransactionToJson(filePath, transaction)
    const all = await getAllTransactionsFromJson(filePath)

    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(transaction)

    const raw = await readFile(filePath, 'utf-8')
    expect(raw).toContain('"transactions"')
  })

  it('deve retornar lista vazia quando arquivo nao existir', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-empty-'))
    const filePath = getFinanceFilePath(baseDir)

    const all = await getAllTransactionsFromJson(filePath)

    expect(all).toEqual([])
  })

  it('deve falhar ao salvar transacao com amount invalido', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-invalid-'))
    const filePath = getFinanceFilePath(baseDir)

    const invalid = {
      id: 'x',
      type: 'entrada',
      amount: Number.NaN,
      category: 'Teste',
      description: 'Teste',
      date: '2026-02-20'
    } as unknown as Transaction

    await expect(saveTransactionToJson(filePath, invalid)).rejects.toThrow('Valor da transacao invalido.')
  })

  it('deve apagar transacao por id', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-delete-'))
    const filePath = getFinanceFilePath(baseDir)

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

    await saveTransactionToJson(filePath, t1)
    await saveTransactionToJson(filePath, t2)

    await deleteTransactionFromJson(filePath, '1')

    const all = await getAllTransactionsFromJson(filePath)
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('2')
  })

  it('deve atualizar transacao por id', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'finance-test-update-'))
    const filePath = getFinanceFilePath(baseDir)

    const original: Transaction = {
      id: '1',
      type: 'entrada',
      amount: 100,
      category: 'Salario',
      description: 'Original',
      date: '2026-02-20',
      isMonthlyCost: false
    }

    await saveTransactionToJson(filePath, original)

    await updateTransactionInJson(filePath, {
      ...original,
      amount: 150,
      category: 'Bonus',
      description: 'Atualizada'
    })

    const all = await getAllTransactionsFromJson(filePath)
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
})
