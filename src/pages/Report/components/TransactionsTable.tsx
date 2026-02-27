import { useState } from 'react'
import { FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'
import { Button, ButtonLoading } from '../../../components/ui'
import { ContentCard } from '../../../components/organisms/ContentCard/ContentCard'
import type { Transaction } from '../../../types/transaction.types'
import styles from '../Report.module.css'

interface TransactionsTableProps {
  title: string
  transactions: Transaction[]
  categoryOptions: string[]
  onDelete: (id: string) => Promise<void>
  onEditStart: (transaction: Transaction) => void
  onEditCancel: () => void
  onEditChange: (field: 'date' | 'category' | 'description' | 'amount' | 'isMonthlyCost', value: string | boolean) => void
  onEditSave: () => Promise<void>
  deletingId: string | null
  editingId: string | null
  editingDraft: Transaction | null
  isSavingEdit: boolean
  formatCurrency: (value: number) => string
  formatDate: (value: string) => string
}

export const TransactionsTable = ({
  title,
  transactions,
  categoryOptions,
  onDelete,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSave,
  deletingId,
  editingId,
  editingDraft,
  isSavingEdit,
  formatCurrency,
  formatDate
}: TransactionsTableProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [mobileActionsId, setMobileActionsId] = useState<string | null>(null)

  const getCategorySelectOptions = (currentCategory: string): string[] => {
    const normalizedCurrent = currentCategory.trim()
    if (!normalizedCurrent) {
      return categoryOptions
    }

    return categoryOptions.includes(normalizedCurrent) ? categoryOptions : [normalizedCurrent, ...categoryOptions]
  }

  const getMonthlyCostValue = (transaction: Transaction, isEditing: boolean): JSX.Element | string => {
    if (isEditing && editingDraft) {
      if (editingDraft.type !== 'saida') {
        return '-'
      }

      return (
        <input
          type="checkbox"
          checked={editingDraft.isMonthlyCost}
          onChange={(event) => onEditChange('isMonthlyCost', event.target.checked)}
        />
      )
    }

    if (transaction.type !== 'saida') {
      return '-'
    }

    return transaction.isMonthlyCost ? 'Sim' : 'Nao'
  }

  const renderActions = (transaction: Transaction, isEditing: boolean): JSX.Element => {
    if (isEditing) {
      return (
        <div className={styles.actionsGroup}>
          <ButtonLoading
            type="button"
            variant="primary"
            className={styles.actionButton}
            loading={isSavingEdit}
            onClick={() => {
              void onEditSave()
            }}
          >
            Salvar
          </ButtonLoading>
          <Button
            type="button"
            variant="secondary"
            className={styles.actionButton}
            disabled={isSavingEdit}
            onClick={onEditCancel}
          >
            Cancelar
          </Button>
        </div>
      )
    }

    return (
      <div className={styles.actionsGroup}>
        <Button
          type="button"
          variant="secondary"
          className={styles.actionButton}
          disabled={deletingId === transaction.id}
          onClick={() => onEditStart(transaction)}
        >
          Editar
        </Button>
        <ButtonLoading
          type="button"
          variant="danger"
          className={styles.actionButton}
          loading={deletingId === transaction.id}
          onClick={() => {
            void onDelete(transaction.id)
          }}
        >
          Apagar
        </ButtonLoading>
      </div>
    )
  }

  return (
    <ContentCard className={styles.section}>
      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <h2 className={styles.sectionTitle}>{title}</h2>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {!isExpanded ? null : transactions.length === 0 ? (
        <p className={styles.empty}>Nenhuma transacao encontrada.</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colDate} />
                <col className={styles.colCategory} />
                <col className={styles.colDescription} />
                <col className={styles.colValue} />
                <col className={styles.colMonthlyCost} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Descricao</th>
                  <th>Valor</th>
                  <th>Custo mensal</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const isEditing = editingId === transaction.id && editingDraft !== null

                  return (
                    <tr key={transaction.id}>
                      <td>
                        {isEditing ? (
                          <input
                            type="date"
                            className={styles.cellInput}
                            value={editingDraft.date}
                            onChange={(event) => onEditChange('date', event.target.value)}
                          />
                        ) : (
                          formatDate(transaction.date)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className={styles.cellInput}
                            value={editingDraft.category}
                            onChange={(event) => onEditChange('category', event.target.value)}
                          >
                            {getCategorySelectOptions(editingDraft.category).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          transaction.category
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={editingDraft.description}
                            onChange={(event) => onEditChange('description', event.target.value)}
                          />
                        ) : (
                          transaction.description
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={styles.cellInput}
                            value={String(editingDraft.amount)}
                            onChange={(event) => onEditChange('amount', event.target.value)}
                          />
                        ) : (
                          formatCurrency(transaction.amount)
                        )}
                      </td>
                      <td>{getMonthlyCostValue(transaction, isEditing)}</td>
                      <td className={styles.actionsCell}>{renderActions(transaction, isEditing)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {transactions.map((transaction) => {
              const isEditing = editingId === transaction.id && editingDraft !== null

              return (
                <article key={transaction.id} className={styles.mobileItem}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Data</span>
                    <div className={styles.mobileValue}>
                      {isEditing ? (
                        <input
                          type="date"
                          className={styles.cellInput}
                          value={editingDraft.date}
                          onChange={(event) => onEditChange('date', event.target.value)}
                        />
                      ) : (
                        formatDate(transaction.date)
                      )}
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Categoria</span>
                    <div className={styles.mobileValue}>
                      {isEditing ? (
                        <select
                          className={styles.cellInput}
                          value={editingDraft.category}
                          onChange={(event) => onEditChange('category', event.target.value)}
                        >
                          {getCategorySelectOptions(editingDraft.category).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        transaction.category
                      )}
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Descricao</span>
                    <div className={styles.mobileValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.cellInput}
                          value={editingDraft.description}
                          onChange={(event) => onEditChange('description', event.target.value)}
                        />
                      ) : (
                        transaction.description
                      )}
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Valor</span>
                    <div className={styles.mobileValue}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={styles.cellInput}
                          value={String(editingDraft.amount)}
                          onChange={(event) => onEditChange('amount', event.target.value)}
                        />
                      ) : (
                        formatCurrency(transaction.amount)
                      )}
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Custo mensal</span>
                    <div className={styles.mobileValue}>{getMonthlyCostValue(transaction, isEditing)}</div>
                  </div>

                  {isEditing ? (
                    <div className={styles.mobileActions}>{renderActions(transaction, isEditing)}</div>
                  ) : (
                    <div className={styles.mobileActions}>
                      <button
                        type="button"
                        className={styles.mobileEditToggle}
                        aria-label="Mostrar acoes"
                        onClick={() => setMobileActionsId((prev) => (prev === transaction.id ? null : transaction.id))}
                      >
                        <FiEdit2 />
                      </button>
                      {mobileActionsId === transaction.id ? renderActions(transaction, false) : null}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}
    </ContentCard>
  )
}
