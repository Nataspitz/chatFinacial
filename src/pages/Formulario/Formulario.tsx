import { useState, type FormEvent } from 'react'
import { financeService } from '../../services/finance.service'
import type { Transaction, TransactionType } from '../../types/transaction.types'
import { AmountField } from './components/AmountField'
import { CategoryField } from './components/CategoryField'
import { DateField } from './components/DateField'
import { DescriptionField } from './components/DescriptionField'
import { MonthlyCostField } from './components/MonthlyCostField'
import { PageHeader } from './components/PageHeader'
import { SubmitAction } from './components/SubmitAction'
import { TransactionTypeField } from './components/TransactionTypeField'
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
        <PageHeader />

        <form className={styles.form} onSubmit={handleSubmit}>
          <TransactionTypeField value={form.type} onChange={handleTypeChange} />

          {form.type === 'saida' && (
            <MonthlyCostField
              checked={form.isMonthlyCost}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  isMonthlyCost: checked
                }))
              }
            />
          )}

          <AmountField value={form.amount} onChange={(value) => handleChange('amount', value)} />

          <DateField
            dateMode={dateMode}
            manualDate={form.manualDate}
            todayDate={getTodayDate()}
            onModeChange={setDateMode}
            onManualDateChange={(value) => handleChange('manualDate', value)}
          />

          <CategoryField value={form.category} onChange={(value) => handleChange('category', value)} />
          <DescriptionField value={form.description} onChange={(value) => handleChange('description', value)} />

          <SubmitAction isSubmitting={isSubmitting} />

          {feedback && <p className={styles.feedback}>{feedback}</p>}
        </form>
      </div>
    </section>
  )
}
