import styles from './DashboardFilters.module.css'
import type { DashboardViewMode } from '../../types'

interface DashboardFiltersProps {
  selectedYear: number
  selectedMonth: number
  mode: DashboardViewMode
  years: number[]
  onYearChange: (value: number) => void
  onMonthChange: (value: number) => void
  onModeChange: (value: DashboardViewMode) => void
}

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' }
]

export const DashboardFilters = ({
  selectedYear,
  selectedMonth,
  mode,
  years,
  onYearChange,
  onMonthChange,
  onModeChange
}: DashboardFiltersProps): JSX.Element => {
  return (
    <section className={styles.filters} aria-label="Filtros da dashboard">
      <label className={styles.field}>
        <span>Ano</span>
        <select value={selectedYear} onChange={(event) => onYearChange(Number(event.target.value))}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Mes</span>
        <select
          value={selectedMonth}
          disabled={mode === 'annual'}
          onChange={(event) => onMonthChange(Number(event.target.value))}
        >
          {MONTH_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.modeToggle} role="group" aria-label="Modo de visualizacao">
        <button
          type="button"
          className={mode === 'monthly' ? `${styles.modeButton} ${styles.active}` : styles.modeButton}
          onClick={() => onModeChange('monthly')}
        >
          Visao mensal
        </button>
        <button
          type="button"
          className={mode === 'annual' ? `${styles.modeButton} ${styles.active}` : styles.modeButton}
          onClick={() => onModeChange('annual')}
        >
          Visao anual
        </button>
      </div>
    </section>
  )
}
