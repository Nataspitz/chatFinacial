import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { financeService } from '../../services/finance.service'
import type { Transaction } from '../../types/transaction.types'
import styles from './Calendario.module.css'

interface DayTotals {
  entrada: number
  saida: number
}

interface CalendarCell {
  key: string
  date: Date
  isCurrentMonth: boolean
  totals: DayTotals
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatMonthTitle = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long'
  }).format(date)
}

const toDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeTransactionDate = (value: string): string | null => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

const getAvailableYears = (transactions: Transaction[], currentYear: number): number[] => {
  const years = transactions
    .map((transaction) => normalizeTransactionDate(transaction.date))
    .filter((date): date is string => Boolean(date))
    .map((date) => Number(date.slice(0, 4)))
    .filter((year) => Number.isInteger(year))

  if (years.length === 0) {
    return [currentYear]
  }

  const minYear = Math.min(...years)
  const maxYear = Math.max(currentYear, ...years)
  const result: number[] = []

  for (let year = maxYear; year >= minYear; year -= 1) {
    result.push(year)
  }

  return result
}

const buildDailyTotalsMap = (transactions: Transaction[], monthDate: Date): Record<string, DayTotals> => {
  const map: Record<string, DayTotals> = {}
  const monthYear = monthDate.getFullYear()
  const monthIndex = monthDate.getMonth()
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate()

  transactions.forEach((transaction) => {
    const normalizedDate = normalizeTransactionDate(transaction.date)
    if (!normalizedDate) {
      return
    }

    const [year, month, day] = normalizedDate.split('-').map(Number)

    const isMonthlyCost = transaction.type === 'saida' && transaction.isMonthlyCost

    if (isMonthlyCost) {
      if (day > daysInMonth) {
        return
      }

      const recurringKey = toDateKey(new Date(monthYear, monthIndex, day))
      if (!map[recurringKey]) {
        map[recurringKey] = { entrada: 0, saida: 0 }
      }
      map[recurringKey].saida += transaction.amount
      return
    }

    const isSameMonth = year === monthYear && month === monthIndex + 1
    if (!isSameMonth) {
      return
    }

    const key = normalizedDate
    if (!map[key]) {
      map[key] = { entrada: 0, saida: 0 }
    }

    if (transaction.type === 'entrada') {
      map[key].entrada += transaction.amount
    } else {
      map[key].saida += transaction.amount
    }
  })

  return map
}

const buildCalendarCells = (monthDate: Date, totalsMap: Record<string, DayTotals>): CalendarCell[] => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const startDate = new Date(year, month, 1 - startOffset)

  const cells: CalendarCell[] = []

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(startDate)
    cellDate.setDate(startDate.getDate() + i)

    const key = toDateKey(cellDate)
    cells.push({
      key,
      date: cellDate,
      isCurrentMonth: cellDate.getMonth() === month,
      totals: totalsMap[key] ?? { entrada: 0, saida: 0 }
    })
  }

  return cells
}

export const Calendario = (): JSX.Element => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const todayKey = toDateKey(new Date())

  useEffect(() => {
    void (async () => {
      try {
        const data = await financeService.getTransactions()
        setTransactions(data)
      } catch {
        setError('Nao foi possivel carregar os dados do calendario.')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const totalsMap = useMemo(() => buildDailyTotalsMap(transactions, currentMonth), [transactions, currentMonth])
  const cells = useMemo(() => buildCalendarCells(currentMonth, totalsMap), [currentMonth, totalsMap])
  const availableYears = useMemo(() => getAvailableYears(transactions, new Date().getFullYear()), [transactions])

  const monthTotalEntrada = useMemo(() => {
    return cells
      .filter((cell) => cell.isCurrentMonth)
      .reduce((acc, cell) => acc + cell.totals.entrada, 0)
  }, [cells])

  const monthTotalSaida = useMemo(() => {
    return cells
      .filter((cell) => cell.isCurrentMonth)
      .reduce((acc, cell) => acc + cell.totals.saida, 0)
  }, [cells])

  const goToPreviousMonth = (): void => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = (): void => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const onYearChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedYear = Number(event.target.value)
    if (Number.isNaN(selectedYear)) {
      return
    }
    setCurrentMonth((prev) => new Date(selectedYear, prev.getMonth(), 1))
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Calendario Financeiro</h1>
        <p>Entradas e saídas somadas por dia.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <button type="button" onClick={goToPreviousMonth} aria-label="Mês anterior">
            {'<'}
          </button>
          <strong className={styles.monthTitle}>{formatMonthTitle(currentMonth)}</strong>
          <button type="button" onClick={goToNextMonth} aria-label="Próximo mês">
            {'>'}
          </button>
        </div>
        <select
          className={styles.yearSelect}
          aria-label="Ano"
          value={currentMonth.getFullYear()}
          onChange={onYearChange}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.monthSummary}>
        <span>Entradas do mês: {formatCurrency(monthTotalEntrada)}</span>
        <span>Saídas do mês: {formatCurrency(monthTotalSaida)}</span>
      </div>

      {isLoading && <p>Carregando calendário...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && (
        <div className={styles.calendar}>
          {WEEK_DAYS.map((day) => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}

          {cells.map((cell) => (
            <article
              key={cell.key}
              data-date={cell.key}
              className={[
                cell.isCurrentMonth ? styles.dayCell : styles.dayCellMuted,
                cell.key === todayKey ? styles.todayCell : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.dayNumber}>{cell.date.getDate()}</span>
              {cell.totals.entrada > 0 && (
                <span className={styles.entrada}>Entradas: {formatCurrency(cell.totals.entrada)}</span>
              )}
              {cell.totals.saida > 0 && <span className={styles.saida}>Saídas: {formatCurrency(cell.totals.saida)}</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}


