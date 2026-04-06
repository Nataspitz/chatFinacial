import { useState } from 'react'
import { FiChevronDown, FiChevronUp, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { Button, ButtonLoading } from '../../../components/ui'
import { ContentCard } from '../../../components/organisms/ContentCard/ContentCard'
import type { Transaction } from '../../../types/transaction.types'
import styles from '../Report.module.css'

interface TransactionsTableProps {
  title: string
  totalLabel: string
  totalTone?: 'entrada' | 'saida' | 'neutral'
  transactions: Transaction[]
  emptyMessage?: string
  categoryOptions: string[]
  onDelete: (id: string) => Promise<void>
  onEditStart: (transaction: Transaction) => void
  onEditCancel: () => void
  onEditChange: (
    field: 'date' | 'category' | 'description' | 'amount' | 'isConfirmed' | 'isMonthlyCost' | 'paymentMethod',
    value: string | boolean
  ) => void
  onEditSave: () => Promise<void>
  deletingId: string | null
  editingId: string | null
  editingDraft: Transaction | null
  isSavingEdit: boolean
  formatCurrency: (value: number) => string
  formatDate: (value: string) => string
  variant?: 'default' | 'future'
}

export const TransactionsTable = ({
  title,
  totalLabel,
  totalTone = 'neutral',
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
  formatDate,
  emptyMessage = 'Nenhuma transacao encontrada.',
  variant = 'default'
}: TransactionsTableProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null)

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

  const getConfirmedValue = (transaction: Transaction, isEditing: boolean): JSX.Element | string => {
    if (isEditing && editingDraft) {
      return (
        <input
          type="checkbox"
          checked={editingDraft.isConfirmed}
          onChange={(event) => onEditChange('isConfirmed', event.target.checked)}
        />
      )
    }

    return transaction.isConfirmed ? 'Sim' : 'Nao'
  }

  const formatPaymentMethod = (value: Transaction['paymentMethod']): string => {
    if (value === 'credito') return 'Credito'
    if (value === 'debito') return 'Debito'
    if (value === 'dinheiro') return 'Dinheiro'
    return 'Pix'
  }

  const renderActions = (transaction: Transaction, isEditing: boolean, isMobile = false): JSX.Element => {
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

    if (isMobile) {
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
      <div className={styles.actionsGroup}>
        <Button
          type="button"
          variant="secondary"
          className={styles.iconActionButton}
          disabled={deletingId === transaction.id}
          aria-label="Editar transacao"
          title="Editar transacao"
          onClick={() => onEditStart(transaction)}
        >
          <FiEdit2 />
        </Button>
        <ButtonLoading
          type="button"
          variant="danger"
          className={styles.iconActionButton}
          loading={deletingId === transaction.id}
          aria-label="Apagar transacao"
          title="Apagar transacao"
          onClick={() => {
            void onDelete(transaction.id)
          }}
        >
          <FiTrash2 />
        </ButtonLoading>
      </div>
    )
  }

  return (
    <ContentCard className={`${styles.section} ${variant === 'future' ? styles.sectionFuture : ''}`.trim()}>
      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <strong
            className={`${styles.sectionTotal} ${
              totalTone === 'entrada'
                ? styles.sectionTotalEntrada
                : totalTone === 'saida'
                  ? styles.sectionTotalSaida
                  : ''
            }`.trim()}
          >
            {totalLabel}
          </strong>
        </div>
        <span className={styles.sectionToggleIcon}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
      </button>

      {!isExpanded ? null : transactions.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colDate} />
                <col className={styles.colCategory} />
                <col className={styles.colDescription} />
                <col className={styles.colValue} />
                <col className={styles.colPaymentMethod} />
                <col className={styles.colInstallment} />
                <col className={styles.colConfirmed} />
                <col className={styles.colMonthlyCost} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Descricao</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Parcela</th>
                  <th>Confirmado</th>
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
                      <td>
                        {isEditing ? (
                          <select
                            className={styles.cellInput}
                            value={editingDraft.paymentMethod}
                            onChange={(event) => onEditChange('paymentMethod', event.target.value)}
                          >
                            <option value="pix">Pix</option>
                            <option value="debito">Debito</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="credito">Credito</option>
                          </select>
                        ) : (
                          formatPaymentMethod(transaction.paymentMethod)
                        )}
                      </td>
                      <td>{transaction.installmentCount > 1 ? `${transaction.installmentNumber}/${transaction.installmentCount}` : '-'}</td>
                      <td>{getConfirmedValue(transaction, isEditing)}</td>
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
              const isMobileExpanded = mobileExpandedId === transaction.id

              return (
                <article key={transaction.id} className={styles.mobileItem}>
                  {isEditing ? (
                    <>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Data</span>
                        <div className={styles.mobileValue}>
                          <input
                            type="date"
                            className={styles.cellInput}
                            value={editingDraft.date}
                            onChange={(event) => onEditChange('date', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Nome</span>
                        <div className={styles.mobileValue}>
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
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Descricao</span>
                        <div className={styles.mobileValue}>
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={editingDraft.description}
                            onChange={(event) => onEditChange('description', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Valor</span>
                        <div className={styles.mobileValue}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={styles.cellInput}
                            value={String(editingDraft.amount)}
                            onChange={(event) => onEditChange('amount', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Pagamento</span>
                        <div className={styles.mobileValue}>
                          <select
                            className={styles.cellInput}
                            value={editingDraft.paymentMethod}
                            onChange={(event) => onEditChange('paymentMethod', event.target.value)}
                          >
                            <option value="pix">Pix</option>
                            <option value="debito">Debito</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="credito">Credito</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Parcela</span>
                        <div className={styles.mobileValue}>
                          {transaction.installmentCount > 1 ? `${transaction.installmentNumber}/${transaction.installmentCount}` : '-'}
                        </div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Confirmado</span>
                        <div className={styles.mobileValue}>{getConfirmedValue(transaction, isEditing)}</div>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Custo mensal</span>
                        <div className={styles.mobileValue}>{getMonthlyCostValue(transaction, isEditing)}</div>
                      </div>
                      <div className={styles.mobileActions}>{renderActions(transaction, isEditing, true)}</div>
                    </>
                  ) : (
                    <>
                      <div className={styles.mobileSummaryRow}>
                        <div className={styles.mobileSummaryItem}>
                          <span className={styles.mobileLabel}>Data</span>
                          <div className={styles.mobileValue}>{formatDate(transaction.date)}</div>
                        </div>
                        <div className={styles.mobileSummaryItem}>
                          <span className={styles.mobileLabel}>Nome</span>
                          <div className={styles.mobileValue}>{transaction.category}</div>
                        </div>
                        <div className={styles.mobileSummaryItem}>
                          <span className={styles.mobileLabel}>Valor</span>
                          <div className={styles.mobileValue}>{formatCurrency(transaction.amount)}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.mobileReadMoreButton}
                        onClick={() => setMobileExpandedId((prev) => (prev === transaction.id ? null : transaction.id))}
                      >
                        <span>{isMobileExpanded ? 'Ler menos' : 'Ler mais'}</span>
                        {isMobileExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </button>

                      <div
                        className={`${styles.mobileExpandedDetails} ${isMobileExpanded ? styles.mobileExpandedDetailsOpen : ''}`.trim()}
                        aria-hidden={!isMobileExpanded}
                      >
                        <div className={styles.mobileExpandedDetailsInner}>
                          <div className={styles.mobileRow}>
                            <span className={styles.mobileLabel}>Descricao</span>
                            <div className={styles.mobileValue}>{transaction.description}</div>
                          </div>
                          <div className={styles.mobileRow}>
                            <span className={styles.mobileLabel}>Pagamento</span>
                            <div className={styles.mobileValue}>{formatPaymentMethod(transaction.paymentMethod)}</div>
                          </div>
                          <div className={styles.mobileRow}>
                            <span className={styles.mobileLabel}>Parcela</span>
                            <div className={styles.mobileValue}>
                              {transaction.installmentCount > 1
                                ? `${transaction.installmentNumber}/${transaction.installmentCount}`
                                : '-'}
                            </div>
                          </div>
                          <div className={styles.mobileRow}>
                            <span className={styles.mobileLabel}>Confirmado</span>
                            <div className={styles.mobileValue}>{transaction.isConfirmed ? 'Sim' : 'Nao'}</div>
                          </div>
                          <div className={styles.mobileRow}>
                            <span className={styles.mobileLabel}>Custo mensal</span>
                            <div className={styles.mobileValue}>
                              {transaction.type === 'saida' ? (transaction.isMonthlyCost ? 'Sim' : 'Nao') : '-'}
                            </div>
                          </div>
                          <div className={styles.mobileActions}>{renderActions(transaction, false, true)}</div>
                        </div>
                      </div>
                    </>
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
