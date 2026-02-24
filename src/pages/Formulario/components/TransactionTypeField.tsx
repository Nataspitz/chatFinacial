import type { TransactionType } from '../../../types/transaction.types'
import styles from '../Formulario.module.css'

interface TransactionTypeFieldProps {
  value: TransactionType
  onChange: (value: TransactionType) => void
}

export const TransactionTypeField = ({ value, onChange }: TransactionTypeFieldProps): JSX.Element => {
  return (
    <label className={styles.field}>
      <span>Tipo</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TransactionType)}>
        <option value="entrada">Entrada</option>
        <option value="saida">Saida</option>
      </select>
    </label>
  )
}
