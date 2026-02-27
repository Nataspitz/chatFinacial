import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/react'
import { Report } from '../../src/pages/Report/Report'
import { financeService } from '../../src/services/finance.service'

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      user_metadata: {
        company_name: 'Empresa Teste'
      }
    }
  })
}))

jest.mock('../../src/services/finance.service', () => ({
  financeService: {
    saveTransaction: jest.fn(),
    getTransactions: jest.fn(),
    deleteTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    exportReportPdf: jest.fn(),
    getCategoryItems: jest.fn(),
    saveCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn()
  }
}))

const mockedSaveTransaction = jest.mocked(financeService.saveTransaction)
const mockedGetTransactions = jest.mocked(financeService.getTransactions)
const mockedDeleteTransaction = jest.mocked(financeService.deleteTransaction)
const mockedUpdateTransaction = jest.mocked(financeService.updateTransaction)
const mockedExportReportPdf = jest.mocked(financeService.exportReportPdf)
const mockedGetCategoryItems = jest.mocked(financeService.getCategoryItems)
const mockedSaveCategory = jest.mocked(financeService.saveCategory)
const mockedUpdateCategory = jest.mocked(financeService.updateCategory)
const mockedDeleteCategory = jest.mocked(financeService.deleteCategory)

const findSectionByTitle = (title: 'Entradas' | 'Saidas'): HTMLElement => {
  return screen.getByRole('heading', { name: title }).closest('section') as HTMLElement
}

const getCategoryDialog = (): HTMLElement => {
  return screen.getByRole('dialog', { name: 'Gerenciar categorias' })
}

