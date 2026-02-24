import { Button } from '../../../components/ui'
import styles from '../Formulario.module.css'

type DateMode = 'today' | 'manual'

interface DateFieldProps {
  dateMode: DateMode
  manualDate: string
  todayDate: string
  onModeChange: (mode: DateMode) => void
  onManualDateChange: (value: string) => void
}

export const DateField = ({
  dateMode,
  manualDate,
  todayDate,
  onModeChange,
  onManualDateChange
}: DateFieldProps): JSX.Element => {
  return (
    <div className={styles.field}>
      <span>Data</span>
      <div className={styles.inlineActions}>
        <Button
          type="button"
          variant={dateMode === 'today' ? 'primary' : 'secondary'}
          className={styles.toggleButton}
          onClick={() => onModeChange('today')}
        >
          Hoje
        </Button>
        <Button
          type="button"
          variant={dateMode === 'manual' ? 'primary' : 'secondary'}
          className={styles.toggleButton}
          onClick={() => onModeChange('manual')}
        >
          Outra data
        </Button>
      </div>
      {dateMode === 'today' ? (
        <small>Data usada: {todayDate} (dispositivo)</small>
      ) : (
        <input type="date" value={manualDate} onChange={(event) => onManualDateChange(event.target.value)} />
      )}
    </div>
  )
}
