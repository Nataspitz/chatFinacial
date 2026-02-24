import styles from '../Formulario.module.css'

export const PageHeader = (): JSX.Element => {
  return (
    <header className={styles.header}>
      <h1>Cadastro de Transacao</h1>
      <p>Formulario simples para registrar entrada ou saida.</p>
    </header>
  )
}
