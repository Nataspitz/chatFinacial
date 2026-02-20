import { useEffect, useMemo, useState } from 'react'
import { financeService } from '../../services/finance.service'
import type { Transaction } from '../../types/transaction.types'
import styles from './Report.module.css'

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

const normalizeTransactionDate = (value: string): string | null => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

const MONTH_OPTIONS = [
  { value: 'all', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Marco' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

interface TransactionsTableProps {
  title: string
  transactions: Transaction[]
  onDelete: (id: string) => Promise<void>
  onEditStart: (transaction: Transaction) => void
  onEditCancel: () => void
  onEditChange: (field: 'date' | 'category' | 'description' | 'amount' | 'isMonthlyCost', value: string | boolean) => void
  onEditSave: () => Promise<void>
  deletingId: string | null
  editingId: string | null
  editingDraft: Transaction | null
  isSavingEdit: boolean
}

const TransactionsTable = ({
  title,
  transactions,
  onDelete,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSave,
  deletingId,
  editingId,
  editingDraft,
  isSavingEdit
}: TransactionsTableProps): JSX.Element => {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {transactions.length === 0 ? (
        <p className={styles.empty}>Nenhuma transacao encontrada.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Categoria</th>
              <th>Descricao</th>
              <th>Valor</th>
              <th>Custo mensal</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isEditing = editingId === transaction.id && editingDraft !== null

              return (
                <tr key={transaction.id}>
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className={styles.cellInput}
                        value={editingDraft.date}
                        onChange={(event) => onEditChange('date', event.target.value)}
                      />
                    ) : (
                      formatDate(transaction.date)
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.cellInput}
                        value={editingDraft.category}
                        onChange={(event) => onEditChange('category', event.target.value)}
                      />
                    ) : (
                      transaction.category
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.cellInput}
                        value={editingDraft.description}
                        onChange={(event) => onEditChange('description', event.target.value)}
                      />
                    ) : (
                      transaction.description
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.cellInput}
                        value={String(editingDraft.amount)}
                        onChange={(event) => onEditChange('amount', event.target.value)}
                      />
                    ) : (
                      formatCurrency(transaction.amount)
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      editingDraft.type === 'saida' ? (
                        <input
                          type="checkbox"
                          checked={editingDraft.isMonthlyCost}
                          onChange={(event) => onEditChange('isMonthlyCost', event.target.checked)}
                        />
                      ) : (
                        <span>-</span>
                      )
                    ) : transaction.type === 'saida' ? (
                      transaction.isMonthlyCost ? 'Sim' : 'Nao'
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={isSavingEdit}
                          onClick={() => {
                            void onEditSave()
                          }}
                        >
                          {isSavingEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={isSavingEdit}
                          onClick={onEditCancel}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={deletingId === transaction.id}
                          onClick={() => onEditStart(transaction)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          disabled={deletingId === transaction.id}
                          onClick={() => {
                            void onDelete(transaction.id)
                          }}
                        >
                          {deletingId === transaction.id ? 'Apagando...' : 'Apagar'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

export const Report = (): JSX.Element => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<Transaction | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const data = await financeService.getTransactions()
        setTransactions(data)
      } catch {
        setError('Nao foi possivel carregar as transacoes.')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const yearOptions = useMemo(() => {
    const years = transactions
      .map((item) => normalizeTransactionDate(item.date))
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 4))

    return ['all', ...Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a))]
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const normalizedDate = normalizeTransactionDate(item.date)
      if (!normalizedDate) {
        return false
      }

      const [year, month, day] = normalizedDate.split('-')
      const matchYear = selectedYear === 'all' || year === selectedYear
      const matchMonth = selectedMonth === 'all' || month === selectedMonth
      const matchDay = selectedDay === 'all' || day === selectedDay
      return matchYear && matchMonth && matchDay
    })
  }, [selectedDay, selectedMonth, selectedYear, transactions])

  const dayOptions = useMemo(() => {
    const days = filteredTransactions
      .map((item) => normalizeTransactionDate(item.date))
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(8, 10))

    return ['all', ...Array.from(new Set(days)).sort((a, b) => Number(a) - Number(b))]
  }, [filteredTransactions])

  const entries = useMemo(() => filteredTransactions.filter((item) => item.type === 'entrada'), [filteredTransactions])
  const outcomes = useMemo(() => filteredTransactions.filter((item) => item.type === 'saida'), [filteredTransactions])
  const totalEntries = useMemo(() => entries.reduce((acc, item) => acc + item.amount, 0), [entries])
  const totalOutcomes = useMemo(() => outcomes.reduce((acc, item) => acc + item.amount, 0), [outcomes])
  const resultBalance = useMemo(() => totalEntries - totalOutcomes, [totalEntries, totalOutcomes])

  const handleDelete = async (id: string): Promise<void> => {
    setDeletingId(id)

    try {
      await financeService.deleteTransaction(id)
      setTransactions((prev) => prev.filter((item) => item.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setEditingDraft(null)
      }
      setError('')
    } catch {
      setError('Nao foi possivel apagar a transacao.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditStart = (transaction: Transaction): void => {
    setEditingId(transaction.id)
    setEditingDraft({
      ...transaction,
      isMonthlyCost: transaction.type === 'saida' ? Boolean(transaction.isMonthlyCost) : false
    })
    setError('')
  }

  const handleEditCancel = (): void => {
    setEditingId(null)
    setEditingDraft(null)
  }

  const handleEditChange = (
    field: 'date' | 'category' | 'description' | 'amount' | 'isMonthlyCost',
    value: string | boolean
  ): void => {
    if (!editingDraft) {
      return
    }

    if (field === 'amount') {
      const nextAmount = Number(value as string)
      setEditingDraft({ ...editingDraft, amount: Number.isFinite(nextAmount) ? nextAmount : 0 })
      return
    }

    if (field === 'isMonthlyCost') {
      setEditingDraft({
        ...editingDraft,
        isMonthlyCost: editingDraft.type === 'saida' ? Boolean(value) : false
      })
      return
    }

    setEditingDraft({ ...editingDraft, [field]: value as string })
  }

  const handleEditSave = async (): Promise<void> => {
    if (!editingDraft || !editingId) {
      return
    }

    if (!editingDraft.category.trim() || !editingDraft.description.trim() || editingDraft.amount <= 0 || !editingDraft.date) {
      setError('Preencha os campos da edicao com valores validos.')
      return
    }

    setIsSavingEdit(true)

    try {
      const safeDraft: Transaction = {
        ...editingDraft,
        isMonthlyCost: editingDraft.type === 'saida' ? editingDraft.isMonthlyCost : false
      }

      await financeService.updateTransaction(safeDraft)
      setTransactions((prev) => prev.map((item) => (item.id === editingId ? safeDraft : item)))
      setEditingId(null)
      setEditingDraft(null)
      setError('')
    } catch {
      setError('Nao foi possivel editar a transacao.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Relatorio</h1>
        <p>Visualizacao de transacoes salvas localmente.</p>
      </header>

      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>Ano</span>
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            <option value="all">Todos os anos</option>
            {yearOptions
              .filter((year) => year !== 'all')
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Mes</span>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Dia</span>
          <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            <option value="all">Todos os dias</option>
            {dayOptions
              .filter((day) => day !== 'all')
              .map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Carregando transacoes...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && (
        <>
          <div className={styles.summary}>
            <span>Soma de entradas: {formatCurrency(totalEntries)}</span>
            <span>Soma de saidas: {formatCurrency(totalOutcomes)}</span>
          </div>

          <div className={styles.grid}>
            <TransactionsTable
              title="Entradas"
              transactions={entries}
              onDelete={handleDelete}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditChange={handleEditChange}
              onEditSave={handleEditSave}
              deletingId={deletingId}
              editingId={editingId}
              editingDraft={editingDraft}
              isSavingEdit={isSavingEdit}
            />
            <TransactionsTable
              title="Saidas"
              transactions={outcomes}
              onDelete={handleDelete}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditChange={handleEditChange}
              onEditSave={handleEditSave}
              deletingId={deletingId}
              editingId={editingId}
              editingDraft={editingDraft}
              isSavingEdit={isSavingEdit}
            />
          </div>

          <footer className={styles.resultFooter}>
            <strong>Resultado: {formatCurrency(resultBalance)}</strong>
          </footer>
        </>
      )}
    </section>
  )
}
