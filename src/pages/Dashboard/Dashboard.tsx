import { useEffect, useMemo, useState } from 'react'
import { PageIntro } from '../../components/molecules/PageIntro/PageIntro'
import { PageTemplate } from '../../components/templates/PageTemplate/PageTemplate'
import { Button } from '../../components/ui'
import { businessService, type BusinessSettings } from '../../services/business.service'
import { financeService } from '../../services/finance.service'
import {
  buildAnnualCandles,
  buildLast12MonthsSeries,
  buildLastNPeriodProfits,
  buildMonthlyCandles,
  calculateAccumulatedProfit,
  calculateGrowthPercent,
  calculateMargin,
  calculateMovingAverage,
  calculatePeriodTotals,
  calculateRoi,
  getPeriodTransactions,
  getPreviousPeriod,
  parseTransactionDate
} from './dashboard-calculations'
import { CompanySettingsModal } from './components/CompanySettingsModal/CompanySettingsModal'
import { DashboardFilters } from './components/DashboardFilters/DashboardFilters'
import { DashboardSkeleton } from './components/DashboardSkeleton/DashboardSkeleton'
import { ExecutiveCards } from './components/ExecutiveCards/ExecutiveCards'
import { GrowthLineChart } from './components/GrowthLineChart/GrowthLineChart'
import { HealthIndicators } from './components/HealthIndicators/HealthIndicators'
import { HelpPanel } from './components/HelpPanel/HelpPanel'
import { MonthlyCandleChart } from './components/MonthlyCandleChart/MonthlyCandleChart'
import { RevenueExpenseBarChart } from './components/RevenueExpenseBarChart/RevenueExpenseBarChart'
import { RoiSection } from './components/RoiSection/RoiSection'
import { SectionContainer } from './components/SectionContainer/SectionContainer'
import { TrendIndicators } from './components/TrendIndicators/TrendIndicators'
import type { DashboardViewMode, HealthSnapshot, NormalizedTransaction } from './types'
import styles from './Dashboard.module.css'

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatPercent = (value: number | null): string => {
  if (value === null) {
    return 'N/D'
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const Dashboard = (): JSX.Element => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [mode, setMode] = useState<DashboardViewMode>('annual')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  const [isBusinessLoading, setIsBusinessLoading] = useState(true)
  const [error, setError] = useState('')
  const [businessSettingsFailed, setBusinessSettingsFailed] = useState(false)
  const [isCompanySettingsModalOpen, setIsCompanySettingsModalOpen] = useState(false)
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false)

  useEffect(() => {
    void (async () => {
      const [transactionsResult, businessResult] = await Promise.allSettled([
        financeService.getTransactions(),
        businessService.getBusinessSettings()
      ])

      if (transactionsResult.status === 'fulfilled') {
        const normalized = transactionsResult.value
          .map((item) => {
            const parsedDate = parseTransactionDate(item.date)
            if (!parsedDate) {
              return null
            }

            return {
              ...item,
              parsedDate,
              year: parsedDate.getFullYear(),
              month: parsedDate.getMonth() + 1,
              day: parsedDate.getDate()
            } satisfies NormalizedTransaction
          })
          .filter((item): item is NormalizedTransaction => item !== null)

        setTransactions(normalized)
      } else {
        setError('Nao foi possivel carregar os dados da dashboard.')
      }

      if (businessResult.status === 'fulfilled') {
        setBusinessSettings(businessResult.value)
        setBusinessSettingsFailed(false)
      } else {
        setBusinessSettings(null)
        setBusinessSettingsFailed(true)
      }

      setIsTransactionsLoading(false)
      setIsBusinessLoading(false)
    })()
  }, [])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(transactions.map((item) => item.year))).sort((a, b) => b - a)
    return years.length ? years : [currentYear]
  }, [transactions, currentYear])

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  const currentPeriodTransactions = useMemo(() => {
    return getPeriodTransactions(transactions, mode, selectedYear, selectedMonth)
  }, [transactions, mode, selectedYear, selectedMonth])

  const previousPeriod = useMemo(() => getPreviousPeriod(mode, selectedYear, selectedMonth), [mode, selectedYear, selectedMonth])

  const previousPeriodTransactions = useMemo(() => {
    return getPeriodTransactions(transactions, mode, previousPeriod.year, previousPeriod.month)
  }, [transactions, mode, previousPeriod])

  const currentTotals = useMemo(() => calculatePeriodTotals(currentPeriodTransactions), [currentPeriodTransactions])
  const previousTotals = useMemo(() => calculatePeriodTotals(previousPeriodTransactions), [previousPeriodTransactions])

  const margin = useMemo(() => calculateMargin(currentTotals.revenue, currentTotals.profit), [currentTotals])

  const profitVariation = useMemo(
    () => calculateGrowthPercent(currentTotals.profit, previousTotals.profit),
    [currentTotals.profit, previousTotals.profit]
  )

  const revenueGrowth = useMemo(
    () => calculateGrowthPercent(currentTotals.revenue, previousTotals.revenue),
    [currentTotals.revenue, previousTotals.revenue]
  )

  const expenseGrowth = useMemo(
    () => calculateGrowthPercent(currentTotals.expense, previousTotals.expense),
    [currentTotals.expense, previousTotals.expense]
  )

  const candleSeries = useMemo(() => {
    if (mode === 'annual') {
      return buildAnnualCandles(transactions, selectedYear)
    }

    return buildMonthlyCandles(transactions, selectedYear, selectedMonth)
  }, [transactions, mode, selectedYear, selectedMonth])

  const hasDataInSelection = useMemo(() => {
    if (mode === 'annual') {
      return transactions.some((item) => item.year === selectedYear)
    }

    return transactions.some((item) => item.year === selectedYear && item.month === selectedMonth)
  }, [transactions, mode, selectedYear, selectedMonth])

  const lineSeries = useMemo(() => {
    const endMonth = mode === 'annual' ? 12 : selectedMonth
    return buildLast12MonthsSeries(transactions, selectedYear, endMonth)
  }, [transactions, mode, selectedYear, selectedMonth])

  const healthSnapshot = useMemo<HealthSnapshot>(() => {
    const periodProfits = buildLastNPeriodProfits(transactions, mode, selectedYear, selectedMonth, 3)
    const averageProfitLast3 = periodProfits.reduce((acc, value) => acc + value, 0) / periodProfits.length

    const lastSixProfits = lineSeries.map((item) => item.profit)
    const shortMovingAverage = calculateMovingAverage(lastSixProfits, 3)
    const longMovingAverage = calculateMovingAverage(lastSixProfits, 6)

    const trend: 'subindo' | 'descendo' | 'estavel' =
      shortMovingAverage === null || longMovingAverage === null
        ? 'estavel'
        : shortMovingAverage > longMovingAverage
          ? 'subindo'
          : shortMovingAverage < longMovingAverage
            ? 'descendo'
            : 'estavel'

    const expenseGrowingFaster =
      revenueGrowth === null || expenseGrowth === null ? null : expenseGrowth > revenueGrowth

    return {
      averageProfitLast3,
      revenueGrowth,
      expenseGrowth,
      trend,
      expenseGrowingFaster
    }
  }, [transactions, mode, selectedYear, selectedMonth, lineSeries, revenueGrowth, expenseGrowth])

  const accumulatedProfit = useMemo(() => calculateAccumulatedProfit(transactions), [transactions])

  const investmentAmount = useMemo(() => {
    const value = businessSettings?.investment_base_amount ?? null
    return value !== null && value > 0 ? value : null
  }, [businessSettings])

  const roi = useMemo(() => calculateRoi(accumulatedProfit, investmentAmount), [accumulatedProfit, investmentAmount])

  const periodLabel = useMemo(() => {
    if (mode === 'annual') {
      return String(selectedYear)
    }

    return `${MONTH_NAMES[selectedMonth - 1]}/${selectedYear}`
  }, [mode, selectedYear, selectedMonth])

  const isLoading = isTransactionsLoading || isBusinessLoading

  if (isLoading) {
    return (
      <PageTemplate className={styles.page}>
        <PageIntro
          title="Dashboard Executiva"
          description="Acompanhamento de crescimento, margem, ROI e tendencias financeiras."
        />
        <DashboardSkeleton />
      </PageTemplate>
    )
  }

  return (
    <PageTemplate className={styles.page}>
      <PageIntro
        title="Dashboard Executiva"
        description="Crescimento, margem, ROI, tendencia e analise mensal/ anual em uma unica visao."
      />

      <DashboardFilters
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        mode={mode}
        years={availableYears}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onModeChange={setMode}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      {!error && transactions.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>Nenhuma transacao encontrada</h2>
          <p>Registre transacoes para visualizar crescimento, margem, ROI e tendencias.</p>
        </section>
      ) : null}

      {!error && transactions.length > 0 ? (
        <div className={styles.layout}>
          <SectionContainer title="Resumo executivo" description={`Periodo selecionado: ${periodLabel}`}>
            <ExecutiveCards
              revenue={formatCurrency(currentTotals.revenue)}
              expense={formatCurrency(currentTotals.expense)}
              profit={formatCurrency(currentTotals.profit)}
              margin={formatPercent(margin)}
              variation={formatPercent(profitVariation)}
              variationPositive={(profitVariation ?? 0) >= 0}
            />
          </SectionContainer>

          <SectionContainer title="Grafico de vela" description="Open, High, Low e Close do lucro acumulado no periodo.">
            <MonthlyCandleChart data={candleSeries} mode={mode} hasData={hasDataInSelection} />
          </SectionContainer>

          <div className={styles.twoColumns}>
            <SectionContainer title="Evolucao do lucro" description="Ultimos 12 meses.">
              <GrowthLineChart data={lineSeries} />
            </SectionContainer>

            <SectionContainer title="Receita vs despesa" description="Comparativo do periodo selecionado.">
              <RevenueExpenseBarChart
                revenue={currentTotals.revenue}
                expense={currentTotals.expense}
                label={periodLabel}
              />
            </SectionContainer>
          </div>

          <SectionContainer title="Indicadores de saude" description="Metricas de performance operacional.">
            <HealthIndicators
              averageProfitLast3={formatCurrency(healthSnapshot.averageProfitLast3)}
              revenueGrowth={formatPercent(healthSnapshot.revenueGrowth)}
              expenseGrowth={formatPercent(healthSnapshot.expenseGrowth)}
              trend={healthSnapshot.trend}
              expenseGrowingFaster={
                healthSnapshot.expenseGrowingFaster === null ? 'N/D' : healthSnapshot.expenseGrowingFaster ? 'Sim' : 'Nao'
              }
            />
          </SectionContainer>

          <div className={styles.twoColumns}>
            <SectionContainer title="ROI e acumulado" description="Base para estrategia de investimento.">
              {businessSettingsFailed ? (
                <p className={styles.roiFallback}>Nao foi possivel carregar as configuracoes empresariais no momento.</p>
              ) : null}

              {investmentAmount === null ? (
                <div className={styles.roiAlert}>
                  <p>Configure o investimento inicial para calcular ROI.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.roiActionButton}
                    onClick={() => setIsCompanySettingsModalOpen(true)}
                  >
                    Configurar investimento
                  </Button>
                </div>
              ) : null}

              <RoiSection
                accumulatedProfit={formatCurrency(accumulatedProfit)}
                roi={formatPercent(roi)}
                investmentConfigured={investmentAmount !== null}
              />
            </SectionContainer>

            <SectionContainer title="Tendencia e direcao" description="Leitura rapida de aceleracao ou desaceleracao.">
              <TrendIndicators variation={profitVariation} trend={healthSnapshot.trend} />
            </SectionContainer>
          </div>
        </div>
      ) : null}

      <CompanySettingsModal
        open={isCompanySettingsModalOpen}
        initialSettings={businessSettings}
        onClose={() => setIsCompanySettingsModalOpen(false)}
        onSaved={(settings) => {
          setBusinessSettings(settings)
          setBusinessSettingsFailed(false)
        }}
      />

      <button
        type="button"
        className={styles.helpFloatingButton}
        onClick={() => setIsHelpPanelOpen((prev) => !prev)}
        aria-label="Abrir painel de ajuda da dashboard"
        aria-expanded={isHelpPanelOpen}
      >
        ?
      </button>
      <HelpPanel open={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} />
    </PageTemplate>
  )
}


