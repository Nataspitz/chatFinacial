import { ButtonLoading } from '../../../components/ui'
import styles from '../Report.module.css'

interface PageHeaderProps {
  onExport: () => void
  isExporting: boolean
  disabled: boolean
}

export const PageHeader = ({ onExport, isExporting, disabled }: PageHeaderProps): JSX.Element => {
  return (
    <header className={styles.headerRow}>
      <div className={styles.header}>
        <h1>Relatorio</h1>
        <p>Visualizacao de transacoes salvas localmente.</p>
      </div>
      <ButtonLoading
        type="button"
        variant="primary"
        className={styles.exportButton}
        loading={isExporting}
        disabled={disabled}
        onClick={onExport}
      >
        Exportar relatorio
      </ButtonLoading>
    </header>
  )
}
