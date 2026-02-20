import { useState, type FormEvent } from 'react'
import { financeService } from '../../services/finance.service'
import type { Transaction, TransactionType } from '../../types/transaction.types'
import styles from './Formulario.module.css'

type DateMode = 'today' | 'manual'

interface FormState {
  type: TransactionType
  amount: string
  category: string
  description: string
  manualDate: string
  isMonthlyCost: boolean
}

const getTodayDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialFormState: FormState = {
  type: 'saida',
  amount: '',
  category: '',
  description: '',
  manualDate: '',
  isMonthlyCost: false
}

export const Formulario = (): JSX.Element => {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [dateMode, setDateMode] = useState<DateMode>('today')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>('')

  const handleChange = (field: keyof FormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleTypeChange = (value: TransactionType): void => {
    setForm((prev) => ({
      ...prev,
      type: value,
      isMonthlyCost: value === 'saida' ? prev.isMonthlyCost : false
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const parsedAmount = Number(form.amount.replace(',', '.'))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback('Informe um valor valido maior que zero.')
      return
    }

    const date = dateMode === 'today' ? getTodayDate() : form.manualDate
    if (!date) {
      setFeedback('Informe a data da transacao.')
      return
    }

    const category = form.category.trim()
    if (!category) {
      setFeedback('Informe a categoria da transacao.')
      return
    }

    const description = form.description.trim()
    if (!description) {
      setFeedback('Informe a descricao da transacao.')
      return
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: form.type,
      amount: parsedAmount,
      date,
      category,
      description,
      isMonthlyCost: form.type === 'saida' ? form.isMonthlyCost : false
    }

    setIsSubmitting(true)

    try {
      await financeService.saveTransaction(transaction)
      setFeedback(`Transacao registrada com sucesso (${transaction.type}).`)
      setForm(initialFormState)
      setDateMode('today')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel registrar a transacao no momento.'
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Cadastro de Transacao</h1>
          <p>Formulario simples para registrar entrada ou saida.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Tipo</span>
            <select value={form.type} onChange={(event) => handleTypeChange(event.target.value as TransactionType)}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
          </label>

          {form.type === 'saida' && (
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={form.isMonthlyCost}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isMonthlyCost: event.target.checked
                  }))
                }
              />
              <span>Marcar como custo mensal</span>
            </label>
          )}

          <label className={styles.field}>
            <span>Valor</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) => handleChange('amount', event.target.value)}
              placeholder="0.00"
            />
          </label>

          <div className={styles.field}>
            <span>Data</span>
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={dateMode === 'today' ? styles.activeOption : styles.option}
                onClick={() => setDateMode('today')}
              >
                Hoje
              </button>
              <button
                type="button"
                className={dateMode === 'manual' ? styles.activeOption : styles.option}
                onClick={() => setDateMode('manual')}
              >
                Outra data
              </button>
            </div>
            {dateMode === 'today' ? (
              <small>Data usada: {getTodayDate()} (dispositivo)</small>
            ) : (
              <input
                type="date"
                value={form.manualDate}
                onChange={(event) => handleChange('manualDate', event.target.value)}
              />
            )}
          </div>

          <label className={styles.field}>
            <span>Categoria</span>
            <input
              type="text"
              value={form.category}
              onChange={(event) => handleChange('category', event.target.value)}
              placeholder="Ex: Alimentacao"
            />
          </label>

          <label className={styles.field}>
            <span>Descricao</span>
            <textarea
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              rows={4}
              placeholder="Descreva a transacao"
            />
          </label>

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar transacao'}
          </button>

          {feedback && <p className={styles.feedback}>{feedback}</p>}
        </form>
      </div>
    </section>
  )
}
