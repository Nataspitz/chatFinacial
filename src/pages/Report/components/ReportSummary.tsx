import { SummaryMetric } from '../../../components/molecules/SummaryMetric/SummaryMetric'
import { SummaryList } from '../../../components/organisms/SummaryList/SummaryList'

interface ReportSummaryProps {
  totalEntries: number
  totalOutcomes: number
  formatCurrency: (value: number) => string
}

export const ReportSummary = ({ totalEntries, totalOutcomes, formatCurrency }: ReportSummaryProps): JSX.Element => {
  return (
    <SummaryList>
      <SummaryMetric label="Soma de entradas" value={formatCurrency(totalEntries)} />
      <SummaryMetric label="Soma de saidas" value={formatCurrency(totalOutcomes)} />
    </SummaryList>
  )
}
