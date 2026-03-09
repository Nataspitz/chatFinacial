import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button, ModalBase } from '../../ui'
import { financeService } from '../../../services/finance.service'
import type { Transaction } from '../../../types/transaction.types'
import styles from './PromptConfigModal.module.css'

type PromptPeriodType = 'year' | 'month' | 'day'

type PromptAnalysisType =
  | 'horizontal'
  | 'vertical'
  | 'liquidity'
  | 'profitability'
  | 'debt'
  | 'break_even'
  | 'cash_flow'
  | 'benchmarking'
  | 'credit_5c'
  | 'fpa'

interface PromptConfigModalProps {
  open: boolean
  user: User | null
  onClose: () => void
}

interface AnalysisOption {
  id: PromptAnalysisType
  title: string
  objective: string
  focus: string
}

interface NormalizedTransaction extends Transaction {
  normalizedDate: string
  year: number
  month: number
  day: number
}

interface CategoryTotal {
  category: string
  total: number
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: 'horizontal',
    title: '1. Analise Horizontal (AH)',
    objective: 'Comparar evolucao de contas entre periodos para identificar crescimento ou queda.',
    focus: 'Tendencias de receita, custo e despesa ao longo do tempo.'
  },
  {
    id: 'vertical',
    title: '2. Analise Vertical (AV)',
    objective: 'Medir o peso de cada conta dentro do total do mesmo periodo.',
    focus: 'Estrutura de custos e despesas dentro da receita.'
  },
  {
    id: 'liquidity',
    title: '3. Analise de Indicadores de Liquidez',
    objective: 'Avaliar capacidade de pagar compromissos de curto prazo.',
    focus: 'Fluxo de caixa disponivel e pressao de pagamentos.'
  },
  {
    id: 'profitability',
    title: '4. Analise de Rentabilidade e Lucratividade',
    objective: 'Avaliar eficiencia para gerar lucro e retorno.',
    focus: 'Margens, lucratividade e retorno sobre investimento.'
  },
  {
    id: 'debt',
    title: '5. Analise de Endividamento',
    objective: 'Entender dependencia de capital de terceiros.',
    focus: 'Risco financeiro e capacidade de suportar dividas.'
  },
  {
    id: 'break_even',
    title: '6. Analise de Ponto de Equilibrio',
    objective: 'Estimar volume minimo de vendas para zerar lucro/prejuizo.',
    focus: 'Meta minima de receita para cobrir custos e despesas.'
  },
  {
    id: 'cash_flow',
    title: '7. Analise de Fluxo de Caixa',
    objective: 'Monitorar entradas e saidas de dinheiro em caixa.',
    focus: 'Liquidez operacional no curto prazo.'
  },
  {
    id: 'benchmarking',
    title: '8. Analise de Benchmarking',
    objective: 'Comparar resultados da empresa com referencia de mercado.',
    focus: 'Competitividade e oportunidades de melhoria.'
  },
  {
    id: 'credit_5c',
    title: "9. Analise com 5 C's de Credito",
    objective: 'Avaliar risco de credito em vendas a prazo.',
    focus: 'Capacidade de pagamento e risco de inadimplencia.'
  },
  {
    id: 'fpa',
    title: '10. Planejamento e Analise Financeira (FP&A)',
    objective: 'Projetar cenarios e orientar tomada de decisao futura.',
    focus: 'Orcamento, previsoes e plano de acao.'
  }
]

const normalizeTransactionDate = (value: string): string | null => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

const parseTransaction = (transaction: Transaction): NormalizedTransaction | null => {
  const normalizedDate = normalizeTransactionDate(transaction.date)
  if (!normalizedDate) {
    return null
  }

  const [year, month, day] = normalizedDate.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  return {
    ...transaction,
    normalizedDate,
    year,
    month,
    day
  }
}

const toMonthValue = (month: number): string => String(month).padStart(2, '0')

