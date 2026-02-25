import { PageIntro } from '../../components/molecules/PageIntro/PageIntro'
import { PageTemplate } from '../../components/templates/PageTemplate/PageTemplate'
import styles from './Formulario.module.css'

export const Formulario = (): JSX.Element => {
  return (
    <PageTemplate width="narrow" className={styles.page}>
      <div className={styles.container}>
        <PageIntro title="Dashboard" description="Sem conteudo nesta pagina." />
      </div>
    </PageTemplate>
  )
}
