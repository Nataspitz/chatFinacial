import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLoading, ModalBase } from '../../components/ui'
import { LoadingState } from '../../components/organisms/LoadingState/LoadingState'
import { PageTemplate } from '../../components/templates/PageTemplate/PageTemplate'
import { useAuth } from '../../contexts/AuthContext'
import { financeService, type CategoryItem } from '../../services/finance.service'
import type { ExportReportPdfPayload } from '../../types/report-export.types'
import type { Transaction, TransactionType } from '../../types/transaction.types'
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

interface ExportFormState {
  fileName: string
  periodType: 'year' | 'month' | 'day'
  year: string
  month: string
  day: string
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

const initialExportFormState: ExportFormState = {
  fileName: 'relatorio-financeiro',
  periodType: 'month',
  year: String(new Date().getFullYear()),
  month: String(new Date().getMonth() + 1).padStart(2, '0'),
  day: String(new Date().getDate()).padStart(2, '0')
}

const normalizeCategoryValue = (value: string): string => value.trim().replace(/\s+/g, ' ')

const getSortableDateValue = (value: string): number => {
  const iso = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (iso) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day).getTime()
  }

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) {
    const [, day, month, year] = br
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
  }

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

const sortTransactionsByDateAsc = (items: Transaction[]): Transaction[] => {
  return [...items].sort((a, b) => getSortableDateValue(a.date) - getSortableDateValue(b.date))
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
  const { user } = useAuth()
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFeedback, setExportFeedback] = useState('')
  const [exportForm, setExportForm] = useState<ExportFormState>(initialExportFormState)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateFormState)
  const [isCreating, setIsCreating] = useState(false)
  const [createFeedback, setCreateFeedback] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<Record<TransactionType, CategoryItem[]>>({
    entrada: [],
    saida: []
  })
  const [categoryType, setCategoryType] = useState<TransactionType>('saida')
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [categoryFeedback, setCategoryFeedback] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [categoryUpdatingId, setCategoryUpdatingId] = useState<string | null>(null)
  const [categoryDeletingId, setCategoryDeletingId] = useState<string | null>(null)

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

  const loadCategories = async (): Promise<void> => {
    try {
      const [entradaCategories, saidaCategories] = await Promise.all([
        financeService.getCategoryItems('entrada'),
        financeService.getCategoryItems('saida')
      ])

      setCategoryOptions({
        entrada: entradaCategories,
        saida: saidaCategories
      })
    } catch {
      setError('Nao foi possivel carregar as categorias.')
    }
  }

  useEffect(() => {
    void (async () => {
      await Promise.allSettled([loadTransactions(), loadCategories()])
      setIsLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen) {
      return
    }

    const options = categoryOptions[createForm.type]
    if (options.length === 0) {
      return
    }

    if (!createForm.category || !options.some((option) => option.name === createForm.category)) {
      setCreateForm((prev) => ({ ...prev, category: options[0].name }))
    }
  }, [categoryOptions, createForm.category, createForm.type, isCreateModalOpen])

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

  const exportYearOptions = useMemo(() => {
    const years = transactions
      .map((item) => normalizeTransactionDate(item.date))
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 4))

    const uniqueYears = Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a))
    return uniqueYears.length > 0 ? uniqueYears : [String(new Date().getFullYear())]
  }, [transactions])

  const exportDayOptions = useMemo(() => {
    const days = transactions
      .map((item) => normalizeTransactionDate(item.date))
      .filter((value): value is string => Boolean(value))
      .filter((value) => value.slice(0, 4) === exportForm.year && value.slice(5, 7) === exportForm.month)
      .map((value) => value.slice(8, 10))

    const uniqueDays = Array.from(new Set(days)).sort((a, b) => Number(a) - Number(b))
    return uniqueDays.length > 0 ? uniqueDays : ['01']
  }, [exportForm.month, exportForm.year, transactions])

  useEffect(() => {
    if (!exportYearOptions.includes(exportForm.year)) {
      setExportForm((prev) => ({ ...prev, year: exportYearOptions[0] }))
    }
  }, [exportForm.year, exportYearOptions])

  useEffect(() => {
    if (!exportDayOptions.includes(exportForm.day)) {
      setExportForm((prev) => ({ ...prev, day: exportDayOptions[0] }))
    }
  }, [exportDayOptions, exportForm.day])

  const exportTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const normalizedDate = normalizeTransactionDate(item.date)
      if (!normalizedDate) {
        return false
      }

      const [year, month, day] = normalizedDate.split('-')

      if (exportForm.periodType === 'year') {
        return year === exportForm.year
      }

      if (exportForm.periodType === 'month') {
        if (year === exportForm.year && month === exportForm.month) {
          return true
        }

        return shouldIncludeMonthlyCostInPeriod(item, exportForm.year, exportForm.month, 'all')
      }

      if (year === exportForm.year && month === exportForm.month && day === exportForm.day) {
        return true
      }

      return shouldIncludeMonthlyCostInPeriod(item, exportForm.year, exportForm.month, exportForm.day)
    })
  }, [exportForm.day, exportForm.month, exportForm.periodType, exportForm.year, transactions])

  const exportEntries = useMemo(
    () => sortTransactionsByDateAsc(exportTransactions.filter((item) => item.type === 'entrada')),
    [exportTransactions]
  )
  const exportOutcomes = useMemo(
    () => sortTransactionsByDateAsc(exportTransactions.filter((item) => item.type === 'saida')),
    [exportTransactions]
  )
  const exportTotalEntries = useMemo(
    () => exportEntries.reduce((acc, item) => acc + item.amount, 0),
    [exportEntries]
  )
  const exportTotalOutcomes = useMemo(
    () => exportOutcomes.reduce((acc, item) => acc + item.amount, 0),
    [exportOutcomes]
  )
  const exportResultBalance = useMemo(
    () => exportTotalEntries - exportTotalOutcomes,
    [exportTotalEntries, exportTotalOutcomes]
  )

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
      const category = normalizeCategoryValue(editingDraft.category)
      const safeDraft: Transaction = {
        ...editingDraft,
        category,
        description: editingDraft.description.trim(),
        isMonthlyCost: editingDraft.type === 'saida' ? editingDraft.isMonthlyCost : false
      }

      await financeService.saveCategory(category, safeDraft.type)
      await financeService.updateTransaction(safeDraft)
      setTransactions((prev) => prev.map((item) => (item.id === editingId ? safeDraft : item)))
      setEditingId(null)
      setEditingDraft(null)
      await loadCategories()
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

    const category = normalizeCategoryValue(createForm.category)
    if (!category) {
      setCreateFeedback('Selecione uma categoria.')
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
      await financeService.saveCategory(category, createForm.type)
      await Promise.all([loadTransactions(), loadCategories()])
      setCreateForm(initialCreateFormState)
      setNewCategoryName('')
      setIsCreateModalOpen(false)
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Nao foi possivel registrar a transacao no momento.'
      setCreateFeedback(message)
    } finally {
      setIsCreating(false)
    }
  }

  const getExportPeriodLabel = (): string => {
    if (exportForm.periodType === 'year') {
      return `Ano: ${exportForm.year}`
    }

    if (exportForm.periodType === 'month') {
      const monthLabel = MONTH_LABELS[exportForm.month] ?? exportForm.month
      return `Mes: ${monthLabel}/${exportForm.year}`
    }

    const monthLabel = MONTH_LABELS[exportForm.month] ?? exportForm.month
    return `Dia: ${exportForm.day}/${exportForm.month}/${exportForm.year} (${monthLabel})`
  }

  const handleExportReport = async (): Promise<void> => {
    const fileName = normalizeCategoryValue(exportForm.fileName)
    if (!fileName) {
      setExportFeedback('Informe o nome do arquivo.')
      return
    }

    if (exportForm.periodType === 'day' && !exportForm.day) {
      setExportFeedback('Selecione o dia para exportar.')
      return
    }

    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
    const companyName =
      typeof meta.company_name === 'string' && meta.company_name.trim()
        ? meta.company_name.trim()
        : 'Empresa nao informada'

    const payload: ExportReportPdfPayload = {
      fileName,
      companyName,
      createdAt: new Date().toISOString(),
      periodLabel: getExportPeriodLabel(),
      entries: exportEntries,
      outcomes: exportOutcomes,
      totalEntries: exportTotalEntries,
      totalOutcomes: exportTotalOutcomes,
      resultBalance: exportResultBalance,
      dashboardMetrics: [
        { label: 'Receita do periodo', value: formatCurrency(exportTotalEntries) },
        { label: 'Despesa do periodo', value: formatCurrency(exportTotalOutcomes) },
        { label: 'Lucro liquido', value: formatCurrency(exportResultBalance) },
        {
          label: 'Margem',
          value: exportTotalEntries > 0 ? `${((exportResultBalance / exportTotalEntries) * 100).toFixed(2)}%` : 'N/D'
        }
      ]
    }

    setIsExporting(true)
    setError('')
    setExportFeedback('')

    try {
      await financeService.exportReportPdf(payload)
      setIsExportModalOpen(false)
    } catch {
      setExportFeedback('Nao foi possivel exportar o relatorio em PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateCategory = async (
    type: TransactionType,
    options?: {
      onSaved?: (name: string) => void
    }
  ): Promise<void> => {
    const normalizedName = normalizeCategoryValue(newCategoryName)
    if (!normalizedName) {
      setCreateFeedback('Informe um nome valido para a categoria.')
      setCategoryFeedback('Informe um nome valido para a categoria.')
      return
    }

    setIsSavingCategory(true)
    setCreateFeedback('')
    setCategoryFeedback('')

    try {
      await financeService.saveCategory(normalizedName, type)
      await loadCategories()
      options?.onSaved?.(normalizedName)
      setNewCategoryName('')
    } catch {
      setCreateFeedback('Nao foi possivel salvar a categoria.')
      setCategoryFeedback('Nao foi possivel salvar a categoria.')
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleUpdateCategory = async (categoryId: string): Promise<void> => {
    const normalizedName = normalizeCategoryValue(editingCategoryName)
    if (!normalizedName) {
      setCategoryFeedback('Informe um nome valido para a categoria.')
      return
    }

    setCategoryUpdatingId(categoryId)
    setCategoryFeedback('')
    try {
      await financeService.updateCategory(categoryId, normalizedName, categoryType)
      await loadCategories()
      setEditingCategoryId(null)
      setEditingCategoryName('')
      setCategoryFeedback('Categoria atualizada com sucesso.')
    } catch {
      setCategoryFeedback('Nao foi possivel atualizar a categoria.')
    } finally {
      setCategoryUpdatingId(null)
    }
  }

  const handleDeleteCategory = async (categoryId: string): Promise<void> => {
    setCategoryDeletingId(categoryId)
    setCategoryFeedback('')
    try {
      await financeService.deleteCategory(categoryId)
      await loadCategories()
      if (editingCategoryId === categoryId) {
        setEditingCategoryId(null)
        setEditingCategoryName('')
      }
      setCategoryFeedback('Categoria excluida com sucesso.')
    } catch {
      setCategoryFeedback('Nao foi possivel excluir a categoria.')
    } finally {
      setCategoryDeletingId(null)
    }
  }

  return (
    <PageTemplate className={styles.page}>
      <PageHeader
        onCreate={() => {
          setCreateFeedback('')
          setNewCategoryName('')
          setCreateForm((prev) => ({
            ...prev,
            category: categoryOptions[prev.type][0]?.name ?? ''
          }))
          setIsCreateModalOpen(true)
        }}
        onManageCategories={() => {
          setCategoryType('saida')
          setCategoryFeedback('')
          setNewCategoryName('')
          setIsCreateCategoryOpen(false)
          setEditingCategoryId(null)
          setEditingCategoryName('')
          setIsCategoryModalOpen(true)
        }}
        onExport={() => {
          setExportFeedback('')
          setExportForm((prev) => ({
            ...prev,
            year: exportYearOptions[0] ?? prev.year,
            day: exportDayOptions[0] ?? prev.day
          }))
          setIsExportModalOpen(true)
        }}
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
              categoryOptions={categoryOptions.entrada.map((item) => item.name)}
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
              categoryOptions={categoryOptions.saida.map((item) => item.name)}
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
        open={isExportModalOpen}
        title="Exportar relatorio"
        onClose={() => {
          if (isExporting) return
          setIsExportModalOpen(false)
          setExportFeedback('')
        }}
      >
        <form
          className={styles.exportForm}
          onSubmit={(event) => {
            event.preventDefault()
            void handleExportReport()
          }}
        >
          <label className={styles.createField}>
            <span>Nome do arquivo</span>
            <input
              type="text"
              value={exportForm.fileName}
              onChange={(event) => setExportForm((prev) => ({ ...prev, fileName: event.target.value }))}
              placeholder="relatorio-financeiro"
            />
          </label>

          <label className={styles.createField}>
            <span>Periodo de exportacao</span>
            <select
              value={exportForm.periodType}
              onChange={(event) =>
                setExportForm((prev) => ({
                  ...prev,
                  periodType: event.target.value as ExportFormState['periodType']
                }))
              }
            >
              <option value="year">Ano</option>
              <option value="month">Mes</option>
              <option value="day">Dia</option>
            </select>
          </label>

          <div className={styles.exportPeriodGrid}>
            <label className={styles.createField}>
              <span>Ano</span>
              <select
                value={exportForm.year}
                onChange={(event) => setExportForm((prev) => ({ ...prev, year: event.target.value }))}
              >
                {exportYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            {exportForm.periodType !== 'year' ? (
              <label className={styles.createField}>
                <span>Mes</span>
                <select
                  value={exportForm.month}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, month: event.target.value }))}
                >
                  {Object.entries(MONTH_LABELS)
                    .filter(([value]) => value !== 'all')
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}

            {exportForm.periodType === 'day' ? (
              <label className={styles.createField}>
                <span>Dia</span>
                <select
                  value={exportForm.day}
                  onChange={(event) => setExportForm((prev) => ({ ...prev, day: event.target.value }))}
                >
                  {exportDayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className={styles.exportPreview}>
            <p><strong>Entradas:</strong> {formatCurrency(exportTotalEntries)}</p>
            <p><strong>Saidas:</strong> {formatCurrency(exportTotalOutcomes)}</p>
            <p><strong>Resultado:</strong> {formatCurrency(exportResultBalance)}</p>
          </div>

          {exportFeedback ? <p className={styles.createFeedback}>{exportFeedback}</p> : null}

          <div className={styles.createActions}>
            <Button type="button" variant="ghost" onClick={() => setIsExportModalOpen(false)} disabled={isExporting}>
              Cancelar
            </Button>
            <ButtonLoading type="submit" loading={isExporting}>
              Gerar PDF
            </ButtonLoading>
          </div>
        </form>
      </ModalBase>

      <ModalBase
        open={isCreateModalOpen}
        title="Nova transacao"
        onClose={() => {
          if (isCreating) return
          setIsCreateModalOpen(false)
          setCreateFeedback('')
          setNewCategoryName('')
        }}
      >
        <form
          className={styles.createForm}
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateSubmit()
          }}
        >
          <label className={`${styles.createField} ${styles.createFieldType}`}>
            <span>Tipo</span>
            <select
              value={createForm.type}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  type: event.target.value as Transaction['type'],
                  category: '',
                  isMonthlyCost: event.target.value === 'saida' ? prev.isMonthlyCost : false
                }))
              }
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
          </label>

          {createForm.type === 'saida' ? (
            <label className={`${styles.createCheck} ${styles.createFieldFull}`}>
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
            <select
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="">Selecione...</option>
              {categoryOptions[createForm.type].map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
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

      <ModalBase
        open={isCategoryModalOpen}
        title="Gerenciar categorias"
        onClose={() => {
          if (categoryUpdatingId !== null || categoryDeletingId !== null || isSavingCategory) return
          setIsCategoryModalOpen(false)
          setCategoryFeedback('')
          setIsCreateCategoryOpen(false)
          setEditingCategoryId(null)
          setEditingCategoryName('')
        }}
      >
        <div className={styles.categoryManager}>
          <div className={styles.categoryTopBar}>
            <label className={styles.createField}>
              <span>Tipo</span>
              <select
                value={categoryType}
                onChange={(event) => {
                  setCategoryType(event.target.value as TransactionType)
                  setIsCreateCategoryOpen(false)
                  setEditingCategoryId(null)
                  setEditingCategoryName('')
                  setCategoryFeedback('')
                }}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saida</option>
              </select>
            </label>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateCategoryOpen((prev) => !prev)
                setCategoryFeedback('')
              }}
            >
              {isCreateCategoryOpen ? 'Cancelar nova categoria' : 'Criar nova categoria'}
            </Button>
          </div>

          {isCreateCategoryOpen ? (
            <label className={styles.createField}>
              <span>Nova categoria</span>
              <div className={styles.categoryInline}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Ex: Alimentacao"
                />
                <ButtonLoading
                  type="button"
                  loading={isSavingCategory}
                  onClick={() => void handleCreateCategory(categoryType)}
                >
                  Adicionar
                </ButtonLoading>
              </div>
            </label>
          ) : null}

          <div className={styles.categoryList}>
            {categoryOptions[categoryType].length === 0 ? (
              <p className={styles.empty}>Nenhuma categoria cadastrada para este tipo.</p>
            ) : (
              categoryOptions[categoryType].map((item) => (
                <article key={item.id} className={styles.categoryItem}>
                  <div className={styles.categoryItemInfo}>
                    {editingCategoryId === item.id ? (
                      <input
                        type="text"
                        className={styles.cellInput}
                        value={editingCategoryName}
                        onChange={(event) => setEditingCategoryName(event.target.value)}
                      />
                    ) : (
                      <strong className={styles.categoryName}>{item.name}</strong>
                    )}
                  </div>

                  <div className={styles.categoryActions}>
                    {editingCategoryId === item.id ? (
                      <>
                        <ButtonLoading
                          type="button"
                          loading={categoryUpdatingId === item.id}
                          disabled={!editingCategoryName.trim() || categoryDeletingId === item.id}
                          onClick={() => void handleUpdateCategory(item.id)}
                        >
                          Salvar
                        </ButtonLoading>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={categoryUpdatingId === item.id}
                          onClick={() => {
                            setEditingCategoryId(null)
                            setEditingCategoryName('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={categoryDeletingId === item.id}
                          onClick={() => {
                            setEditingCategoryId(item.id)
                            setEditingCategoryName(item.name)
                          }}
                        >
                          Editar
                        </Button>
                        <ButtonLoading
                          type="button"
                          variant="danger"
                          loading={categoryDeletingId === item.id}
                          disabled={categoryUpdatingId === item.id}
                          onClick={() => void handleDeleteCategory(item.id)}
                        >
                          Apagar
                        </ButtonLoading>
                      </>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          {categoryFeedback ? <p className={styles.createFeedback}>{categoryFeedback}</p> : null}
        </div>
      </ModalBase>
    </PageTemplate>
  )
}
