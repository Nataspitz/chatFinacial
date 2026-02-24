import styles from '../Formulario.module.css'

interface AmountFieldProps {
  value: string
  onChange: (value: string) => void
}

export const AmountField = ({ value, onChange }: AmountFieldProps): JSX.Element => {
  return (
    <label className={styles.field}>
      <span>Valor</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.00"
      />
    </label>
  )
}