const getDaysInMonth = (year: number, month: number): number => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 31
  }
  return new Date(year, month, 0).getDate()
}

const getTopCategories = (transactions: Transaction[], type: Transaction['type']): CategoryTotal[] => {
  const totalByCategory = new Map<string, number>()

  transactions.forEach((transaction) => {
    if (transaction.type !== type) {
      return
    }

    const current = totalByCategory.get(transaction.category) ?? 0
    totalByCategory.set(transaction.category, current + transaction.amount)
  })

  return Array.from(totalByCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
}

const formatGrowthPercent = (current: number, previous: number): string => {
  if (previous === 0) {
    return current === 0 ? '0.00%' : 'N/D'
  }

  const growth = ((current - previous) / Math.abs(previous)) * 100
  return `${growth >= 0 ? '+' : ''}${growth.toFixed(2)}%`
}

const formatCurrency = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(value)
  } catch {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
}

const formatPeriodLabel = (periodType: PromptPeriodType, year: string, month: string, day: string): string => {
  if (periodType === 'year') {
    return year
  }

  if (periodType === 'month') {
    const monthNumber = Number(month)
    const monthLabel = MONTH_LABELS[monthNumber - 1] ?? month
    return `${monthLabel}/${year}`
  }

  return `${day}/${month}/${year}`
}

const buildTransactionLines = (transactions: Transaction[], currency: string): string[] => {
  return [...transactions]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 40)
    .map((transaction) => {
      const monthlyCostLabel = transaction.isMonthlyCost ? ' | custo mensal: sim' : ''
      return `- [${transaction.date}] ${transaction.type.toUpperCase()} | ${transaction.category} | ${transaction.description} | ${formatCurrency(transaction.amount, currency)}${monthlyCostLabel}`
    })
}

