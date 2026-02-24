import styles from '../Report.module.css'

interface ReportSummaryProps {
  totalEntries: number
  totalOutcomes: number
  formatCurrency: (value: number) => string
}

export const ReportSummary = ({ totalEntries, totalOutcomes, formatCurrency }: ReportSummaryProps): JSX.Element => {
  return (
    <div className={styles.summary}>
      <span>Soma de entradas: {formatCurrency(totalEntries)}</span>
      <span>Soma de saidas: {formatCurrency(totalOutcomes)}</span>
    </div>
  )
}
