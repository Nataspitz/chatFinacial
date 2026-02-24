import styles from '../Calendario.module.css'

interface MonthSummaryProps {
  totalEntrada: number
  totalSaida: number
  formatCurrency: (value: number) => string
}

export const MonthSummary = ({ totalEntrada, totalSaida, formatCurrency }: MonthSummaryProps): JSX.Element => {
  return (
    <div className={styles.monthSummary}>
      <span>Entradas do mês: {formatCurrency(totalEntrada)}</span>
      <span>Saídas do mês: {formatCurrency(totalSaida)}</span>
    </div>
  )
}
