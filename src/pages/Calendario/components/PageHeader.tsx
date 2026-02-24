import styles from '../Calendario.module.css'

export const PageHeader = (): JSX.Element => {
  return (
    <header className={styles.header}>
      <h1>Calendario Financeiro</h1>
      <p>Entradas e saídas somadas por dia.</p>
    </header>
  )
}
