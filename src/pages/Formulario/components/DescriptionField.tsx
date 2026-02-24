import styles from '../Formulario.module.css'

interface DescriptionFieldProps {
  value: string
  onChange: (value: string) => void
}

export const DescriptionField = ({ value, onChange }: DescriptionFieldProps): JSX.Element => {
  return (
    <label className={styles.field}>
      <span>Descricao</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="Descreva a transacao"
      />
    </label>
  )
}
