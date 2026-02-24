import { Button, ButtonLoading } from '../../../components/ui'
import type { Transaction } from '../../../types/transaction.types'
import styles from '../Report.module.css'

interface TransactionsTableProps {
  title: string
  transactions: Transaction[]
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
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {transactions.length === 0 ? (
        <p className={styles.empty}>Nenhuma transacao encontrada.</p>
      ) : (
        <table className={styles.table}>
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
                      <input
                        type="text"
                        className={styles.cellInput}
                        value={editingDraft.category}
                        onChange={(event) => onEditChange('category', event.target.value)}
                      />
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
                      editingDraft.type === 'saida' ? (
                        <input
                          type="checkbox"
                          checked={editingDraft.isMonthlyCost}
                          onChange={(event) => onEditChange('isMonthlyCost', event.target.checked)}
                        />
                      ) : (
                        <span>-</span>
                      )
                    ) : transaction.type === 'saida' ? (
                      transaction.isMonthlyCost ? 'Sim' : 'Nao'
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    {isEditing ? (
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
                    ) : (
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
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
