import { useEffect, useMemo, useState } from 'react'
import { financeService } from '../../services/finance.service'
import type { ExportReportPdfPayload } from '../../types/report-export.types'
import type { Transaction } from '../../types/transaction.types'
import { PageHeader } from './components/PageHeader'
import { ReportFilters } from './components/ReportFilters'
import { ReportSummary } from './components/ReportSummary'
import { ResultFooter } from './components/ResultFooter'
import { TransactionsTable } from './components/TransactionsTable'
import styles from './Report.module.css'

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
    <section className={styles.page}>
      <PageHeader onExport={() => void handleExportReport()} isExporting={isExporting} disabled={isLoading} />

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

      {isLoading && <p>Carregando transacoes...</p>}
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
    </section>
  )
}
