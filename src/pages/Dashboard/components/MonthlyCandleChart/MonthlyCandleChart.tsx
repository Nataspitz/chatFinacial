import type { ApexOptions } from 'apexcharts'
import Chart from 'react-apexcharts'
import { useEffect, useMemo, useState } from 'react'
import type { CandleDatum, DashboardViewMode } from '../../types'
import styles from './MonthlyCandleChart.module.css'

interface MonthlyCandleChartProps {
  data: CandleDatum[]
  mode: DashboardViewMode
  hasData: boolean
}

export const MonthlyCandleChart = ({ data, mode, hasData }: MonthlyCandleChartProps): JSX.Element => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const current = document.documentElement.getAttribute('data-theme')
    return current === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme')
      setThemeMode(current === 'dark' ? 'dark' : 'light')
    })

    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: 'candlestick',
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: true }
      },
      theme: {
        mode: themeMode
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: mode === 'annual' ? 'MMM' : 'dd/MM',
          style: {
            colors: themeMode === 'dark' ? '#cbd5e1' : '#4b5563'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => `R$ ${value.toFixed(0)}`,
          style: {
            colors: themeMode === 'dark' ? '#cbd5e1' : '#4b5563'
          }
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#16c784',
            downward: '#ef4444'
          }
        }
      },
      grid: {
        borderColor: themeMode === 'dark' ? '#1e293b' : '#d1d5db',
        strokeDashArray: 4
      },
      tooltip: {
        theme: themeMode,
        y: {
          formatter: (value) => `R$ ${Number(value).toFixed(2)}`
        }
      }
    }),
    [mode, themeMode]
  )

  if (!hasData) {
    return <p className={styles.empty}>Sem dados para montar grafico de vela neste periodo.</p>
  }

  return (
    <div className={styles.chartWrap}>
      <Chart options={options} series={[{ data }]} type="candlestick" height={320} />
    </div>
  )
}
