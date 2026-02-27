import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { TimePoint } from '../../types'
import styles from './GrowthLineChart.module.css'

interface GrowthLineChartProps {
  data: TimePoint[]
}

export const GrowthLineChart = ({ data }: GrowthLineChartProps): JSX.Element => {
  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="profit" stroke="#3366ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
