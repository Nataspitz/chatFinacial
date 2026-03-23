import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../../src/pages/Dashboard/Dashboard'
import { businessService } from '../../src/services/business.service'
import { financeService } from '../../src/services/finance.service'

jest.mock('../../src/services/finance.service', () => ({
  financeService: {
    getTransactions: jest.fn()
  }
}))

jest.mock('../../src/services/business.service', () => ({
  businessService: {
    getBusinessSettings: jest.fn()
  }
}))

jest.mock('../../src/pages/Dashboard/components/MonthlyCandleChart/MonthlyCandleChart', () => ({
  MonthlyCandleChart: () => <div data-testid="monthly-candle-chart" />
}))

jest.mock('../../src/pages/Dashboard/components/GrowthLineChart/GrowthLineChart', () => ({
  GrowthLineChart: () => <div data-testid="growth-line-chart" />
}))

jest.mock('../../src/pages/Dashboard/components/RevenueExpenseBarChart/RevenueExpenseBarChart', () => ({
  RevenueExpenseBarChart: () => <div data-testid="revenue-expense-chart" />
}))

const mockedGetTransactions = jest.mocked(financeService.getTransactions)
const mockedGetBusinessSettings = jest.mocked(businessService.getBusinessSettings)

describe('Dashboard', () => {
  beforeEach(() => {
    mockedGetTransactions.mockReset()
    mockedGetBusinessSettings.mockReset()
    jest.useRealTimers()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(min-width: 901px)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn()
      })
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renderiza estado vazio quando nao ha transacoes', async () => {
    mockedGetTransactions.mockResolvedValue([])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Nenhuma transacao encontrada')
    expect(screen.getByText('Registre transacoes para visualizar crescimento, margem, ROI e tendencias.')).toBeInTheDocument()
  })

  it('abre e fecha painel de ajuda flutuante', async () => {
    mockedGetTransactions.mockResolvedValue([])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))
    const user = userEvent.setup()

    render(<Dashboard />)

    await screen.findByText('Nenhuma transacao encontrada')
    await user.click(screen.getByRole('button', { name: 'Abrir painel de ajuda da dashboard' }))
    expect(screen.getByRole('dialog', { name: 'Ajuda da dashboard' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog', { name: 'Ajuda da dashboard' })).not.toBeInTheDocument()
  })

  it('mostra feedback de erro quando falha ao carregar dados', async () => {
    mockedGetTransactions.mockRejectedValue(new Error('network'))
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Nao foi possivel carregar os dados da dashboard.')
  })

  it('inicia na visao mensal do mes atual e ignora transacoes futuras no lucro liquido', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-20T12:00:00-03:00'))

    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        category: 'Vendas',
        amount: 1000,
        description: 'Receita realizada',
        date: '2026-03-05',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        category: 'Operacao',
        amount: 200,
        description: 'Despesa realizada',
        date: '2026-03-10',
        isMonthlyCost: false
      },
      {
        id: '3',
        type: 'entrada',
        category: 'Vendas',
        amount: 500,
        description: 'Receita futura',
        date: '2026-03-25',
        isMonthlyCost: false
      },
      {
        id: '4',
        type: 'saida',
        category: 'Operacao',
        amount: 100,
        description: 'Despesa futura',
        date: '2026-03-28',
        isMonthlyCost: false
      }
    ])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Resumo executivo')

    const modeButtons = screen.getAllByRole('button', { name: /Visao/ })
    expect(modeButtons[0]).toHaveClass('active')

    expect(screen.getByLabelText('Ano')).toHaveValue('2026')
    expect(screen.getByLabelText('Mes')).toHaveValue('3')

    const revenueCard = screen.getByText('Receita do periodo').closest('article')
    const expenseCard = screen.getByText('Despesa do periodo').closest('article')
    const profitCard = screen.getByText('Lucro liquido').closest('article')

    expect(revenueCard).toHaveTextContent('R$ 1.500,00')
    expect(expenseCard).toHaveTextContent('R$ 300,00')
    expect(profitCard).toHaveTextContent('R$ 800,00')
  })

  it('permite ocultar e exibir valores pelo botao de visibilidade', async () => {
    const user = userEvent.setup()
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        category: 'Vendas',
        amount: 1200,
        description: 'Receita',
        date: '2026-03-10',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        category: 'Operacao',
        amount: 200,
        description: 'Despesa',
        date: '2026-03-11',
        isMonthlyCost: false
      }
    ])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Resumo executivo')
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar valores da dashboard' }))
    expect(screen.getAllByText('••••••').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Mostrar valores da dashboard' }))
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
  })
})
