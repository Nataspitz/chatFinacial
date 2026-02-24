import styles from '../Formulario.module.css'

interface CategoryFieldProps {
  value: string
  onChange: (value: string) => void
}

export const CategoryField = ({ value, onChange }: CategoryFieldProps): JSX.Element => {
  return (
    <label className={styles.field}>
      <span>Categoria</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex: Alimentacao"
      />
    </label>
  )
}