describe('Report', () => {
  let categories: {
    entrada: Array<{ id: string; name: string; type: 'entrada' }>
    saida: Array<{ id: string; name: string; type: 'saida' }>
  }

  beforeEach(() => {
    categories = {
      entrada: [{ id: 'c1', name: 'Salario', type: 'entrada' }],
      saida: [{ id: 'c2', name: 'Mercado', type: 'saida' }]
    }

    mockedSaveTransaction.mockReset()
    mockedGetTransactions.mockReset()
    mockedDeleteTransaction.mockReset()
    mockedUpdateTransaction.mockReset()
    mockedExportReportPdf.mockReset()
    mockedGetCategoryItems.mockReset()
    mockedSaveCategory.mockReset()
    mockedUpdateCategory.mockReset()
    mockedDeleteCategory.mockReset()

    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 2000,
        category: 'Salario',
        description: 'Pagamento',
        date: '2026-02-20',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        amount: 120,
        category: 'Mercado',
        description: 'Compras',
        date: '2026-02-19',
        isMonthlyCost: true
      }
    ])

    mockedGetCategoryItems.mockImplementation(async (type?: 'entrada' | 'saida') => {
      if (type === 'entrada') {
        return categories.entrada
      }

      if (type === 'saida') {
        return categories.saida
      }

      return []
    })

    mockedSaveTransaction.mockResolvedValue(undefined)
    mockedDeleteTransaction.mockResolvedValue(undefined)
    mockedUpdateTransaction.mockResolvedValue(undefined)
    mockedExportReportPdf.mockResolvedValue({ canceled: false, filePath: 'C:\\tmp\\relatorio.pdf' })
    mockedSaveCategory.mockImplementation(async (name, type) => {
      const bucket = type === 'entrada' ? categories.entrada : categories.saida
      if (!bucket.some((item) => item.name === name)) {
        bucket.push({
          id: `${type}-${name.toLowerCase()}`,
          name,
          type
        })
      }
    })
    mockedUpdateCategory.mockImplementation(async (id, name, type) => {
      const bucket = type === 'entrada' ? categories.entrada : categories.saida
      const target = bucket.find((item) => item.id === id)
      if (target) {
        target.name = name
      }
    })
    mockedDeleteCategory.mockImplementation(async (id) => {
      categories.entrada = categories.entrada.filter((item) => item.id !== id)
      categories.saida = categories.saida.filter((item) => item.id !== id)
    })
  })

  it('carrega e renderiza entradas e saidas', async () => {
    render(<Report />)

    await waitFor(() => {
      expect(screen.getByText('Entradas')).toBeInTheDocument()
      expect(screen.getByText('Saidas')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Salario').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mercado').length).toBeGreaterThan(0)
  })

  it('apaga transacao', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    const entriesSection = findSectionByTitle('Entradas')
    await user.click(within(entriesSection).getByRole('button', { name: 'Apagar' }))

    await waitFor(() => {
      expect(mockedDeleteTransaction).toHaveBeenCalledWith('1')
    })
  })

  it('mostra feedback ao falhar ao apagar transacao', async () => {
    const user = userEvent.setup()
    mockedDeleteTransaction.mockRejectedValueOnce(new Error('delete error'))
    render(<Report />)

    await screen.findByText('Entradas')
    const entriesSection = findSectionByTitle('Entradas')
    await user.click(within(entriesSection).getByRole('button', { name: 'Apagar' }))

    await screen.findByText('Nao foi possivel apagar a transacao.')
  })

  it('edita categoria via select e salva transacao', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    const entriesSection = findSectionByTitle('Entradas')
    await user.click(within(entriesSection).getByRole('button', { name: 'Editar' }))

    const categorySelect = within(entriesSection).getAllByDisplayValue('Salario')[0]
    await user.selectOptions(categorySelect, 'Salario')

    await user.click(within(entriesSection).getAllByRole('button', { name: 'Salvar' })[0])

    await waitFor(() => {
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          category: 'Salario'
        })
      )
    })
  })

  it('mostra feedback de validacao ao editar com campos invalidos', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    const entriesSection = findSectionByTitle('Entradas')
    await user.click(within(entriesSection).getByRole('button', { name: 'Editar' }))

    const descriptionInput = within(entriesSection).getAllByDisplayValue('Pagamento')[0]
    await user.clear(descriptionInput)
    await user.click(within(entriesSection).getAllByRole('button', { name: 'Salvar' })[0])

    expect(screen.getByText('Preencha os campos da edicao com valores validos.')).toBeInTheDocument()
    expect(mockedUpdateTransaction).not.toHaveBeenCalled()
  })

  it('mostra feedback ao falhar edicao de transacao', async () => {
    const user = userEvent.setup()
    mockedUpdateTransaction.mockRejectedValueOnce(new Error('update error'))
    render(<Report />)

    await screen.findByText('Entradas')
    const entriesSection = findSectionByTitle('Entradas')
    await user.click(within(entriesSection).getByRole('button', { name: 'Editar' }))
    await user.click(within(entriesSection).getAllByRole('button', { name: 'Salvar' })[0])

    await screen.findByText('Nao foi possivel editar a transacao.')
  })

  it('mostra feedback de validacao ao criar transacao com valor invalido', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Nova transacao' }))
    await user.click(screen.getByRole('button', { name: 'Salvar transacao' }))

    expect(screen.getByText('Informe um valor valido maior que zero.')).toBeInTheDocument()
    expect(mockedSaveTransaction).not.toHaveBeenCalled()
  })

  it('cria transacao e fecha modal ao salvar com sucesso', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Nova transacao' }))

    await user.selectOptions(screen.getByLabelText('Tipo'), 'entrada')
    await user.clear(screen.getByLabelText('Valor'))
    await user.type(screen.getByLabelText('Valor'), '3500')
    await user.clear(screen.getByLabelText('Data'))
    await user.type(screen.getByLabelText('Data'), '2026-02-21')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Salario')
    await user.type(screen.getByLabelText('Descricao'), 'Bonus mensal')
    await user.click(screen.getByRole('button', { name: 'Salvar transacao' }))

    await waitFor(() => {
      expect(mockedSaveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'entrada',
          amount: 3500,
          date: '2026-02-21',
          category: 'Salario',
          description: 'Bonus mensal'
        })
      )
    })

    expect(mockedSaveCategory).toHaveBeenCalledWith('Salario', 'entrada')
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nova transacao' })).not.toBeInTheDocument()
    })
  })

  it('mostra feedback ao falhar exportacao', async () => {
    const user = userEvent.setup()
    mockedExportReportPdf.mockRejectedValueOnce(new Error('falha'))
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Exportar relatorio' }))
    await user.click(screen.getByRole('button', { name: 'Gerar PDF' }))

    await screen.findByText('Nao foi possivel exportar o relatorio em PDF.')
  })

  it('abre modal de exportacao e gera PDF', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Exportar relatorio' }))
    await user.clear(screen.getByLabelText('Nome do arquivo'))
    await user.type(screen.getByLabelText('Nome do arquivo'), 'fev_2026')
    await user.click(screen.getByRole('button', { name: 'Gerar PDF' }))

    await waitFor(() => {
      expect(mockedExportReportPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'fev_2026',
          companyName: 'Empresa Teste',
          entries: expect.any(Array),
          outcomes: expect.any(Array),
          dashboardMetrics: expect.any(Array)
        })
      )
    })
  })

  it('gera feedback de sucesso no CRUD de categorias', async () => {
    const user = userEvent.setup()
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Categorias' }))
    const categoryDialog = getCategoryDialog()
    await user.click(within(categoryDialog).getByRole('button', { name: 'Criar nova categoria' }))
    await user.type(within(categoryDialog).getByLabelText('Nova categoria'), 'Investimento')
    await user.click(within(categoryDialog).getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(mockedSaveCategory).toHaveBeenCalledWith('Investimento', 'saida')
    })

    await screen.findByText('Investimento')
    await user.click(within(categoryDialog).getAllByRole('button', { name: 'Editar' })[0])

    const editInput = within(categoryDialog).getByDisplayValue('Mercado')
    await user.clear(editInput)
    await user.type(editInput, 'Mercado geral')
    await user.click(within(categoryDialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(mockedUpdateCategory).toHaveBeenCalledWith('c2', 'Mercado geral', 'saida')
    })
    await screen.findByText('Categoria atualizada com sucesso.')

    await user.click(within(categoryDialog).getAllByRole('button', { name: 'Apagar' })[0])

    await waitFor(() => {
      expect(mockedDeleteCategory).toHaveBeenCalledWith('c2')
    })
    await screen.findByText('Categoria excluida com sucesso.')
  })

  it('mostra feedback de erro no CRUD de categorias', async () => {
    const user = userEvent.setup()
    mockedSaveCategory.mockRejectedValueOnce(new Error('save error'))
    mockedUpdateCategory.mockRejectedValueOnce(new Error('update error'))
    mockedDeleteCategory.mockRejectedValueOnce(new Error('delete error'))
    render(<Report />)

    await screen.findByText('Entradas')
    await user.click(screen.getByRole('button', { name: 'Categorias' }))
    const categoryDialog = getCategoryDialog()

    await user.click(within(categoryDialog).getByRole('button', { name: 'Criar nova categoria' }))
    await user.type(within(categoryDialog).getByLabelText('Nova categoria'), 'Falha')
    await user.click(within(categoryDialog).getByRole('button', { name: 'Adicionar' }))
    await screen.findByText('Nao foi possivel salvar a categoria.')

    await user.click(within(categoryDialog).getAllByRole('button', { name: 'Editar' })[0])
    const editInput = within(categoryDialog).getByDisplayValue('Mercado')
    await user.clear(editInput)
    await user.type(editInput, 'Mercado x')
    await user.click(within(categoryDialog).getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Nao foi possivel atualizar a categoria.')

    await user.click(within(categoryDialog).getByRole('button', { name: 'Cancelar' }))
    await user.click(within(categoryDialog).getAllByRole('button', { name: 'Apagar' })[0])
    await screen.findByText('Nao foi possivel excluir a categoria.')
  })
})