export const PromptConfigModal = ({ open, user, onClose }: PromptConfigModalProps): JSX.Element => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const [periodType, setPeriodType] = useState<PromptPeriodType>('month')
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState<string>(toMonthValue(now.getMonth() + 1))
  const [selectedDay, setSelectedDay] = useState<string>(String(now.getDate()).padStart(2, '0'))
  const [analysisType, setAnalysisType] = useState<PromptAnalysisType>('cash_flow')
  const [observations, setObservations] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success')
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  const companyName =
    typeof meta.company_name === 'string' && meta.company_name.trim() ? meta.company_name.trim() : 'Empresa nao informada'
  const ownerName = typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : 'Nao informado'
  const preferredCurrency =
    typeof meta.preferred_currency === 'string' && meta.preferred_currency.trim()
      ? meta.preferred_currency.trim().toUpperCase()
      : 'BRL'

  const normalizedTransactions = useMemo(() => {
    return transactions.map(parseTransaction).filter((item): item is NormalizedTransaction => item !== null)
  }, [transactions])

  const yearOptions = useMemo(() => {
    const years = normalizedTransactions.map((transaction) => transaction.year)
    if (years.length === 0) {
      return [currentYear]
    }

    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [normalizedTransactions, currentYear])

  useEffect(() => {
    if (!yearOptions.includes(Number(selectedYear))) {
      setSelectedYear(String(yearOptions[0]))
    }
  }, [selectedYear, yearOptions])

  const dayOptions = useMemo(() => {
    const year = Number(selectedYear)
    const month = Number(selectedMonth)
    const dayCount = getDaysInMonth(year, month)
    return Array.from({ length: dayCount }, (_, index) => String(index + 1).padStart(2, '0'))
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (!dayOptions.includes(selectedDay)) {
      setSelectedDay(dayOptions[0] ?? '01')
    }
  }, [dayOptions, selectedDay])

  const selectedAnalysis = useMemo(() => {
    return ANALYSIS_OPTIONS.find((option) => option.id === analysisType) ?? ANALYSIS_OPTIONS[0]
  }, [analysisType])

  const filteredTransactions = useMemo(() => {
    const selectedYearNumber = Number(selectedYear)
    const selectedMonthNumber = Number(selectedMonth)
    const selectedDayNumber = Number(selectedDay)

    return normalizedTransactions.filter((transaction) => {
      if (periodType === 'year') {
        return transaction.year === selectedYearNumber
      }

      if (periodType === 'month') {
        return transaction.year === selectedYearNumber && transaction.month === selectedMonthNumber
      }

      return (
        transaction.year === selectedYearNumber &&
        transaction.month === selectedMonthNumber &&
        transaction.day === selectedDayNumber
      )
    })
  }, [normalizedTransactions, periodType, selectedYear, selectedMonth, selectedDay])

  const previousPeriodTransactions = useMemo(() => {
    const selectedYearNumber = Number(selectedYear)
    const selectedMonthNumber = Number(selectedMonth)
    const selectedDayNumber = Number(selectedDay)

    if (!Number.isInteger(selectedYearNumber) || !Number.isInteger(selectedMonthNumber) || !Number.isInteger(selectedDayNumber)) {
      return [] as NormalizedTransaction[]
    }

    if (periodType === 'year') {
      return normalizedTransactions.filter((transaction) => transaction.year === selectedYearNumber - 1)
    }

    if (periodType === 'month') {
      const baseDate = new Date(selectedYearNumber, selectedMonthNumber - 1, 1)
      baseDate.setMonth(baseDate.getMonth() - 1)
      const prevYear = baseDate.getFullYear()
      const prevMonth = baseDate.getMonth() + 1
      return normalizedTransactions.filter((transaction) => transaction.year === prevYear && transaction.month === prevMonth)
    }

    const baseDate = new Date(selectedYearNumber, selectedMonthNumber - 1, selectedDayNumber)
    baseDate.setDate(baseDate.getDate() - 1)
    const prevYear = baseDate.getFullYear()
    const prevMonth = baseDate.getMonth() + 1
    const prevDay = baseDate.getDate()
    return normalizedTransactions.filter(
      (transaction) => transaction.year === prevYear && transaction.month === prevMonth && transaction.day === prevDay
    )
  }, [normalizedTransactions, periodType, selectedYear, selectedMonth, selectedDay])

  const currentEntryTotal = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'entrada').reduce((acc, item) => acc + item.amount, 0),
    [filteredTransactions]
  )
  const currentOutcomeTotal = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'saida').reduce((acc, item) => acc + item.amount, 0),
    [filteredTransactions]
  )
  const currentBalance = useMemo(() => currentEntryTotal - currentOutcomeTotal, [currentEntryTotal, currentOutcomeTotal])
  const currentMargin = useMemo(
    () => (currentEntryTotal > 0 ? (currentBalance / currentEntryTotal) * 100 : null),
    [currentBalance, currentEntryTotal]
  )

  const previousEntryTotal = useMemo(
    () => previousPeriodTransactions.filter((item) => item.type === 'entrada').reduce((acc, item) => acc + item.amount, 0),
    [previousPeriodTransactions]
  )
  const previousOutcomeTotal = useMemo(
    () => previousPeriodTransactions.filter((item) => item.type === 'saida').reduce((acc, item) => acc + item.amount, 0),
    [previousPeriodTransactions]
  )
  const previousBalance = useMemo(() => previousEntryTotal - previousOutcomeTotal, [previousEntryTotal, previousOutcomeTotal])

  const monthlyCostTransactions = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'saida' && item.isMonthlyCost),
    [filteredTransactions]
  )
  const monthlyCostTotal = useMemo(
    () => monthlyCostTransactions.reduce((acc, item) => acc + item.amount, 0),
    [monthlyCostTransactions]
  )

  const topEntryCategories = useMemo(() => getTopCategories(filteredTransactions, 'entrada'), [filteredTransactions])
  const topOutcomeCategories = useMemo(() => getTopCategories(filteredTransactions, 'saida'), [filteredTransactions])

  useEffect(() => {
    if (!open) {
      return
    }

    const loadTransactions = async (): Promise<void> => {
      setIsLoadingTransactions(true)
      setFeedback('')
      setGeneratedPrompt('')

      try {
        const data = await financeService.getTransactions()
        setTransactions(data)
      } catch {
        setFeedbackTone('error')
        setFeedback('Nao foi possivel carregar as transacoes para montar o prompt.')
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    void loadTransactions()
  }, [open])

  const handleGeneratePrompt = (): void => {
    if (isLoadingTransactions) {
      return
    }

    const periodLabel = formatPeriodLabel(periodType, selectedYear, selectedMonth, selectedDay)
    const promptLines: string[] = [
      'Voce e um analista financeiro para pequenas e medias empresas.',
      'Fale em portugues brasileiro com linguagem clara e objetiva.',
      '',
      'CONTEXTO DA EMPRESA',
      `- Empresa: ${companyName}`,
      `- Responsavel: ${ownerName}`,
      `- Email da conta: ${user?.email ?? 'Nao informado'}`,
      `- Moeda de referencia: ${preferredCurrency}`,
      `- Data de geracao deste contexto: ${new Date().toISOString()}`,
      '',
      'CONFIGURACAO DA ANALISE',
      `- Periodo selecionado: ${periodLabel}`,
      `- Escopo do periodo: ${periodType === 'year' ? 'Anual' : periodType === 'month' ? 'Mensal' : 'Diario'}`,
      `- Tipo de analise: ${selectedAnalysis.title}`,
      `- Objetivo: ${selectedAnalysis.objective}`,
      `- Foco: ${selectedAnalysis.focus}`,
      '',
      'RESUMO FINANCEIRO DO PERIODO',
      `- Quantidade de transacoes: ${filteredTransactions.length}`,
      `- Total de entradas: ${formatCurrency(currentEntryTotal, preferredCurrency)}`,
      `- Total de saidas: ${formatCurrency(currentOutcomeTotal, preferredCurrency)}`,
      `- Resultado liquido: ${formatCurrency(currentBalance, preferredCurrency)}`,
      `- Margem liquida: ${currentMargin === null ? 'N/D' : `${currentMargin.toFixed(2)}%`}`,
      `- Total de custos mensais marcados: ${formatCurrency(monthlyCostTotal, preferredCurrency)} (${monthlyCostTransactions.length} itens)`,
      '',
      'COMPARACAO COM PERIODO ANTERIOR',
      `- Entradas no periodo anterior: ${formatCurrency(previousEntryTotal, preferredCurrency)}`,
      `- Saidas no periodo anterior: ${formatCurrency(previousOutcomeTotal, preferredCurrency)}`,
      `- Resultado no periodo anterior: ${formatCurrency(previousBalance, preferredCurrency)}`,
      `- Variacao de entradas: ${formatGrowthPercent(currentEntryTotal, previousEntryTotal)}`,
      `- Variacao de saidas: ${formatGrowthPercent(currentOutcomeTotal, previousOutcomeTotal)}`,
      `- Variacao de resultado: ${formatGrowthPercent(currentBalance, previousBalance)}`,
      '',
      'TOP CATEGORIAS DE ENTRADA',
      ...(topEntryCategories.length > 0
        ? topEntryCategories.map(
            (item, index) => `${index + 1}. ${item.category}: ${formatCurrency(item.total, preferredCurrency)}`
          )
        : ['- Sem dados de entrada no periodo.']),
      '',
      'TOP CATEGORIAS DE SAIDA',
      ...(topOutcomeCategories.length > 0
        ? topOutcomeCategories.map(
            (item, index) => `${index + 1}. ${item.category}: ${formatCurrency(item.total, preferredCurrency)}`
          )
        : ['- Sem dados de saida no periodo.']),
      '',
      'AMOSTRA DE TRANSACOES (ATE 40 ITENS, ORDENADOS POR IMPACTO)',
      ...(filteredTransactions.length > 0
        ? buildTransactionLines(filteredTransactions, preferredCurrency)
        : ['- Nao ha transacoes no periodo selecionado.']),
      '',
      'OBSERVACOES DO USUARIO',
      observations.trim() ? observations.trim() : '- Sem observacoes adicionais.',
      '',
      'O QUE ESPERO DA SUA RESPOSTA',
      '1. Diagnostico financeiro direto do periodo.',
      `2. Interpretacao focada em ${selectedAnalysis.title}.`,
      '3. Principais riscos e oportunidades.',
      '4. Plano de acao pratico para os proximos 30 dias.',
      '5. Alertas do que devo monitorar no proximo periodo.',
      '6. Lista de 5 perguntas estrategicas para aprofundar a analise.'
    ]

    setGeneratedPrompt(promptLines.join('\n'))
    setFeedbackTone('success')
    setFeedback('Prompt gerado com sucesso. Revise e clique em copiar.')
  }

  const handleCopyPrompt = async (): Promise<void> => {
    if (!generatedPrompt.trim()) {
      setFeedbackTone('error')
      setFeedback('Gere o prompt antes de copiar.')
      return
    }

    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setFeedbackTone('success')
      setFeedback('Prompt copiado para a area de transferencia.')
    } catch {
      setFeedbackTone('error')
      setFeedback('Nao foi possivel copiar automaticamente. Tente novamente.')
    }
  }

  return (
    <ModalBase
      open={open}
      title="Configurar prompt para IA"
      onClose={() => {
        if (isLoadingTransactions) return
        onClose()
      }}
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Configure o periodo, o tipo de analise e suas observacoes. O sistema monta um prompt completo para usar no
          ChatGPT Web.
        </p>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Escopo do periodo</span>
            <select value={periodType} onChange={(event) => setPeriodType(event.target.value as PromptPeriodType)}>
              <option value="year">Anual</option>
              <option value="month">Mensal</option>
              <option value="day">Diario</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Ano</span>
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          {periodType !== 'year' ? (
            <label className={styles.field}>
              <span>Mes</span>
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                {MONTH_LABELS.map((label, index) => {
                  const value = String(index + 1).padStart(2, '0')
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </label>
          ) : null}

          {periodType === 'day' ? (
            <label className={styles.field}>
              <span>Dia</span>
              <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <label className={styles.field}>
          <span>Tipo de analise</span>
          <select value={analysisType} onChange={(event) => setAnalysisType(event.target.value as PromptAnalysisType)}>
            {ANALYSIS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>

        <section className={styles.analysisHint}>
          <strong>{selectedAnalysis.title}</strong>
          <p>
            <b>Objetivo:</b> {selectedAnalysis.objective}
          </p>
          <p>
            <b>Foco:</b> {selectedAnalysis.focus}
          </p>
        </section>

        <label className={styles.field}>
          <span>Observacoes para incluir no prompt</span>
          <textarea
            rows={4}
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            placeholder="Ex: quero foco em reducao de custos fixos e aumento de margem."
          />
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleGeneratePrompt} disabled={isLoadingTransactions}>
            {isLoadingTransactions ? 'Carregando dados...' : 'Gerar prompt'}
          </Button>
          <Button type="button" onClick={() => void handleCopyPrompt()} disabled={!generatedPrompt.trim()}>
            Copiar prompt
          </Button>
        </div>

        <label className={styles.field}>
          <span>Prompt gerado</span>
          <textarea
            rows={16}
            value={generatedPrompt}
            placeholder="Clique em Gerar prompt para montar o texto."
            className={styles.output}
            readOnly
          />
        </label>

        {feedback ? (
          <p className={feedbackTone === 'success' ? styles.feedbackSuccess : styles.feedbackError}>{feedback}</p>
        ) : null}
      </div>
    </ModalBase>
  )
}
