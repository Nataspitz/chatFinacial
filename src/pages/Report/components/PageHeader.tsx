import { Button, ButtonLoading } from '../../../components/ui'
import { PageIntro } from '../../../components/molecules/PageIntro/PageIntro'
import styles from '../Report.module.css'

interface PageHeaderProps {
  onCreate: () => void
  onExport: () => void
  isExporting: boolean
  disabled: boolean
}

export const PageHeader = ({ onCreate, onExport, isExporting, disabled }: PageHeaderProps): JSX.Element => {
  return (
    <PageIntro
      title="Relatorio"
      description="Visualizacao de transacoes por conta."
      action={
        <div className={styles.headerActions}>
          <Button type="button" variant="secondary" className={styles.addButton} onClick={onCreate}>
            Nova transacao
          </Button>
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
        </div>
      }
    />
  )
}
