import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { Report } from '../../../src/pages/Report/Report'
import { financeService } from '../../../src/services/finance.service'

jest.mock('../../../src/services/finance.service', () => ({
  financeService: {
    getTransactions: jest.fn(),
    deleteTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    exportReportPdf: jest.fn()
  }
}))

const mockedGetTransactions = jest.mocked(financeService.getTransactions)
const mockedDeleteTransaction = jest.mocked(financeService.deleteTransaction)
const mockedUpdateTransaction = jest.mocked(financeService.updateTransaction)
const mockedExportReportPdf = jest.mocked(financeService.exportReportPdf)

const expectTextVisible = (text: string | RegExp) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0)
}

const expectTextHidden = (text: string | RegExp) => {
  expect(screen.queryAllByText(text)).toHaveLength(0)
}

describe('Report', () => {
  beforeEach(() => {
    mockedGetTransactions.mockReset()
    mockedDeleteTransaction.mockReset()
    mockedUpdateTransaction.mockReset()
    mockedExportReportPdf.mockReset()
  })

  it('deve carregar e separar entradas e saidas', async () => {
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

    render(<Report />)

    expect(screen.getByText('Carregando transacoes...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Entradas')).toBeInTheDocument()
      expect(screen.getByText('Saidas')).toBeInTheDocument()
    })

    expectTextVisible('Salario')
    expectTextVisible('Mercado')
    expectTextVisible(/Soma de entradas:/i)
    expectTextVisible(/Soma de saidas:/i)
    expectTextVisible(/Resultado:/i)
  })

  it('deve mostrar erro quando falhar no carregamento', async () => {
    mockedGetTransactions.mockRejectedValue(new Error('falha'))

    render(<Report />)

    await waitFor(() => {
      expect(screen.getByText('Nao foi possivel carregar as transacoes.')).toBeInTheDocument()
    })
  })

  it('deve apagar transacao ao clicar em apagar', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 2000,
        category: 'Salario',
        description: 'Pagamento',
        date: '2026-02-20',
        isMonthlyCost: false
      }
    ])
    mockedDeleteTransaction.mockResolvedValue(undefined)

    render(<Report />)
    const user = userEvent.setup()

    await waitFor(() => {
      expectTextVisible('Salario')
    })

    await user.click(screen.getByRole('button', { name: 'Apagar' }))

    await waitFor(() => {
      expect(mockedDeleteTransaction).toHaveBeenCalledWith('1')
    })

    expectTextHidden('Salario')
  })

  it('deve editar transacao ao clicar em editar e salvar', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 2000,
        category: 'Salario',
        description: 'Pagamento',
        date: '2026-02-20',
        isMonthlyCost: false
      }
    ])
    mockedUpdateTransaction.mockResolvedValue(undefined)

    render(<Report />)
    const user = userEvent.setup()

    await waitFor(() => {
      expectTextVisible('Salario')
    })

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const [categoryInput] = screen.getAllByDisplayValue('Salario')
    await user.clear(categoryInput)
    await user.type(categoryInput, 'Bonus')

    const [saveButton] = screen.getAllByRole('button', { name: 'Salvar' })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', category: 'Bonus' })
      )
    })

    expectTextVisible('Bonus')
  })

  it('deve filtrar transacoes por ano, mes e dia', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 1500,
        category: 'Salario',
        description: 'Pagamento',
        date: '2026-02-20',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        amount: 100,
        category: 'Mercado',
        description: 'Compras',
        date: '2026-02-21',
        isMonthlyCost: false
      },
      {
        id: '3',
        type: 'entrada',
        amount: 300,
        category: 'Freela',
        description: 'Projeto',
        date: '2025-01-20',
        isMonthlyCost: false
      }
    ])

    render(<Report />)
    const user = userEvent.setup()

    await waitFor(() => {
      expectTextVisible('Salario')
      expectTextVisible('Mercado')
      expectTextVisible('Freela')
    })

    await user.selectOptions(screen.getByLabelText('Ano'), '2026')
    expectTextVisible('Salario')
    expectTextVisible('Mercado')
    expectTextHidden('Freela')

    await user.selectOptions(screen.getByLabelText('Mes'), '02')
    expectTextVisible('Salario')
    expectTextVisible('Mercado')

    await user.selectOptions(screen.getByLabelText('Dia'), '20')
    expectTextVisible('Salario')
    expectTextHidden('Mercado')
  })

  it('deve exportar PDF com o periodo filtrado', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 1000,
        category: 'Salario',
        description: 'Pagamento',
        date: '2026-02-20',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        amount: 200,
        category: 'Mercado',
        description: 'Compras',
        date: '2026-02-20',
        isMonthlyCost: false
      }
    ])
    mockedExportReportPdf.mockResolvedValue({ canceled: false, filePath: 'C:\\tmp\\relatorio.pdf' })

    render(<Report />)
    const user = userEvent.setup()

    await waitFor(() => {
      expectTextVisible('Salario')
    })

    await user.selectOptions(screen.getByLabelText('Ano'), '2026')
    await user.selectOptions(screen.getByLabelText('Mes'), '02')
    await user.selectOptions(screen.getByLabelText('Dia'), '20')
    await user.click(screen.getByRole('button', { name: 'Exportar relatorio' }))

    await waitFor(() => {
      expect(mockedExportReportPdf).toHaveBeenCalledTimes(1)
      expect(mockedExportReportPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          periodLabel: expect.stringContaining('Ano: 2026'),
          totalEntries: 1000,
          totalOutcomes: 200,
          resultBalance: 800
        })
      )
    })
  })

  it('deve considerar saida com custo mensal em meses posteriores', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'saida',
        amount: 300,
        category: 'Aluguel',
        description: 'Moradia',
        date: '2026-01-10',
        isMonthlyCost: true
      },
      {
        id: '2',
        type: 'saida',
        amount: 80,
        category: 'Internet',
        description: 'Plano',
        date: '2026-01-10',
        isMonthlyCost: false
      }
    ])

    render(<Report />)
    const user = userEvent.setup()

    await waitFor(() => {
      expectTextVisible('Aluguel')
      expectTextVisible('Internet')
    })

    await user.selectOptions(screen.getByLabelText('Ano'), '2026')
    await user.selectOptions(screen.getByLabelText('Mes'), '02')
    await user.selectOptions(screen.getByLabelText('Dia'), '10')

    expectTextVisible('Aluguel')
    expectTextHidden('Internet')
  })
})


