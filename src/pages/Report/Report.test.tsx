import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { Report } from './Report'
import { financeService } from '../../services/finance.service'

jest.mock('../../services/finance.service', () => ({
  financeService: {
    getTransactions: jest.fn(),
    deleteTransaction: jest.fn(),
    updateTransaction: jest.fn()
  }
}))

const mockedGetTransactions = jest.mocked(financeService.getTransactions)
const mockedDeleteTransaction = jest.mocked(financeService.deleteTransaction)
const mockedUpdateTransaction = jest.mocked(financeService.updateTransaction)

describe('Report', () => {
  beforeEach(() => {
    mockedGetTransactions.mockReset()
    mockedDeleteTransaction.mockReset()
    mockedUpdateTransaction.mockReset()
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

    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()
    expect(screen.getByText(/Soma de entradas:/i)).toBeInTheDocument()
    expect(screen.getByText(/Soma de saidas:/i)).toBeInTheDocument()
    expect(screen.getByText(/Resultado:/i)).toBeInTheDocument()
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
      expect(screen.getByText('Salario')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Apagar' }))

    await waitFor(() => {
      expect(mockedDeleteTransaction).toHaveBeenCalledWith('1')
    })

    expect(screen.queryByText('Salario')).not.toBeInTheDocument()
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
      expect(screen.getByText('Salario')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    const categoryInput = screen.getByDisplayValue('Salario')
    await user.clear(categoryInput)
    await user.type(categoryInput, 'Bonus')

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(mockedUpdateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', category: 'Bonus' })
      )
    })

    expect(screen.getByText('Bonus')).toBeInTheDocument()
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
      expect(screen.getByText('Salario')).toBeInTheDocument()
      expect(screen.getByText('Mercado')).toBeInTheDocument()
      expect(screen.getByText('Freela')).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText('Ano'), '2026')
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()
    expect(screen.queryByText('Freela')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Mes'), '02')
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Dia'), '20')
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.queryByText('Mercado')).not.toBeInTheDocument()
  })
})
