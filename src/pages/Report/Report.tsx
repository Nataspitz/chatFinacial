import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLoading, ModalBase } from '../../components/ui'
import { LoadingState } from '../../components/organisms/LoadingState/LoadingState'
import { PageTemplate } from '../../components/templates/PageTemplate/PageTemplate'
import { financeService } from '../../services/finance.service'
import type { ExportReportPdfPayload } from '../../types/report-export.types'
import type { Transaction } from '../../types/transaction.types'
import { PageHeader } from './components/PageHeader'
import { ReportFilters } from './components/ReportFilters'
import { ReportSummary } from './components/ReportSummary'
import { ResultFooter } from './components/ResultFooter'
import { TransactionsTable } from './components/TransactionsTable'
import styles from './Report.module.css'

interface CreateFormState {
  type: Transaction['type']
  amount: string
  date: string
  category: string
  description: string
  isMonthlyCost: boolean
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (value: string): string => {
  const normalized = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (!normalized) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
  }

  const [year, month, day] = normalized.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR').format(localDate)
}

const normalizeTransactionDate = (value: string): string | null => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

const getTodayDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialCreateFormState: CreateFormState = {
  type: 'saida',
  amount: '',
  date: getTodayDate(),
  category: '',
  description: '',
  isMonthlyCost: false
}

const shouldIncludeMonthlyCostInPeriod = (
  transaction: Transaction,
  selectedYear: string,
  selectedMonth: string,
  selectedDay: string
): boolean => {
  if (transaction.type !== 'saida' || !transaction.isMonthlyCost) {
    return false
  }

  if (selectedYear === 'all' || selectedMonth === 'all') {
    return false
  }

  const normalizedDate = normalizeTransactionDate(transaction.date)
  if (!normalizedDate) {
    return false
  }

  const [year, month, day] = normalizedDate.split('-').map(Number)
  const targetYear = Number(selectedYear)
  const targetMonth = Number(selectedMonth)

  if (!Number.isFinite(targetYear) || !Number.isFinite(targetMonth)) {
    return false
  }

  const isAfterStartMonth = targetYear > year || (targetYear === year && targetMonth >= month)
  const matchDay = selectedDay === 'all' || day === Number(selectedDay)

  return isAfterStartMonth && matchDay
}

const MONTH_LABELS: Record<string, string> = {
  all: 'Todos os meses',
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Marco',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro'
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
  const [isExporting, setIsExporting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateFormState)
  const [isCreating, setIsCreating] = useState(false)
  const [createFeedback, setCreateFeedback] = useState('')

  const loadTransactions = async (): Promise<void> => {
    try {
      const data = await financeService.getTransactions()
      setTransactions(data)
      setError('')
    } catch {
      setError('Nao foi possivel carregar as transacoes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTransactions()
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

      if (matchYear && matchMonth && matchDay) {
        return true
      }

      return shouldIncludeMonthlyCostInPeriod(item, selectedYear, selectedMonth, selectedDay)
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
    if (!editingDraft) return

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
    if (!editingDraft || !editingId) return

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

  const handleCreateSubmit = async (): Promise<void> => {
    const parsedAmount = Number(createForm.amount.replace(',', '.'))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setCreateFeedback('Informe um valor valido maior que zero.')
      return
    }

    if (!createForm.date) {
      setCreateFeedback('Informe a data da transacao.')
      return
    }

    const category = createForm.category.trim()
    if (!category) {
      setCreateFeedback('Informe a categoria da transacao.')
      return
    }

    const description = createForm.description.trim()
    if (!description) {
      setCreateFeedback('Informe a descricao da transacao.')
      return
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: createForm.type,
      amount: parsedAmount,
      date: createForm.date,
      category,
      description,
      isMonthlyCost: createForm.type === 'saida' ? createForm.isMonthlyCost : false
    }

    setIsCreating(true)
    setCreateFeedback('')

    try {
      await financeService.saveTransaction(transaction)
      await loadTransactions()
      setCreateForm(initialCreateFormState)
      setIsCreateModalOpen(false)
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Nao foi possivel registrar a transacao no momento.'
      setCreateFeedback(message)
    } finally {
      setIsCreating(false)
    }
  }

  const getPeriodLabel = (): string => {
    const yearLabel = selectedYear === 'all' ? 'Todos os anos' : selectedYear
    const monthLabel = MONTH_LABELS[selectedMonth] ?? selectedMonth
    const dayLabel = selectedDay === 'all' ? 'Todos os dias' : selectedDay
    return `Ano: ${yearLabel} | Mes: ${monthLabel} | Dia: ${dayLabel}`
  }

  const handleExportReport = async (): Promise<void> => {
    const payload: ExportReportPdfPayload = {
      periodLabel: getPeriodLabel(),
      entries,
      outcomes,
      totalEntries,
      totalOutcomes,
      resultBalance
    }

    setIsExporting(true)
    setError('')

    try {
      await financeService.exportReportPdf(payload)
    } catch {
      setError('Nao foi possivel exportar o relatorio em PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <PageTemplate className={styles.page}>
      <PageHeader
        onCreate={() => {
          setCreateFeedback('')
          setIsCreateModalOpen(true)
        }}
        onExport={() => void handleExportReport()}
        isExporting={isExporting}
        disabled={isLoading}
      />

      <ReportFilters
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        yearOptions={yearOptions}
        dayOptions={dayOptions}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onDayChange={setSelectedDay}
      />

      {isLoading && <LoadingState label="Carregando transacoes..." />}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && (
        <>
          <ReportSummary totalEntries={totalEntries} totalOutcomes={totalOutcomes} formatCurrency={formatCurrency} />

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
              formatCurrency={formatCurrency}
              formatDate={formatDate}
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
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </div>

          <ResultFooter resultBalance={resultBalance} formatCurrency={formatCurrency} />
        </>
      )}

      <ModalBase
        open={isCreateModalOpen}
        title="Nova transacao"
        onClose={() => {
          if (isCreating) return
          setIsCreateModalOpen(false)
          setCreateFeedback('')
        }}
      >
        <form
          className={styles.createForm}
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateSubmit()
          }}
        >
          <label className={styles.createField}>
            <span>Tipo</span>
            <select
              value={createForm.type}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  type: event.target.value as Transaction['type'],
                  isMonthlyCost: event.target.value === 'saida' ? prev.isMonthlyCost : false
                }))
              }
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
          </label>

          {createForm.type === 'saida' ? (
            <label className={styles.createCheck}>
              <input
                type="checkbox"
                checked={createForm.isMonthlyCost}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, isMonthlyCost: event.target.checked }))}
              />
              <span>Marcar como custo mensal</span>
            </label>
          ) : null}

          <label className={styles.createField}>
            <span>Valor</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={createForm.amount}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="0.00"
            />
          </label>

          <label className={styles.createField}>
            <span>Data</span>
            <input type="date" value={createForm.date} onChange={(event) => setCreateForm((prev) => ({ ...prev, date: event.target.value }))} />
          </label>

          <label className={styles.createField}>
            <span>Categoria</span>
            <input
              type="text"
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Ex: Alimentacao"
            />
          </label>

          <label className={`${styles.createField} ${styles.createFieldFull}`}>
            <span>Descricao</span>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder="Descreva a transacao"
            />
          </label>

          {createFeedback ? <p className={styles.createFeedback}>{createFeedback}</p> : null}

          <div className={styles.createActions}>
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <ButtonLoading type="submit" loading={isCreating}>
              Salvar transacao
            </ButtonLoading>
          </div>
        </form>
      </ModalBase>
    </PageTemplate>
  )
}
